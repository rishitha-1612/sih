# KisaanKonnect — Smart Agriculture Assistant

KisaanKonnect is a comprehensive digital platform designed to empower farmers with AI-driven insights, real-time market data, and expert agricultural advice.

## Project Structure

The project is divided into three main components:

- **`kisaan-frontend/`**: A modern React.js application built with Vite and Tailwind CSS.
- **`kisaan-backend/`**: A Node.js and Express backend handling user authentication, data management, and integration.
- **`kisaan-llm-service/`**: A Python-based FastAPI service providing offline RAG (Retrieval-Augmented Generation) capabilities for the chatbot.

## Core Features

1.  **Crop Advisory**: Personalized fertilizer and crop recommendations based on soil parameters and weather.
2.  **Disease Detection**: AI-powered leaf disease identification using a custom CNN model.
3.  **Kisaan Mitra AI**: A smart chatbot for general farming queries (offline RAG).
4.  **Market Trends**: Real-time mandi prices and market trends for various crops.
5.  **Government Schemes**: Information on agricultural schemes like PMFBY.

## Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **Python**: v3.10 or higher
- **Package Managers**: npm, pip

### Installation & Setup

#### 1. Frontend Setup
```bash
cd kisaan-frontend
npm install
npm run dev
```

#### 2. Backend Setup
```bash
cd kisaan-backend
npm install
# Configure .env with your MongoDB URI if applicable
npm run dev
```

#### 3. AI (LLM) Service Setup
```bash
cd kisaan-llm-service
pip install -r requirements.txt
python -m uvicorn main:app --port 8000
```

## Technical Details

- **Frontend**: React 19, Vite, Zustand (State), Lucide (Icons), Framer Motion (Animations).
- **Backend**: Node.js, Express, MongoDB/Mongoose, Multer (Image Uploads).
- **AI Service**: FastAPI, FAISS (Vector DB), HuggingFace (Embeddings), Flan-T5 (LLM).

## License

This project is developed for educational purposes and smart agriculture initiatives.