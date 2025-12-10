import cv2
import os
import numpy as np

MISSING_PERSON_DIR = "missing_person_images"
MODEL_PATH = "trained_model.yml"
LABEL_DICT_PATH = "label_dict.npy"

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

def train_recognizer():
    print("🧠 Training LBPH face recognizer...")
    recognizer = cv2.face.LBPHFaceRecognizer_create()

    faces = []
    labels = []
    label_dict = {}       # name -> label_id
    current_id = 0

    for person_name in os.listdir(MISSING_PERSON_DIR):
        person_folder = os.path.join(MISSING_PERSON_DIR, person_name)
        if not os.path.isdir(person_folder):
            continue

        label_dict[person_name] = current_id
        for file in os.listdir(person_folder):
            if file.lower().endswith((".jpg", ".jpeg", ".png")):
                img_path = os.path.join(person_folder, file)
                img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
                if img is None:
                    print(f"⚠️ Could not read {img_path}")
                    continue
                img = cv2.resize(img, (200, 200))  # Ensure consistent size
                faces.append(img)
                labels.append(current_id)
                print(f"✅ Loaded {img_path}")
        current_id += 1

    if faces:
        recognizer.train(faces, np.array(labels))
        recognizer.save(MODEL_PATH)
        np.save(LABEL_DICT_PATH, label_dict)
        print("✅ Model and label_dict saved.")
        return True
    else:
        print("❌ No valid training images found.")
        return False

# Run training
if __name__ == "__main__":
    train_recognizer()
