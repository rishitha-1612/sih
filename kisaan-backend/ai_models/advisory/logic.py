import os
import sys
import json
import pickle
import numpy as np
import pandas as pd

os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'

# Fertilizer recommendations
fertilizer_dic = {
    'NHigh': """The N value of soil is high. Avoid nitrogen fertilizers and plant nitrogen-fixing crops like peas or beans.""",
    'Nlow': """Nitrogen level is low. Use nitrogen-rich fertilizers or manure.""",
    'PHigh': """Phosphorus level is high. Avoid phosphorus fertilizers and increase irrigation.""",
    'Plow': """Phosphorus level is low. Use bone meal or rock phosphate.""",
    'KHigh': """Potassium level is high. Reduce potassium fertilizers and water soil deeply.""",
    'Klow': """Potassium level is low. Add potash fertilizer or organic compost."""
}

def recommend_crop(n, p, k, temp, humidity, ph, rainfall):

    working_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(working_dir, "RandomForest.pkl")
    csv_path = os.path.join(working_dir, "data", "fertilizer.csv")

    # Try ML model first
    if os.path.exists(model_path):
        try:
            with open(model_path, 'rb') as f:
                model = pickle.load(f)

            data = np.array([[n, p, k, temp, humidity, ph, rainfall]])
            prediction = model.predict(data)

            return prediction[0]
        except:
            pass

    # Fallback method using CSV nearest match
    if os.path.exists(csv_path):

        df = pd.read_csv(csv_path)

        distances = []

        for _, row in df.iterrows():

            d = (
                ((row['N'] - n)/100)**2 +
                ((row['P'] - p)/100)**2 +
                ((row['K'] - k)/100)**2 +
                ((row['pH'] - ph)/7)**2
            )

            distances.append(np.sqrt(d))

        best_match = np.argmin(distances)

        return df.iloc[best_match]['Crop']

    return "No crop recommendation available"


def recommend_fertilizer(crop_name, n, p, k):

    working_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(working_dir, "data", "fertilizer.csv")

    if not os.path.exists(csv_path):
        return "Fertilizer data not available"

    df = pd.read_csv(csv_path)

    crop_data = df[df['Crop'].str.lower() == crop_name.lower()]

    if crop_data.empty:
        return "No fertilizer data available for this crop"

    nr = crop_data['N'].iloc[0]
    pr = crop_data['P'].iloc[0]
    kr = crop_data['K'].iloc[0]

    diffs = [
        ("N", nr - n),
        ("P", pr - p),
        ("K", kr - k)
    ]

    nutrient, val = max(diffs, key=lambda x: abs(x[1]))

    if nutrient == "N":
        key = "NHigh" if val < 0 else "Nlow"
    elif nutrient == "P":
        key = "PHigh" if val < 0 else "Plow"
    else:
        key = "KHigh" if val < 0 else "Klow"

    return fertilizer_dic.get(key, "Soil nutrients are balanced")


def run_prediction(n, p, k, temp, humidity, ph, rainfall):

    crop = recommend_crop(n, p, k, temp, humidity, ph, rainfall)
    fertilizer = recommend_fertilizer(crop, n, p, k)

    result = {
        "crop": crop,
        "fertilizer": fertilizer
    }

    return result


if __name__ == "__main__":

    # If inputs are passed from command line (frontend / backend)
    if len(sys.argv) == 8:

        n = int(sys.argv[1])
        p = int(sys.argv[2])
        k = int(sys.argv[3])
        temp = float(sys.argv[4])
        humidity = float(sys.argv[5])
        ph = float(sys.argv[6])
        rainfall = float(sys.argv[7])

    else:
        # Interactive testing
        print("Enter soil and weather values")

        n = int(input("Nitrogen (N): "))
        p = int(input("Phosphorus (P): "))
        k = int(input("Potassium (K): "))
        temp = float(input("Temperature: "))
        humidity = float(input("Humidity: "))
        ph = float(input("pH: "))
        rainfall = float(input("Rainfall: "))

    result = run_prediction(n, p, k, temp, humidity, ph, rainfall)

    print(json.dumps(result))