import cv2
import os
import sys
import time

def capture_faces_for_training():
    # --- CHECK IF NAME PASSED ---
    if len(sys.argv) < 2:
        print("❌ ERROR: No person name passed from backend.")
        return

    person_name = sys.argv[1].strip()
    print(f"📌 Automatically capturing faces for: {person_name}")

    # Face detector
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )

    # RTSP CCTV feed
    ip_camera_url = (
        "rtsp://admin:admin@192.168.0.112:554/"
        "user=admin&password=admin&channel=1&stream=0.sdp"
    )
    cap = cv2.VideoCapture(ip_camera_url)

    # Check if camera opened
    if not cap.isOpened():
        print("❌ ERROR: Cannot open RTSP camera stream.")
        return

    # Create folder
    save_path = os.path.join("missing_person_images", person_name)
    os.makedirs(save_path, exist_ok=True)

    sample_count = 0
    total_samples = 50

    print("📸 Starting capture... please stay in front of the camera.")

    while sample_count < total_samples:
        ret, frame = cap.read()
        if not ret:
            print("❌ Failed to grab frame. Retrying...")
            time.sleep(0.2)
            continue

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.2, 5)

        if len(faces) == 0:
            # No face detected → skip frame
            continue

        # Save only first detected face per frame
        (x, y, w, h) = faces[0]
        face_roi = gray[y:y + h, x:x + w]

        sample_count += 1
        filename = os.path.join(
            save_path, f"{person_name}_{sample_count}.jpg"
        )
        cv2.imwrite(filename, face_roi)

        print(f"📁 Saved {sample_count}/{total_samples}: {filename}")

        # Small delay so samples are different
        time.sleep(0.1)

    cap.release()
    cv2.destroyAllWindows()
    print("✅ Capture complete.")

if __name__ == "__main__":
    capture_faces_for_training()
