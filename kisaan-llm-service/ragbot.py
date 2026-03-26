"""
ragbot.py - RAG pipeline module
Handles: CSV loading, FAISS DB, embeddings, Flan-T5 generation
Used by: main.py
"""

import os
import re
import threading
from importlib import import_module
from pathlib import Path

import pandas as pd

# =============================================
# CONFIGURATION
# =============================================
BASE_DIR = Path(__file__).parent

DB_PATH = str(BASE_DIR / "faiss_agriculture_db")

CSV_FILES = [
    str(BASE_DIR / "crop_recommendation.csv"),
    # str(BASE_DIR / "raw_districtwise_yield_data.csv"), # Too large for local CPU indexing (246k rows)
    str(BASE_DIR / "cpdata.csv"),
    str(BASE_DIR / "MergeFileCrop.csv"),
    str(BASE_DIR / "FertilizerData.csv"),
    str(BASE_DIR / "fertilizer.csv"),
]

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
LLM_MODEL = "google/flan-t5-small"
BATCH_SIZE = 5
MAX_CONTEXT_LEN = 1000
RETRIEVE_TOP_K = 3
MAX_NEW_TOKENS = 200

# =============================================
# GLOBAL STATE
# =============================================
_retriever = None
_tokenizer = None
_model = None
_torch = None
_fallback_docs = []
_using_fallback = False
_lock = threading.Lock()

_STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how",
    "i", "in", "is", "it", "me", "of", "on", "or", "our", "please", "the",
    "to", "what", "when", "where", "which", "with", "you", "your",
}


def _missing_dependency_error(package: str, exc: Exception) -> RuntimeError:
    return RuntimeError(
        f"Missing dependency '{package}'. Install the LLM service requirements with "
        f"`.venv\\Scripts\\python.exe -m pip install -r kisaan-llm-service\\requirements.txt`. "
        f"Original error: {exc}"
    )


def _full_pipeline_dependencies_available() -> tuple[bool, str]:
    modules = [
        "langchain_community.embeddings",
        "langchain_community.vectorstores",
        "langchain_core.documents",
        "transformers",
        "torch",
    ]

    for module_name in modules:
        try:
            import_module(module_name)
        except Exception as exc:
            return False, f"{module_name}: {exc}"

    return True, ""


def _tokenize(text: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[a-z0-9]+", text.lower())
        if len(token) > 2 and token not in _STOPWORDS
    }


def _load_csv_chunks() -> list[dict]:
    documents = []

    for filepath in CSV_FILES:
        if not os.path.exists(filepath):
            print(f"[RAG] Skipping (not found): {filepath}")
            continue

        try:
            print(f"[RAG] Reading: {os.path.basename(filepath)}")
            df = pd.read_csv(filepath, encoding="utf-8", on_bad_lines="skip")
            df = df.dropna(how="all").fillna("")

            for i in range(0, len(df), BATCH_SIZE):
                batch = df.iloc[i:i + BATCH_SIZE]
                text = f"Source: {os.path.basename(filepath)}\n"
                text += "\n".join(
                    " | ".join([f"{k}: {v}" for k, v in row.items()])
                    for row in batch.to_dict("records")
                )
                documents.append(
                    {
                        "content": text,
                        "tokens": _tokenize(text),
                        "source": os.path.basename(filepath),
                    }
                )
        except Exception as e:
            print(f"[RAG] Error reading {filepath}: {e}")

    return documents


def init_fallback_rag():
    global _fallback_docs, _using_fallback

    print("[RAG] Falling back to lightweight CSV retrieval mode.")
    _fallback_docs = _load_csv_chunks()
    _using_fallback = True

    if not _fallback_docs:
        raise RuntimeError(
            "No CSV documents loaded. Place your CSV files in the kisaan-llm-service folder."
        )

    print(f"[RAG] Lightweight mode ready with {len(_fallback_docs)} document chunks.")


def _retrieve_fallback_context(question: str) -> list[dict]:
    question_tokens = _tokenize(question)
    if not question_tokens:
        return _fallback_docs[:RETRIEVE_TOP_K]

    ranked = []
    for doc in _fallback_docs:
        overlap = len(question_tokens & doc["tokens"])
        if overlap:
            ranked.append((overlap, doc))

    ranked.sort(key=lambda item: item[0], reverse=True)
    return [doc for _, doc in ranked[:RETRIEVE_TOP_K]]


def _format_fallback_answer(question: str, language: str = "en") -> str:
    matches = _retrieve_fallback_context(question)
    if not matches:
        return (
            "I could not find a close match in the local agriculture dataset. "
            "Please mention the crop, soil, season, rainfall, or fertilizer issue."
        )

    lead = "Based on the local agriculture data, here are the closest matches:"
    if language and language.lower() not in ("en", "english"):
        lead = (
            f"Responding in {language}: based on the local agriculture data, "
            "here are the closest matches:"
        )

    snippets = []
    for doc in matches:
        cleaned = " ".join(doc["content"].split())
        snippets.append(f"[{doc['source']}] {cleaned[:280]}")

    return lead + "\n\n" + "\n\n".join(snippets)


# =============================================
# STEP 1 - EMBEDDINGS
# =============================================
def load_embeddings():
    try:
        from langchain_community.embeddings import HuggingFaceEmbeddings
    except ModuleNotFoundError as exc:
        raise _missing_dependency_error("langchain-community", exc) from exc

    print("[RAG] Loading embedding model...")
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    print("[RAG] Embedding model ready!")
    return embeddings


# =============================================
# STEP 2 - FAISS DATABASE
# =============================================
def load_or_build_db(embeddings):
    try:
        from langchain_community.vectorstores import FAISS
        from langchain_core.documents import Document
    except ModuleNotFoundError as exc:
        raise _missing_dependency_error("langchain/faiss", exc) from exc

    if os.path.exists(DB_PATH):
        print("[RAG] Loading existing FAISS database...")
        db = FAISS.load_local(
            DB_PATH,
            embeddings,
            allow_dangerous_deserialization=True,
        )
        print("[RAG] FAISS database loaded!")
        return db

    print("[RAG] Building FAISS database from CSV files...")
    documents = [
        Document(page_content=doc["content"])
        for doc in _load_csv_chunks()
    ]

    if not documents:
        raise RuntimeError(
            "No CSV documents loaded. Place your CSV files in the kisaan-llm-service folder."
        )

    print(f"[RAG] {len(documents)} document chunks created")
    print("[RAG] Generating embeddings (runs once, may take a few minutes)...")
    db = FAISS.from_documents(documents, embeddings)
    db.save_local(DB_PATH)
    print("[RAG] FAISS database saved!")
    return db


# =============================================
# STEP 3 - FLAN-T5 MODEL
# =============================================
def load_llm():
    global _torch

    try:
        import torch
        from transformers import T5ForConditionalGeneration, T5Tokenizer
    except ModuleNotFoundError as exc:
        missing_name = getattr(exc, "name", "required package")
        raise _missing_dependency_error(missing_name, exc) from exc

    print(f"[RAG] Loading {LLM_MODEL} (~300MB, downloads once)...")
    tokenizer = T5Tokenizer.from_pretrained(LLM_MODEL)
    model = T5ForConditionalGeneration.from_pretrained(LLM_MODEL)
    model.eval()
    _torch = torch
    print("[RAG] Flan-T5 model ready!")
    return tokenizer, model


# =============================================
# STEP 4 - INITIALIZE FULL PIPELINE
# =============================================
def init_rag():
    """
    Initialize the full RAG pipeline.
    Called once at server startup from main.py lifespan.
    """
    global _retriever, _tokenizer, _model, _using_fallback

    with _lock:
        if _retriever is not None or _using_fallback:
            return

        available, reason = _full_pipeline_dependencies_available()
        if not available:
            print(f"[RAG] Full pipeline unavailable: {reason}")
            init_fallback_rag()
            return

        try:
            embeddings = load_embeddings()
            db = load_or_build_db(embeddings)
            _retriever = db.as_retriever(search_kwargs={"k": RETRIEVE_TOP_K})
            _tokenizer, _model = load_llm()
            print("[RAG] Pipeline fully ready!")
        except Exception as e:
            print(f"[RAG] Full pipeline unavailable: {e}")
            init_fallback_rag()


# =============================================
# STEP 5 - ASK FUNCTION
# =============================================
def ask(question: str, language: str = "en") -> str:
    """
    Retrieve relevant context from FAISS
    and generate an answer using Flan-T5.
    """
    q_lower = question.lower().strip().strip("?!.")
    greetings = ["hi", "hello", "hey", "namaste", "hola", "hi there", "hello there"]
    if q_lower in greetings:
        return "Namaste! I am Kisaan Mitra, your AI agriculture assistant. How can I help you with your farm today?"

    if _using_fallback:
        return _format_fallback_answer(question, language=language)

    if _retriever is None or _tokenizer is None or _model is None or _torch is None:
        raise RuntimeError("RAG pipeline not initialized. Call init_rag() first.")

    docs = _retriever.invoke(question)
    context = "\n\n".join([doc.page_content[:MAX_CONTEXT_LEN] for doc in docs])

    prompt = f"context: {context} question: {question} answer:"

    inputs = _tokenizer(
        prompt,
        return_tensors="pt",
        max_length=512,
        truncation=True,
    )

    with _torch.no_grad():
        outputs = _model.generate(
            inputs["input_ids"],
            max_new_tokens=MAX_NEW_TOKENS,
            num_beams=4,
            early_stopping=True,
        )

    answer = _tokenizer.decode(outputs[0], skip_special_tokens=True)
    return answer.strip() or "I don't have enough information to answer that."
