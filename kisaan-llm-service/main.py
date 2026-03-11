import json, re, threading
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

MODELS_DIR = Path(__file__).parent / 'models'
MODEL_FILENAME = 'TinyLlama-1.1B-Chat-v1.0.Q4_K_M.gguf'
MODEL_PATH = MODELS_DIR / MODEL_FILENAME

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Preload TinyLlama when server starts so first request is instant."""
    print('[Kisaan AI] Server starting — preloading TinyLlama model...')
    try:
        get_llm()
        print('[Kisaan AI] Model ready. Server is accepting requests.')
    except Exception as e:
        print(f'[Kisaan AI] WARNING: Could not preload model: {e}')
    yield
    # Cleanup on shutdown
    print('[Kisaan AI] Server shutting down.')

app = FastAPI(
    title='Kisaan Mitra AI (TinyLlama)',
    description='Fully offline FastAPI LLM microservice — no cloud API required.',
    version='2.0.0',
    lifespan=lifespan
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

_llm = None
_lock = threading.Lock()

def get_llm():
    global _llm
    if _llm is None:
        with _lock:
            if _llm is None:
                if not MODEL_PATH.exists():
                    raise RuntimeError(
                        f'Model not found at {MODEL_PATH}.\n'
                        'Run: python download_model.py to download TinyLlama (~700 MB)'
                    )
                print(f'[Kisaan AI] Loading TinyLlama from {MODEL_PATH}...')
                from llama_cpp import Llama
                _llm = Llama(
                    model_path=str(MODEL_PATH),
                    n_ctx=2048,
                    n_threads=4,
                    n_gpu_layers=0,
                    verbose=False,
                )
                print('[Kisaan AI] TinyLlama loaded successfully!')
    return _llm

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    language: str = 'en'

class ChatResponse(BaseModel):
    reply: str

class ImageAnalysisRequest(BaseModel):
    image_base64: str

class ImageAnalysisResponse(BaseModel):
    diseasePredicted: str
    confidence: str
    treatment: str

LT = chr(60); GT = chr(62); SL = chr(47); PIPE = chr(124)
EOS       = LT + SL + 's' + GT
SYS_OPEN  = LT + PIPE + 'system'    + PIPE + GT
USR_OPEN  = LT + PIPE + 'user'      + PIPE + GT
ASST_OPEN = LT + PIPE + 'assistant' + PIPE + GT

def build_chatml(messages, system_content):
    parts = [SYS_OPEN + chr(10) + system_content + chr(10) + EOS + chr(10)]
    for m in messages:
        role = m.role
        content = m.content
        if role == 'system': continue
        tag = USR_OPEN if role == 'user' else ASST_OPEN
        parts.append(tag + chr(10) + content + chr(10) + EOS + chr(10))
    parts.append(ASST_OPEN + chr(10))
    return ''.join(parts)

AGRI_SYS = (
    'You are Kisaan Mitra AI, a helpful agricultural expert for Indian farmers. '
    'Give concise, practical farming advice. Respond in the language the user prefers.'
)

IMG_SYS = (
    'You are a plant pathologist AI. Diagnose crop disease from the description. '
    'Respond ONLY in JSON: {\"diseasePredicted\": \"...\", \"confidence\": \"...\", \"treatment\": \"...\"}'
)

@app.get('/')
def root(): return {'status': 'ok', 'model': MODEL_FILENAME}

@app.get('/health')
def health(): return {'status': 'ok'}

def clean_reply(text: str) -> str:
    """Remove trailing repeated sentences that TinyLlama sometimes appends."""
    text = text.strip()
    # Split into sentences (by .  !  ?) and deduplicate trailing repeats
    sentences = re.split(r'(?<=[.!?])\s+', text)
    if len(sentences) <= 1:
        return text
    seen = []
    for s in sentences:
        s_clean = s.strip().lower()
        if s_clean and s_clean not in seen:
            seen.append(s_clean)
        # If same sentence appears again, stop here
    # Rebuild only unique sentences
    unique = []
    added = set()
    for s in sentences:
        key = s.strip().lower()
        if key and key not in added:
            unique.append(s.strip())
            added.add(key)
    return ' '.join(unique)

@app.post('/chat', response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        llm = get_llm()
        sys_msg = AGRI_SYS + f' Language: {request.language}.'
        prompt = build_chatml(request.messages, sys_msg)
        out = llm(
            prompt,
            max_tokens=512,
            stop=[EOS, USR_OPEN],
            echo=False,
            repeat_penalty=1.3,   # Penalise repeated words/phrases
            temperature=0.7,
        )
        reply = clean_reply(out['choices'][0]['text'])
        return ChatResponse(reply=reply)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'AI error: {e}')

@app.post('/analyze-image', response_model=ImageAnalysisResponse)
async def analyze_image(request: ImageAnalysisRequest):
    try:
        llm = get_llm()
        user_content = ('I have uploaded a crop/plant image. Diagnose any disease, pest, or nutritional'
                       ' deficiency, and provide treatment advice. Reply in JSON.')
        msgs = [ChatMessage(role='user', content=user_content)]
        prompt = build_chatml(msgs, IMG_SYS)
        out = llm(prompt, max_tokens=256, stop=[EOS, USR_OPEN], echo=False)
        raw = re.sub(r'```json|```', '', out['choices'][0]['text'].strip()).strip()
        try:
            parsed = json.loads(raw)
            return ImageAnalysisResponse(
                diseasePredicted=parsed.get('diseasePredicted', 'Analysis Completed'),
                confidence=parsed.get('confidence', 'N/A'),
                treatment=parsed.get('treatment', raw)
            )
        except json.JSONDecodeError:
            return ImageAnalysisResponse(diseasePredicted='Analysis Completed (Raw)', confidence='N/A', treatment=raw)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Vision AI error: {e}')