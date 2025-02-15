from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import json
from models import *
from drive_utils import download_lecture_and_slides


app = FastAPI(
    title="Treehacks API",
    description="An API to interact with Treehacks",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:*"],  # Allow all localhost ports
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (POST, GET, etc.)
    allow_headers=["*"],  # Allows all headers
)

@app.post("/test", response_model=TestResponse)
def test(request: TestRequest):
    return TestResponse(response=f"Your request was: {request.text}")


@app.post("/setup")
def setup():
    download_lecture_and_slides()
    return {"message": "Setup complete"}