
import os
import sys

# CRITICAL: Force pure-python implementation for windows compatibility
os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'

import json
import kagglehub
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Setup environment
os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'

def train_model():
    # Use the current working directory as __file__ is not defined in Colab notebooks
    working_dir = os.getcwd()
    print("Downloading dataset from Kaggle...")
    path = kagglehub.dataset_download("emmarex/plantdisease")

    # Correct path for SiddharthDhirde expected structure
    dataset_path = os.path.join(path, "PlantVillage", "PlantVillage")
    if not os.path.exists(dataset_path):
        dataset_path = os.path.join(path, "PlantVillage")
    if not os.path.exists(dataset_path):
        dataset_path = path

    print(f"Dataset location: {dataset_path}")

    IMG_SIZE = (224, 224)
    BATCH_SIZE = 32

    # Data Augmentation
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True
    )

    train_generator = train_datagen.flow_from_directory(
        dataset_path,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='training'
    )

    validation_generator = train_datagen.flow_from_directory(
        dataset_path,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='validation'
    )

    # CNN Architecture (Based on SiddharthDhirde repo logic)
    model = models.Sequential([
        layers.Conv2D(32, (3, 3), activation='relu', input_shape=(224, 224, 3)),
        layers.MaxPooling2D(2, 2),
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.MaxPooling2D(2, 2),
        layers.Conv2D(128, (3, 3), activation='relu'),
        layers.MaxPooling2D(2, 2),
        layers.Flatten(),
        layers.Dense(512, activation='relu'),
        layers.Dropout(0.5),
        layers.Dense(train_generator.num_classes, activation='softmax')
    ])

    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

    # Path for status tracking
    status_path = os.path.join(working_dir, 'training_status.json')

    # Custom callback to update progress
    class StatusCallback(tf.keras.callbacks.Callback):
        def on_epoch_end(self, epoch, logs=None):
            status = {
                "status": "training",
                "current_epoch": epoch + 1,
                "total_epochs": 5,
                "accuracy": round(float(logs.get('accuracy', 0)), 4)
            }
            with open(status_path, 'w') as f:
                json.dump(status, f)
            print(f"Progress saved: {status}")

    # Train (Small epochs for demo/refactor verification)
    print("Starting training...")
    with open(status_path, 'w') as f:
        json.dump({"status": "training", "current_epoch": 0, "total_epochs": 5}, f)

    model.fit(
        train_generator,
        epochs=5,
        validation_data=validation_generator,
        callbacks=[StatusCallback()]
    )

    # Save model and labels
    model.save(os.path.join(working_dir, 'plant_disease_prediction_model.h5'))

    with open(os.path.join(working_dir, 'class_indices.json'), 'w') as f:
        json.dump(train_generator.class_indices, f)

    with open(status_path, 'w') as f:
        json.dump({"status": "complete", "message": "CNN model loaded successfully. Real predictions enabled."}, f)

    print("Training complete. Model saved.")

if __name__ == "__main__":
    train_model()