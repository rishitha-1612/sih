# Kisaan Mitra AI — LLM Service (FastAPI + TinyLlama Local)

Runs your AI chatbot **completely offline**. No Ollama, no cloud APIs, no OpenAI.

Uses **TinyLlama 1.1B** — a small, fast LLM that runs on CPU with only ~700 MB RAM.

---

## Quick Start

### Step 1 — Install Dependencies
```powershell
pip install fastapi uvicorn llama-cpp-python huggingface_hub python-multipart
```

### Step 2 — Download the TinyLlama Model (~700 MB, one-time)
```powershell
cd kisaan-llm-service
python download_model.py
```
This downloads `TinyLlama-1.1B-Chat-v1.0.Q4_K_M.gguf` from HuggingFace into the `models/` folder.

### Step 3 — Start the FastAPI Server
```powershell
uvicorn main:app --reload --port 8000
```

The AI service will be running at **http://localhost:8000**

---

## How It Works

```
React Frontend
      │
      ▼
Node.js (port 5000)
      │
      ▼
FastAPI (port 8000) ──► TinyLlama 1.1B (local, no internet)
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/chat` | POST | Text chat with TinyLlama |
| `/analyze-image` | POST | Crop image diagnosis |

### POST `/chat`
```json
Request:  { "messages": [{"role": "user", "content": "Best fertilizer for wheat?"}], "language": "en" }
Response: { "reply": "For wheat, use urea at the rate of..." }
```

### POST `/analyze-image`
```json
Request:  { "image_base64": "<base64 string>" }
Response: { "diseasePredicted": "Early Blight", "confidence": "85%", "treatment": "..." }
```

---

## System Requirements

| Component | Minimum |
|-----------|---------|
| RAM | 4 GB (model uses ~1 GB) |
| Storage | 700 MB for model |
| CPU | Any modern x64 CPU |
| GPU | Optional (set `n_gpu_layers=-1` in main.py for CUDA) |

---

## Troubleshooting

- **Model not found error** → Run `python download_model.py` first
- **Slow responses** → Increase `n_threads` in `main.py` to match your CPU cores
- **GPU acceleration** → Install `llama-cpp-python` with CUDA: `CMAKE_ARGS="-DGGML_CUDA=on" pip install llama-cpp-python`
