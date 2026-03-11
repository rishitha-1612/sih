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


# Treatments keyed EXACTLY as they appear in class_indices.json
recommendations = {
    "Pepper__bell___Bacterial_spot": "Apply copper-based bactericides (copper hydroxide) weekly. Avoid working in the field when wet. Remove infected plant parts promptly. Rotate crops — avoid peppers and tomatoes in the same spot for 2+ years.",
    "Pepper__bell___healthy": "Your bell pepper plant is healthy! Ensure consistent watering, calcium-rich fertilization to prevent blossom end rot, and staking for support.",

    "Potato___Early_blight": "Apply fungicides containing chlorothalonil or mancozeb at first sign of symptoms. Remove lower infected leaves. Rotate crops annually. Avoid overhead irrigation.",
    "Potato___Late_blight": "Apply chlorothalonil or copper-based fungicides preventatively. Destroy infected plants immediately. Do not compost infected material. Plant certified seed potatoes next season.",
    "Potato___healthy": "Your potato crop is healthy! Hill soil against stems, irrigate consistently, and harvest when tops begin to die back.",

    "Tomato_Bacterial_spot": "Use copper-based bactericides weekly. Remove infected leaves. Avoid overhead irrigation. Rotate crops — do not plant tomatoes/peppers in the same bed for 2 years.",
    "Tomato_Early_blight": "Apply mancozeb or chlorothalonil fungicide. Remove lower infected leaves. Mulch around plants to prevent soil splash. Stake plants for better airflow.",
    "Tomato_Late_blight": "Apply copper-based or chlorothalonil fungicides immediately. Remove and bag infected plant material — do not compost. Increase plant spacing for airflow.",
    "Tomato_Leaf_Mold": "Improve ventilation in greenhouses. Apply fungicides (chlorothalonil). Avoid wetting foliage. Remove infected leaves promptly.",
    "Tomato_Septoria_leaf_spot": "Remove infected leaves. Apply fungicides (mancozeb, chlorothalonil). Avoid overhead watering. Rotate crops and remove plant debris at season end.",
    "Tomato_Spider_mites_Two_spotted_spider_mite": "Apply neem oil, insecticidal soap, or miticides (abamectin). Increase humidity around plants. Spray undersides of leaves. Introduce predatory mites as biological control.",
    "Tomato__Target_Spot": "Apply fungicides (azoxystrobin, chlorothalonil). Remove infected leaves. Improve air circulation by pruning and staking. Avoid wetting foliage.",
    "Tomato__Tomato_YellowLeaf__Curl_Virus": "No cure — remove and destroy infected plants immediately. Control whitefly with reflective mulch and yellow sticky traps. Use insecticides (imidacloprid) on remaining plants. Plant resistant varieties.",
    "Tomato__Tomato_mosaic_virus": "No cure — remove and destroy infected plants. Disinfect tools with 10% bleach solution. Wash hands before handling plants. Control aphids. Plant resistant varieties.",
    "Tomato_healthy": "Your tomato plant is healthy! Water consistently at the base, fertilize every 2 weeks with balanced fertilizer, and stake or cage for support.",
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

    # Treatment lookup — direct key match against class_indices.json
    treatment = recommendations.get(
        class_name,
        "Consult a local agronomist for specific treatment advice for this condition."
    )

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