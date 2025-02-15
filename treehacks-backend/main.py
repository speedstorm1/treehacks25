from fastapi import FastAPI, HTTPException, File, UploadFile
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
