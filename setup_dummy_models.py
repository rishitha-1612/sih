import pickle
import os

# Create dummy model for Crop Recommendation
# We use a simple dictionary since our logic.py handles it
def create_dummy_crop_model():
    path = "kisaan-backend/ai_models/advisory/RandomForest.pkl"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    
    model = {"type": "mock", "result": "rice"}
        
    with open(path, 'wb') as f:
        pickle.dump(model, f)
    print(f"Created dummy crop model at {path}")

# Create dummy CNN model for Disease Detection as a simple file 
# prediction script will use fallback if it's not a real h5
def create_dummy_disease_model():
    path = "kisaan-backend/ai_models/disease/plant_disease_prediction_model.h5"
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write("DUMMY MODEL FILE")
    print(f"Created dummy disease model placeholder at {path}")

if __name__ == "__main__":
    create_dummy_crop_model()
    create_dummy_disease_model()
