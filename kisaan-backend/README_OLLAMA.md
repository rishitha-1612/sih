# Kisaan Mitra AI: Setup Guide

The app's AI features are powered by a **FastAPI service** that uses **Groq's free cloud-hosted Llama 3** — no Ollama installation or model downloads required.

## Architecture

```
Frontend (React)
      │
      ▼
Node.js Backend (port 5000)
      │
      ▼
FastAPI LLM Service (port 8000)  ←── Groq Cloud API (Llama 3)
```

## 1. Set Up the FastAPI LLM Service

Go to the `kisaan-llm-service/` folder and follow the steps in its [README](../kisaan-llm-service/README.md):

```powershell
cd kisaan-llm-service

# 1. Get a free Groq API key at https://console.groq.com
# 2. Create a .env file with your key:
#    GROQ_API_KEY=gsk_your_actual_key_here

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**That's it!** The service is now running at http://localhost:8000

## 2. Start the Node.js Backend

```powershell
cd kisaan-backend
node server.js
```

## 3. Start the Frontend

```powershell
cd kisaan-frontend
npm run dev
```

## Configuration

To point the backend to a deployed FastAPI service (e.g. Render, Railway), update `kisaan-backend/.env`:

```
LLM_SERVICE_URL=https://your-service.onrender.com
```

## AI Features

| Feature                  | Model                                    | Free? |
|--------------------------|------------------------------------------|-------|
| Kisaan Mitra Chat        | Llama 3.1 8B (`llama-3.1-8b-instant`)  | ✅ Yes |
| Crop Disease Image Scan  | Llama 4 Scout Vision                    | ✅ Yes |

## Troubleshooting

- **⚠️ AI service unavailable**: Make sure the FastAPI service is running (`uvicorn main:app --port 8000`) and `GROQ_API_KEY` is set in `kisaan-llm-service/.env`.
- **Rate limits**: Groq free tier has generous limits (14,400 requests/day). For production, consider upgrading.
