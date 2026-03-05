import os
import sys
import json
import numpy as np
from PIL import Image

# Suppress TensorFlow logs
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

# Force pure-python implementation for protobuf (Windows compatibility)
os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'


def get_tf():
    try:
        import tensorflow as tf
        return tf
    except ImportError:
        return None


# Disease treatment recommendations
recommendations = {
    "Apple___Apple_scab": "Choose resistant varieties. Rake and destroy infected leaves. Water early morning (avoid overhead).",
    "Apple___Black_rot": "Prune dead/diseased branches. Remove infected material. Remove dead stumps.",
    "Apple___Cedar_apple_rust": "Prune juniper galls nearby. Remove branches 4-6 inches below galls.",
    "Tomato___Early_blight": "Apply mancozeb-based fungicides. Remove lower leaves to prevent splash infection.",
    "Potato___Late_blight": "Apply chlorothalonil or copper-based fungicides. Ensure good air circulation.",
    "Corn_(maize)___Common_rust_": "Use resistant hybrids. Apply fungicides like mancozeb if infection is severe.",
    "Grape___Black_rot": "Prune infected vines and remove mummified berries. Apply fungicides early in the season.",
    "healthy": "Your crop is healthy! Maintain regular watering and nutrition."
}


def predict(image_path):

    working_dir = os.path.dirname(os.path.abspath(__file__))

    model_path = os.path.join(working_dir, "plant_disease_prediction_model.h5")
    class_indices_path = os.path.join(working_dir, "class_indices.json")

    # Load TensorFlow
    tf = get_tf()

    if not os.path.exists(model_path):
        return {"error": "Model file not found."}

    if tf is None:
        return {"error": "TensorFlow is not installed."}

    # Load class indices
    with open(class_indices_path, "r") as f:
        class_indices = json.load(f)

    # Reverse mapping (index → class name)
    idx_to_class = {v: k for k, v in class_indices.items()}

    # Load model
    model = tf.keras.models.load_model(model_path)

    # Preprocess image
    img = Image.open(image_path).convert("RGB")
    img = img.resize((224, 224))

    img_array = np.array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = img_array.astype("float32") / 255.0

    # Predict
    predictions = model.predict(img_array, verbose=0)

    class_idx = int(np.argmax(predictions, axis=1)[0])
    class_name = idx_to_class.get(class_idx, "Unknown___Unknown")

    confidence = f"{round(float(np.max(predictions)) * 100, 2)}%"

    # Parse plant and disease
    if "___" in class_name:
        plant, disease = class_name.split("___")
    else:
        plant, disease = "Unknown", class_name

    # Treatment lookup
    treatment = "Consult an agronomist for specific treatment advice."

    for key in recommendations:
        if key.lower() in class_name.lower():
            treatment = recommendations[key]
            break

    result = {
        "plant": plant.replace("_", " "),
        "disease": disease.replace("_", " "),
        "confidence": confidence,
        "treatment": treatment
    }

    return result


if __name__ == "__main__":

    if len(sys.argv) > 1:

        image_path = sys.argv[1]

        try:
            result = predict(image_path)
            print(json.dumps(result))

        except Exception as e:
            print(json.dumps({
                "error": str(e)
            }))