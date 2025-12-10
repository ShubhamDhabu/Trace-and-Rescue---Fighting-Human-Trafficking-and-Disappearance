from fastapi import FastAPI ,UploadFile, File, Form, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import os
import uuid
from fastapi.responses import FileResponse
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

last_detected = {
    "name": None,
    "location": None,
    "message": None,
    "image_path": None
}

class CaseRequest(BaseModel):
    case_id: str
    person_name: str

@app.get("/")
def home():
    return {"message": "Trace and Rescue API is running"}

@app.post("/capture-face")
def capture_face(name: str = Query(...)):
    print("Capturing face for:", name)
    subprocess.run(["python", "capture_face.py", name])
    return {"status": "success"}

@app.post("/train-model")
def train_model():
    subprocess.run(["python", "training_model.py"])
    return {"status": "success", "message": "Model trained successfully"}

@app.post("/recognize")
def recognize_person(case_id: str = Query(...), name: str = Query(...)):
    print("Recognizing for:", name)
    subprocess.Popen(["python", "recognize_face2.py", name])
    return {"status": "success"}


# 1️⃣ Receive found person data + snapshot from recognize_face2.py
@app.post("/person-found")
async def person_found(
    name: str = Form(...),
    message: str = Form(...),
    location: str = Form(...),
    snapshot: UploadFile = File(...)
):
    filename = f"found_{uuid.uuid4()}.jpg"
    save_path = os.path.join("found_snapshots", filename)

    os.makedirs("found_snapshots", exist_ok=True)

    with open(save_path, "wb") as f:
        f.write(await snapshot.read())

    # Store in memory so frontend can fetch
    last_detected.update({
        "name": name,
        "location": location,
        "message": message,
        "image_path": save_path
    })

    print("📡 Person found data saved:", last_detected)

    return {"status": "ok", "message": "Data stored"}


# 2️⃣ Frontend calls this to check detection result
@app.get("/get-found-person")
def get_found_person():
    if last_detected["name"] is None:
        return {"found": False}

    return {
        "found": True,
        "name": last_detected["name"],
        "location": last_detected["location"],
        "message": last_detected["message"],
        "image_url": f"http://localhost:8000/get-found-image"
    }


# 3️⃣ Serve the snapshot image
@app.get("/get-found-image")
def get_found_image():
    if last_detected["image_path"]:
        return FileResponse(last_detected["image_path"])
    return {"error": "No image available"}