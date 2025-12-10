"""
recognize_face_alert_combined.py
Face Recognition System with both WhatsApp Web + Email Alerts and Cooldown.

Requirements:
    pip install opencv-python opencv-contrib-python numpy pywhatkit
"""

import cv2
import numpy as np
import os
import time
import datetime
import pywhatkit
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# === CONFIG ===

# --- WhatsApp ---
RECEIVER_WHATSAPP = ["+919665466621"]   # Replace with target numbers
PYWHATKIT_WAIT = 30                     # Seconds pywhatkit waits before sending

# --- Email ---
SENDER_EMAIL = "piyushbutle30@gmail.com"
SENDER_PASSWORD = "xxvxefyyslbhsxmh"
RECEIVER_EMAILS = [
    "lakshikhar14@gmail.com",
    "shubhamdhabu06@gmail.com"
]

# --- General ---
COOLDOWN_SECONDS = 45   # cooldown after each alert
MODEL_PATH = "trained_model.yml"
LABELS_PATH = "label_dict.npy"
RTSP_URL = "rtsp://admin:admin123@192.168.0.112:554/cam/realmonitor?channel=1&subtype=0"
LOCATION = "SVPCET (Nagpur, Maharashtra)"
DEBUG_MODE = False

# === SOUND ALERT ===
def play_alert(frequency=1000, duration=500):
    try:
        import winsound
        winsound.Beep(frequency, duration)
    except Exception:
        print("[ALERT SOUND] Beep!")

# === WHATSAPP ALERT ===
def send_whatsapp_message_instant(number: str, message: str):
    try:
        print(f"📲 Preparing WhatsApp message to {number} ...")
        pywhatkit.sendwhatmsg_instantly(number, message, wait_time=PYWHATKIT_WAIT, tab_close=True)
        print(f"✅ WhatsApp Message sent to {number}")
    except Exception as e:
        print(f"❌ WhatsApp failed for {number}: {e}")

def send_whatsapp_alert(person_name: str, detected_time: datetime.datetime, location: str):
    message = (
        f"🚨 Missing Person Alert!\n"
        f"Name: {person_name}\n"
        f"Time: {detected_time.strftime('%Y-%m-%d %H:%M:%S')}\n"
        f"Location: {location}\n"
        f"Detected on CCTV system."
    )
    for num in RECEIVER_WHATSAPP:
        send_whatsapp_message_instant(num, message)

# === EMAIL ALERT ===
def send_email_alert(sender_email, sender_password, receiver_emails,
                     subject="Alert! Missing person detected",
                     body=None,
                     attachment_path=None):
    if body is None:
        body = f"The monitored system has detected the missing person.\nLocation: {LOCATION}"

    context = ssl.create_default_context()
    for receiver_email in receiver_emails:
        try:
            msg = MIMEMultipart()
            msg["From"] = sender_email
            msg["To"] = receiver_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain"))

            if attachment_path and os.path.exists(attachment_path):
                from email.mime.base import MIMEBase
                from email import encoders
                with open(attachment_path, "rb") as f:
                    part = MIMEBase("application", "octet-stream")
                    part.set_payload(f.read())
                encoders.encode_base64(part)
                part.add_header("Content-Disposition",
                                f'attachment; filename="{os.path.basename(attachment_path)}"')
                msg.attach(part)

            with smtplib.SMTP("smtp.gmail.com", 587) as server:
                server.starttls(context=context)
                server.login(sender_email, sender_password)
                server.send_message(msg)
            print(f"📧 Email sent to {receiver_email}")
        except Exception as e:
            print(f"❌ Failed to send email to {receiver_email}: {e}")

# === COMBINED ALERT (WhatsApp + Email) ===
def trigger_combined_alert(last_alert_ts_holder: dict, snapshot_path=None, person_name="Unknown"):
    now = time.time()
    if now - last_alert_ts_holder.get("ts", 0) < COOLDOWN_SECONDS:
        remaining = COOLDOWN_SECONDS - (now - last_alert_ts_holder.get("ts", 0))
        print(f"⏳ In cooldown. Next alert in {int(remaining)}s")
        return False

    play_alert()
    detected_time = datetime.datetime.now()

    # WhatsApp Alert
    send_whatsapp_alert(person_name, detected_time, LOCATION)

    # Email Alert
    if not DEBUG_MODE:
        send_email_alert(SENDER_EMAIL, SENDER_PASSWORD, RECEIVER_EMAILS,
                         body=f"🚨 Missing Person Detected!\nName: {person_name}\n"
                              f"Time: {detected_time.strftime('%Y-%m-%d %H:%M:%S')}\n"
                              f"Location: {LOCATION}",
                         attachment_path=snapshot_path)
        print("✅ Combined Alert Sent (WhatsApp + Email)")
    else:
        print("🔕 DEBUG MODE: Alerts not sent")

    last_alert_ts_holder["ts"] = now
    print(f"🛑 Alert triggered. Cooling down for {COOLDOWN_SECONDS} seconds.")
    return True

# === FACE RECOGNITION LOOP ===
def recognize_face():
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    try:
        recognizer.read(MODEL_PATH)
    except Exception as e:
        print(f"❌ Could not load model '{MODEL_PATH}': {e}")
        return

    try:
        with open(LABELS_PATH, 'rb') as f:
            label_dict = np.load(f, allow_pickle=True).item()
        reverse_label_dict = {v: k for k, v in label_dict.items()}
    except Exception as e:
        print(f"❌ Could not load labels '{LABELS_PATH}': {e}")
        return

    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    cap = cv2.VideoCapture(RTSP_URL)
    if not cap.isOpened():
        print("❌ Camera couldn't be opened. Check RTSP URL.")
        return

    last_alert = {"ts": 0}
    print("🚀 Face recognition started. Press 'q' to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ Failed to grab frame from camera.")
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

        for (x, y, w, h) in faces:
            try:
                face = gray[y:y + h, x:x + w]
                face = cv2.resize(face, (200, 200))
                label, confidence = recognizer.predict(face)
            except Exception as e:
                print(f"⚠ Face processing error: {e}")
                continue

            name = reverse_label_dict.get(label, "Unknown")
            
            if confidence < 70:
                color = (0, 255, 0)

                snapshot_path = "alert_snapshot.jpg"
                cv2.imwrite(snapshot_path, frame)

                triggered = trigger_combined_alert(last_alert, snapshot_path, person_name=name) 

                if triggered:
                    print("📡 Sending detection result to FastAPI backend...")

                    import requests

                    try:
                        with open(snapshot_path, "rb") as img:
                            requests.post(
                                "http://localhost:8000/person-found",
                                data={
                                    "name": name,
                                    "location": LOCATION,
                                    "message": "Missing person detected!"
                                },
                                files={"snapshot": img}
                            )
                        print("✅ Data sent to FastAPI.")
                    except Exception as e:
                        print("❌ Failed to send detection to backend:", e)

                    print("🛑 Stopping recognition after detection...")
                    cap.release()
                    cv2.destroyAllWindows()
                    return  # <---- IMPORTANT: stop the while loop and exit program

            else:
                name = "Unknown"
                color = (0, 0, 255)

            cv2.putText(frame, f"{name} ({confidence:.1f})", (x, y - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
            cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)

        cooldown_remaining = max(0, int(COOLDOWN_SECONDS - (time.time() - last_alert.get("ts", 0))))
        status_text = f"Cooldown: {cooldown_remaining}s" if cooldown_remaining > 0 else "Ready"
        cv2.putText(frame, status_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

        cv2.imshow("Face Recognition Alert System (Combined)", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            print("👋 Exiting...")
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    recognize_face()
