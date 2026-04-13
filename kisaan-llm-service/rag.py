from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
import re
from typing import Any, Dict, List
from langchain_community.document_loaders import PyPDFLoader
import requests

from langchain_core.prompts import PromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter

from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
VECTORSTORE_DIR = BASE_DIR / "vectorstore"

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
TOP_K = 5

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma2:2b")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")

PROMPT_TEMPLATE = PROMPT_TEMPLATE = """You are a concise agriculture assistant for Indian farmers.
Answer in 3-5 sentences max. Be direct and practical.
Use the context below to answer the question.

Context:
{context}

Question:
{query}

Answer:"""

def clean_text(text: str) -> str:
    text = text.replace("\u2028", " ").replace("\u2029", " ")
    text = re.sub(r"\n+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def get_pdf_paths() -> List[Path]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    pdf_paths = sorted(DATA_DIR.glob("*.pdf"))
    if not pdf_paths:
        raise FileNotFoundError(f"No PDF files found in '{DATA_DIR}'.")
    return pdf_paths


def load_documents() -> List[Document]:
    all_documents: List[Document] = []
    for pdf_path in get_pdf_paths():
        loader = PyPDFLoader(str(pdf_path))
        documents = loader.load()
        for doc in documents:
            doc.page_content = clean_text(doc.page_content)
        all_documents.extend(documents)
    return all_documents


def split_documents(documents: List[Document]) -> List[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    return splitter.split_documents(documents)


@lru_cache(maxsize=1)
def get_chunks() -> List[Document]:
    return split_documents(load_documents())


@lru_cache(maxsize=1)
def get_embeddings():
    return HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)


@lru_cache(maxsize=1)
def get_vectorstore():
    embeddings = get_embeddings()
    if VECTORSTORE_DIR.exists():
        return FAISS.load_local(
            str(VECTORSTORE_DIR),
            embeddings,
            allow_dangerous_deserialization=True,
        )
    docs = load_documents()
    chunks = split_documents(docs)
    vectorstore = FAISS.from_documents(chunks, embeddings)
    VECTORSTORE_DIR.mkdir(parents=True, exist_ok=True)
    vectorstore.save_local(str(VECTORSTORE_DIR))
    return vectorstore


@lru_cache(maxsize=1)
def get_retriever():
    return get_vectorstore().as_retriever(search_kwargs={"k": TOP_K})


@lru_cache(maxsize=1)
def get_retriever_or_none():
    try:
        return get_retriever()
    except Exception:
        return None


def tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-zA-Z0-9]+", text.lower()))


def keyword_retrieve(query: str, k: int = TOP_K) -> List[Document]:
    query_tokens = tokenize(query)
    if not query_tokens:
        return []
    scored_docs: List[tuple[int, Document]] = []
    for doc in get_chunks():
        content_tokens = tokenize(doc.page_content)
        score = len(query_tokens & content_tokens)
        if score > 0:
            scored_docs.append((score, doc))
    scored_docs.sort(key=lambda item: item[0], reverse=True)
    return [doc for _, doc in scored_docs[:k]]


def build_context(documents: List[Document]) -> str:
    context_chunks = []
    for doc in documents:
        text = " ".join(doc.page_content.split()).strip()
        if text:
            context_chunks.append(text)
    return "\n\n".join(context_chunks)


def generate_with_ollama(prompt: str) -> str:
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.3},
            },
            timeout=180,
        )
        response.raise_for_status()
        payload = response.json()
        return str(payload.get("response", "")).strip()
    except requests.HTTPError as exc:
        detail = ""
        try:
            detail = exc.response.json().get("error", "")
        except Exception:
            detail = str(exc)
        raise RuntimeError(
            f"Ollama model '{OLLAMA_MODEL}' failed. {detail}".strip()
        ) from exc
    except requests.RequestException as exc:
        raise RuntimeError(
            "Could not connect to Ollama. Ensure Ollama is running on "
            f"{OLLAMA_BASE_URL} and the model '{OLLAMA_MODEL}' is installed."
        ) from exc


def build_prompt(query: str, context: str, language: str | None = None) -> str:
    lang_instruction = f"Respond in this language: {language.strip()}.\n" if language else ""
    template = lang_instruction + PROMPT_TEMPLATE
    return PromptTemplate.from_template(template).format(context=context, query=query)


def fallback_answer_from_context(context: str) -> str:
    compact = " ".join(context.split())
    if not compact:
        return "No data available"
    return compact[:700].strip()


def ask_question(query: str, language: str | None = None) -> str:
    query = query.strip()
    if not query:
        return "Please enter a valid question."
    retriever = get_retriever_or_none()
    if retriever is not None:
        docs = retriever.invoke(query)
    else:
        docs = keyword_retrieve(query, k=TOP_K)
    context = build_context(docs)
    if not context:
        return "No data available"
    prompt = build_prompt(query=query, context=context, language=language)
    try:
        response = generate_with_ollama(prompt)
    except RuntimeError as exc:
        fallback = fallback_answer_from_context(context)
        return f"{fallback}\n\n[Note: Local model unavailable: {exc}]"
    return response.strip() if response else "No data available"


def extract_last_user_message(messages: List[Dict[str, Any]]) -> str:
    for msg in reversed(messages):
        if str(msg.get("role", "")).lower() == "user":
            content = str(msg.get("content", "")).strip()
            if content:
                return content
    return ""


def ask_from_messages(messages: List[Dict[str, Any]], language: str | None = None) -> str:
    query = extract_last_user_message(messages)
    if not query:
        return "Please enter a valid question."
    return ask_question(query=query, language=language)


def run_cli():
    while True:
        query = input("You: ").strip()
        if query.lower() in ["exit", "quit"]:
            break
        try:
            answer = ask_question(query)
            print("Bot:", answer)
        except Exception as e:
            print("Error:", e)


if __name__ == "__main__":
    run_cli()