# KisaanKonnect - Smart Agriculture Assistant

KisaanKonnect is a digital agriculture platform built to support farmers with AI-driven insights, crop guidance, disease detection, market awareness, and an offline knowledge-based chatbot.

## Project Structure

- **`kisaan-frontend/`**: React application built with Vite.
- **`kisaan-backend/`**: Node.js and Express backend for APIs, auth, and app data.
- **`kisaan-llm-service/`**: Python offline RAG service for agriculture question answering using PDF documents, FAISS, HuggingFace embeddings, and Ollama Gemma.

## Core Features

1. **Crop Advisory**: Personalized fertilizer and crop recommendations.
2. **Disease Detection**: AI-based plant disease prediction from images.
3. **Kisaan Mitra AI**: Offline RAG chatbot grounded in agriculture PDFs.
4. **Market Trends**: Crop market and mandi-related information.
5. **Government Schemes**: Farmer-focused scheme awareness and support.

## Prerequisites

- **Node.js**: v18 or higher
- **Python**: v3.10 or higher
- **Package Managers**: `npm`, `pip`
- **MongoDB**: running and reachable from `kisaan-backend/.env` (`MONGO_URI`)
- **Ollama**: installed locally

## One-Time Setup

### 1) Install Python dependencies (root)

```bash
cd Kisaan-Konnect
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 2) Install Node dependencies

```bash
cd kisaan-backend
npm install

cd ..\kisaan-frontend
npm install
```

### 3) Prepare Ollama model

Current default in RAG service:

```bash
set OLLAMA_MODEL=gemma4:31b-cloud
```

If you want local inference on low-memory machines, use:

```bash
ollama pull gemma3:1b
set OLLAMA_MODEL=gemma3:1b
```

## Run the App (3 terminals)

### Terminal A - LLM service (FastAPI RAG)

```bash
cd Kisaan-Konnect
.venv\Scripts\activate
cd kisaan-llm-service
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Terminal B - Backend (Express)

```bash
cd Kisaan-Konnect\kisaan-backend
npm run dev
```

### Terminal C - Frontend (Vite)

```bash
cd Kisaan-Konnect\kisaan-frontend
npm run dev
```

If PowerShell blocks `npm`, use:

```bash
npm.cmd run dev
```

## Quick Health Checks

- LLM health: `http://127.0.0.1:8000/health`
- Backend health: `http://127.0.0.1:5000/health`
- Frontend: usually `http://127.0.0.1:5173`

## RAG Behavior Notes

1. Place one or more agriculture PDFs inside `kisaan-llm-service/data/`.
2. Service tries FAISS + sentence-transformer retrieval first.
3. If embedding download is blocked, it falls back to offline keyword retrieval.
4. If Ollama model is unavailable / too large for RAM, the API still responds with retrieved context plus a note.
5. To rebuild vectors after PDF updates, delete `kisaan-llm-service/vectorstore/`.

## Technical Stack

- **Frontend**: React, Vite, Zustand
- **Backend**: Node.js, Express, MongoDB/Mongoose
- **AI Service**: Python, FastAPI, LangChain, FAISS, Ollama

## Notes

- Backend now waits for MongoDB before accepting requests.
- `/api/chat` and `/api/upload-image` both depend on LLM service at `http://localhost:8000`.
- `/analyze-image` in LLM service is a compatibility stub for the chat image-upload flow.
- If advisory ML `.pkl` files are missing, `/api/advisory/recommend` now returns a CSV-based fallback recommendation instead of crashing.

## License

This project is intended for educational and smart agriculture use cases.
