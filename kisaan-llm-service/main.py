"""
main.py — FastAPI server
Handles: HTTP endpoints, CORS, startup/shutdown
RAG logic lives in ragbot.py
"""

import json
import re
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

from ragbot import init_rag, ask

# =============================================
# STARTUP / SHUTDOWN
# =============================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[Kisaan AI] Server starting — initializing RAG pipeline...")
    try:
        init_rag()
        print("[Kisaan AI] Server is ready and accepting requests.")
    except Exception as e:
        print(f"[Kisaan AI] WARNING: Could not initialize RAG pipeline: {e}")
    yield
    print("[Kisaan AI] Server shutting down.")

# =============================================
# APP
# =============================================
app = FastAPI(
    title="Kisaan Mitra AI (RAG)",
    description="Offline FastAPI RAG service — FAISS + Flan-T5. No API keys needed.",
    version="3.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================
# PYDANTIC MODELS
# Same shape as before — api.js unchanged
# =============================================
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    language: str = "en"

class ChatResponse(BaseModel):
    reply: str

class ImageAnalysisRequest(BaseModel):
    image_base64: str

class ImageAnalysisResponse(BaseModel):
    diseasePredicted: str
    confidence: str
    treatment: str

# =============================================
# ENDPOINTS
# =============================================
@app.get("/")
def root():
    return {"status": "ok", "model": "flan-t5-small + FAISS RAG"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Extract latest user message
        user_message = ""
        for msg in reversed(request.messages):
            if msg.role == "user":
                user_message = msg.content
                break

        if not user_message:
            raise HTTPException(status_code=400, detail="No user message found.")

        reply = ask(user_message, language=request.language)
        return ChatResponse(reply=reply)

    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG error: {e}")


@app.post("/analyze-image", response_model=ImageAnalysisResponse)
async def analyze_image(request: ImageAnalysisRequest):
    # Your CNN handles actual image analysis in PlantDiseaseDetection page.
    # This stub keeps api.js from getting a 404.
    return ImageAnalysisResponse(
        diseasePredicted="Please use the Plant Disease Detection page",
        confidence="N/A",
        treatment="Image analysis is handled by the CNN model in the Plant Disease Detection section."
    )
