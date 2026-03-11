"""
download_model.py — Downloads TinyLlama GGUF model (~700 MB, one-time setup)
Run: python download_model.py
"""
import sys
from pathlib import Path

MODELS_DIR = Path(__file__).parent / "models"
MODEL_FILENAME = "TinyLlama-1.1B-Chat-v1.0.Q4_K_M.gguf"
MODEL_PATH = MODELS_DIR / MODEL_FILENAME

REPO_ID = "TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF"
FILENAME = "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"


def download():
    if MODEL_PATH.exists():
        print(f"[OK] Model already exists at: {MODEL_PATH}")
        print("No download needed. Start the server with: uvicorn main:app --reload --port 8000")
        return

    print("Downloading TinyLlama GGUF model (~700 MB)...")
    print(f"Source: huggingface.co/{REPO_ID}")
    print(f"Destination: {MODEL_PATH}")
    print()

    try:
        from huggingface_hub import hf_hub_download
    except ImportError:
        print("ERROR: huggingface_hub not installed.")
        print("Run: pip install huggingface_hub")
        sys.exit(1)

    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    try:
        downloaded_path = hf_hub_download(
            repo_id=REPO_ID,
            filename=FILENAME,
            local_dir=str(MODELS_DIR),
        )
        # Rename to the name main.py expects
        src = Path(downloaded_path)
        if src.name != MODEL_FILENAME:
            src.rename(MODEL_PATH)
        print()
        print(f"[OK] Model downloaded to: {MODEL_PATH}")
        print()
        print("Next step — start the FastAPI server:")
        print("  uvicorn main:app --reload --port 8000")
    except Exception as e:
        print(f"Download failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    download()
