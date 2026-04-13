from __future__ import annotations

from typing import List, Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from rag import ask_from_messages


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"] = "user"
    content: str = Field(default="")


class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(default_factory=list)
    language: str | None = None


class ChatResponse(BaseModel):
    reply: str


class ImageAnalysisRequest(BaseModel):
    image_base64: str


class ImageAnalysisResponse(BaseModel):
    diseasePredicted: str
    confidence: str
    treatment: str


app = FastAPI(title="Kisaan LLM Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict:
    return {"status": "ok", "service": "kisaan-llm-rag"}


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    try:
        reply = ask_from_messages(
            messages=[m.model_dump() for m in payload.messages],
            language=payload.language,
        )
        return ChatResponse(reply=reply)
    except FileNotFoundError:
        return ChatResponse(
            reply=(
                "No local knowledge PDFs found. Add files to "
                "`kisaan-llm-service/data/` and ask again."
            )
        )
    except Exception as exc:
        return ChatResponse(
            reply=(
                "RAG service is temporarily unavailable. "
                f"Reason: {str(exc)}"
            )
        )


@app.post("/analyze-image", response_model=ImageAnalysisResponse)
def analyze_image(_: ImageAnalysisRequest) -> ImageAnalysisResponse:
    return ImageAnalysisResponse(
        diseasePredicted="Use Plant Disease Detection page",
        confidence="N/A",
        treatment="Image analysis is handled by the CNN model endpoint in backend /api/detection/detect.",
    )