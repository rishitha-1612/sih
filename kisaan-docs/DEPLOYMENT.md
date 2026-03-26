# Deployment Instructions

## Running Locally (for Hackathon Demo)
1. create a virtual environment 
2. Install the Python dependencies in your virtual environment:
   ```bash
   pip install -r requirements.txt
   ```
### 1. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd kisaan-backend
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   node server.js
   ```
   > The backend will start on `http://localhost:5000`. 

### 2. LLM service setup
1. Open a terminal and navigate to the Ragbot folder:
   ```bash
   cd kisaan-llm-service
   ```
2. Start the LLM service:
   ```bash
   python -m uvicorn main:app --port 8000
   ```
   > The LLM service will start on `http://localhost:8000`.

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd kisaan-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development engine:
   ```bash
   npm run dev
   ```
   > The frontend will be accessible typically at `http://localhost:5173`.

---

## 🌍 PWA Offline Mode Demo

To demonstrate the "Offline-First" capability during a hackathon:
1. Build the frontend for production:
   ```bash
   cd kisaan-frontend
   npm run build
   ```
2. Serve the built PWA using a local server (e.g., `serve`):
   ```bash
   npx serve dist
   ```
3. Open the app in Chrome, press `F12` to open DevTools.
4. Go to **Network** > Check **Offline**.
5. The application will continue to work! Data is persisted via Zustand with `localforage` (IndexedDB).

---
