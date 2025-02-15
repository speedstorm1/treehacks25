from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
import random
import string
import json
from models import *
from drive_utils import download_lecture_and_slides
import os
from supabase import create_client, Client
from video_utils import extract_audio
from speech_to_text import transcribe_with_timestamps
from slide_utils import map_slides_to_video
from question_gen import generate_questions, save_questions

load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

app = FastAPI(
    title="Treehacks API",
    description="An API to interact with Treehacks",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:*"],  # Allow specific port and any localhost
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (POST, GET, etc.)
    allow_headers=["*"],  # Allows all headers
)

def generate_short_id(length: int = 5) -> str:
    # Use only uppercase letters and numbers, excluding confusing characters
    characters = string.ascii_uppercase.replace('O', '') + string.digits.replace('0', '').replace('1', '')
    while True:
        # Generate a random ID
        short_id = ''.join(random.choices(characters, k=length))
        
        # Check if it already exists in the database
        exists = supabase.table('sessions').select('short_id').eq('short_id', short_id).execute()
        
        if not exists.data:
            return short_id

@app.post("/test", response_model=TestResponse)
def test(request: TestRequest):
    return TestResponse(response=f"Your request was: {request.text}")

@app.post("/setup")
def setup():
    download_lecture_and_slides()
    return {"message": "Setup complete"}

class SessionCreate(BaseModel):
    title: str
    num_questions: int

class ResponseCreate(BaseModel):
    question_id: str
    response_text: str

@app.post("/api/sessions")
async def create_session(session: SessionCreate):
    short_id = generate_short_id()
    
    try:
        result = supabase.table('sessions').insert({
            'title': session.title,
            'short_id': short_id,
            'active': True,
            'num_questions': session.num_questions
        }).execute()
        
        # Access the data directly from result.data
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/sessions")
async def list_sessions():
    result = supabase.table('sessions').select('*').order('created_at', desc=True).execute()
    return result.data

@app.get("/api/sessions/{short_id}")
async def get_session(short_id: str):
    # Convert to uppercase to make it case-insensitive
    short_id = short_id.upper()
    
    result = supabase.table('sessions').select('*').eq('short_id', short_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return result.data[0]

@app.get("/api/sessions/{short_id}/progress")
async def get_progress(short_id: str):
    short_id = short_id.upper()
    
    # Get the first question's ID
    result = (supabase.table('session_questions')
        .select('id')
        .eq('question_number', 1)
        .eq('session_id', supabase.table('sessions')
            .select('id')
            .eq('short_id', short_id)
            .single()
            .execute()
            .data['id'])
        .single()
        .execute())
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get response count for the first question
    result = (supabase.table('session_question_response_count')
        .select('response_count')
        .eq('session_question_id', result.data['id'])
        .single()
        .execute())
    
    return result.data or {'response_count': 0}

@app.patch("/api/sessions/{short_id}/close")
async def close_session(short_id: str):
    # Convert to uppercase to make it case-insensitive
    short_id = short_id.upper()
    
    result = supabase.table('sessions').update({'active': False}).eq('short_id', short_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return result.data[0]

@app.get("/api/sessions/questions/{short_id}")
async def get_questions(short_id: str):
    # Convert to uppercase to make it case-insensitive
    short_id = short_id.upper()
    
    result = supabase.table('sessions').select('*').eq('short_id', short_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    session_id = result.data[0]['id']

    result = supabase.table('session_questions').select('question_text', 'question_number', 'id').eq('session_id', session_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return result.data

@app.post("/api/sessions/responses")
async def post_response(response_data: ResponseCreate):
    # Convert to uppercase to make it case-insensitive
    question_id = response_data.question_id.upper()
    response_text = response_data.response_text
    
    result = supabase.table('session_responses').insert({
        'question_id': question_id,
        'response_text': response_text
    }).execute()
    
    return result.data

@app.post("/transcribe/{video_name}")
def transcribe_video_endpoint(video_name: str):
    """
    Transcribe a video file and return text with timestamps.
    Video name should be one of: lecture.mp4, first_5min.mp4, first_10min.mp4, first_20min.mp4
    """
    valid_videos = ["lecture.mp4", "first_5min.mp4", "first_10min.mp4", "first_20min.mp4"]
    
    if video_name not in valid_videos:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid video name. Must be one of: {', '.join(valid_videos)}"
        )
    
    # Determine video path based on name
    video_path = f"data/{video_name}"

@app.post("/extract-audio")
async def extract_audio_endpoint(request: ExtractAudioRequest):
    """Extract audio from a video file"""
    try:
        # Determine video path based on name
        video_path = f"data/{request.video_name}"
        
        # Extract audio
        audio_path = extract_audio(video_path, test_mode=request.test_mode)
        
        if not audio_path:
            raise HTTPException(
                status_code=500,
                detail="Failed to extract audio from video"
            )
        
        return {
            "message": f"Successfully extracted audio from {request.video_name}",
            "audio_path": audio_path
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.post("/transcribe")
async def transcribe_endpoint(request: TranscribeRequest):
    """Transcribe a video file with word-level timestamps"""
    try:
        # Determine video path based on name
        video_path = f"data/{request.video_name}"
        
        # Transcribe with timestamps
        result = transcribe_with_timestamps(video_path, test_mode=request.test_mode)
        
        if not result:
            raise HTTPException(
                status_code=500,
                detail="Failed to transcribe video"
            )
        
        return {
            "message": f"Successfully transcribed {request.video_name}",
            "results": result
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@app.post("/map-slides")
async def map_slides(video_path: str = Form(...), pdf_path: str = Form(...)):
    """Map slides from PDF to video timestamps"""
    try:
        result = map_slides_to_video(video_path, pdf_path)
        return {"status": "success", "data": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/generate-questions")
async def generate_questions_endpoint(lecture_id: str, session_id: str):
    """
    Generate questions based on lecture content up to timestamp
    """
    try:
        # Verify lecture exists
        lecture_response = supabase.table('lectures').select('*').eq('id', lecture_id).single().execute()
        if not lecture_response['data']:
            raise HTTPException(status_code=404, detail=f"Lecture {lecture_id} not found")
            
        # Verify session exists
        session_response = supabase.table('sessions').select('*').eq('id', session_id).single().execute()
        if not session_response['data']:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
            
        # Generate and save questions
        timestamp = lecture_response['data']['timestamp']
        questions = generate_questions(lecture_id, session_id, timestamp)
        
        return {
            "success": True,
            "message": f"Generated {len(questions)} questions",
            "questions": questions
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating questions: {str(e)}"
        )
