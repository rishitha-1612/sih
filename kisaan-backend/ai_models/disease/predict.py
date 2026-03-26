import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

import sys
import json
import numpy as np
from PIL import Image

# ✅ USE TensorFlow keras ONLY
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

# Paths
_DIR = os.path.dirname(os.path.abspath(__file__))

# 🔥 IMPORTANT: USE YOUR .h5 MODEL HERE
MODEL_PATH = os.path.join(_DIR, "plant_disease_prediction_model.h5")   # <-- CHANGE NAME IF DIFFERENT
CLASS_PATH = os.path.join(_DIR, "class_indices.json")

IMG_SIZE = 224

# =============================================
# TREATMENT DATABASE
# =============================================
TREATMENTS = {
    "healthy": "Your crop looks healthy! Continue regular watering, fertilization, and pest monitoring.",
    "default": "Consult your local agricultural extension officer. Consider applying a broad-spectrum fungicide and monitor the crop closely."
}

def get_treatment(raw_class: str) -> str:
    lower = raw_class.lower().replace("___", " ").replace("_", " ")

    if "healthy" in lower:
        return TREATMENTS["healthy"]

    for key in TREATMENTS:
        if key in lower:
            return TREATMENTS[key]

    return TREATMENTS["default"]

# =============================================
# MODEL LOAD (FINAL FIX)
# =============================================
try:
    model = load_model(MODEL_PATH, compile=False)

    with open(CLASS_PATH) as f:
        class_indices = json.load(f)

except Exception as e:
    print(json.dumps({"error": f"Model initialization failed: {str(e)}"}))
    sys.exit(1)

# =============================================
# IMAGE PREPROCESSING
# =============================================
def preprocess_image(path: str):
    img = Image.open(path).convert("RGB")
    img = img.resize((IMG_SIZE, IMG_SIZE))
    arr = np.array(img)
    arr = np.expand_dims(arr, axis=0)
    return preprocess_input(arr.astype("float32"))

# =============================================
# NAME FORMATTER
# =============================================
def format_name(raw: str) -> str:
    try:
        plant, disease = raw.split("___")
        plant   = plant.replace("_", " ")
        disease = disease.replace("_", " ")

        if disease.lower() == "healthy":
            return f"{plant} (Healthy)"

        return f"{plant} - {disease}"
    except:
        return raw

# =============================================
# PREDICT
# =============================================
def predict(image_path: str) -> dict:
    try:
        img   = preprocess_image(image_path)
        preds = model.predict(img, verbose=0)

        idx   = int(np.argmax(preds))
        raw   = class_indices[str(idx)]

        return {
            "disease": format_name(raw),
            "confidence": round(float(np.max(preds)) * 100, 2),
            "treatment": get_treatment(raw)
        }

    except Exception as e:
        return {"error": f"Prediction error: {str(e)}"}

# =============================================
# ENTRY POINT
# =============================================
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)

    image_path = sys.argv[1]

    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image not found: {image_path}"}))
        sys.exit(1)

    result = predict(image_path)
    print(json.dumps(result))