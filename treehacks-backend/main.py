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
from llm_utils import extract_topics_from_syllabus
import requests
import io
from PyPDF2 import PdfReader

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

#given title, num questions, and lecture id, create a session
@app.post("/api/sessions")
async def create_session(session: SessionCreate):
    short_id = generate_short_id()
    
    try:
        result = supabase.table('sessions').insert({
            'title': session.title,
            'short_id': short_id,
            'active': True,
            'num_questions': session.num_questions,
            'lecture_id': session.lecture_id,
            'timestamp': session.timestamp
        }).execute()
        
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

#list all all sessions
@app.get("/api/sessions")
async def list_sessions():
    result = supabase.table('sessions').select('*').order('created_at', desc=True).execute()
    return result.data

#given a session short id, get the session data
@app.get("/api/sessions/{short_id}")
async def get_session(short_id: str):
    # Convert to uppercase to make it case-insensitive
    short_id = short_id.upper()
    
    result = supabase.table('sessions').select('*').eq('short_id', short_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return result.data[0]

#get progress given the session id (number of submissions)
@app.get("/api/sessions/{short_id}/progress")
async def get_progress(short_id: str):
    try:
        short_id = short_id.upper()
        
        # First get the session
        session_result = (supabase.table('sessions')
            .select('id')
            .eq('short_id', short_id)
            .single()
            .execute())
        
        if not session_result.data:
            raise HTTPException(status_code=404, detail="Session not found")
            
        session_id = session_result.data['id']
        
        # Get the first question's ID
        question_result = (supabase.table('session_questions')
            .select('id')
            .eq('question_number', 1)
            .eq('session_id', session_id)
            .single()
            .execute())
        
        if not question_result.data:
            # If no questions exist yet, return 0 responses
            return {'response_count': 0}
            
        question_id = question_result.data['id']
        
        # Get response count for the first question
        count_result = (supabase.table('session_question_response_count')
            .select('response_count')
            .eq('session_question_id', question_id)
            .single()
            .execute())
        
        # If no responses yet, return 0
        if not count_result.data:
            return {'response_count': 0}
            
        return count_result.data
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        print(f"Error getting progress: {str(e)}")
        return {'response_count': 0}

#get all questions for a session given the session id
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

# student response to a session's questions
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

#create a lecture given data
@app.post("/api/lectures")
async def create_lecture(lecture: LectureCreate):
    try:
        result = supabase.table('lectures').insert({
            'name': lecture.name,
            'slides': lecture.slides,
            'lecture_video': lecture.lecture_video
        }).execute()
        
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

#list all lectures
@app.get("/api/lectures")
async def list_lectures():
    result = supabase.table('lectures').select('*').order('created_at', desc=True).execute()
    return result.data

#get a specific lecture given the id
@app.get("/api/lectures/{lecture_id}")
async def get_lecture(lecture_id: str):
    result = supabase.table('lectures').select('*').eq('id', lecture_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Lecture not found")
    
    return result.data[0]

#get all of the sessions for a lecture
@app.get("/api/lectures/{lecture_id}/sessions")
async def get_lecture_sessions(lecture_id: str):
    result = supabase.table('sessions').select('*').eq('lecture_id', lecture_id).order('created_at', desc=True).execute()
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
        timestamp = session_response['data']['timestamp']
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

@app.get("/api/topics")
async def get_topics(class_id: str):
    result = supabase.table('topics').select('*').eq('class_id', class_id).execute()
    return result.data

@app.put("/api/topics/{topic_id}")
async def modify_topic(topic_id: str, topic: TopicUpdate):
    try:
        result = supabase.table('topics').update({
            'title': topic.title,
            'class_id': topic.class_id
        }).eq('id', topic_id).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/topics")
async def add_topic(topic: TopicUpdate):
    try:
        result = supabase.table('topics').insert({
            'title': topic.title,
            'class_id': topic.class_id
        }).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/topic/generate")
async def generate_topic(syllabus: Syllabus):
    try:
        # Download and extract text from the syllabus PDF
        response = requests.get(syllabus.syllabus_url)
        pdf_content = response.content
        text_content = extract_text_from_pdf(pdf_content)

        # Extract topics using OpenAI
        topics = extract_topics_from_syllabus(text_content)
        
        # Insert topics into the database
        for topic in topics:
            supabase.table('topics').insert({
                'title': topic,
                'class_id': syllabus.class_id
            }).execute()
            
        return {"message": "Topics generated successfully", "topics": topics}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/topic/delete/{topic_id}")
async def delete_topic(topic_id: str):
    result = supabase.table('topic').delete().eq('id', topic_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    return result.data[0]

def extract_text_from_pdf(pdf_content: bytes) -> str:
    """
    Extract text content from PDF bytes.
    """
    try:
        # Create PDF reader object
        pdf_file = io.BytesIO(pdf_content)
        pdf_reader = PdfReader(pdf_file)
        
        # Extract text from all pages
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
            
        # Clean up the text
        text = text.strip()
        # Remove multiple newlines
        text = "\n".join(line.strip() for line in text.split("\n") if line.strip())
        
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {str(e)}")
        raise ValueError("Failed to extract text from PDF") from e

#get all questions for a session given the session id
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