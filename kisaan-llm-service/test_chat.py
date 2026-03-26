import requests
import sys

def test_chat(q):
    try:
        url = "http://localhost:8000/chat"
        payload = {
            "messages": [{"role": "user", "content": q}],
            "language": "en"
        }
        res = requests.post(url, json=payload, timeout=60)
        print(f"Q: {q}")
        print(f"A: {res.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    msg = sys.argv[1] if len(sys.argv) > 1 else "What fertilizer for cotton?"
    test_chat(msg)
