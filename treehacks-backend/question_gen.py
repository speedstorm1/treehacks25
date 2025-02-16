import os
import json
from typing import List, Dict
import google.generativeai as genai
from datetime import datetime
import PIL.Image
from pdf2image import convert_from_path
import base64
import io
import requests
from supabase import create_client, Client
from topic_utils import get_topics_for_question_generation, categorize_question

# Initialize Supabase client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def setup_gemini():
    """Initialize Gemini API with key"""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("API key not found")
    
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-2.0-flash')

def encode_pil_image(pil_image):
    """Encodes a PIL Image as a Base64 string."""
    # Convert PIL image to bytes
    img_byte_arr = io.BytesIO()
    pil_image.save(img_byte_arr, format='JPEG')
    img_byte_arr = img_byte_arr.getvalue()
    
    return base64.b64encode(img_byte_arr).decode('utf-8')

def convert_drive_link_to_direct_download(drive_link: str) -> str:
    """Convert a Google Drive sharing link to a direct download link"""
    # Extract file ID from the Google Drive link
    file_id = drive_link.split('/d/')[1].split('/')[0]
    return f"https://drive.google.com/uc?export=download&id={file_id}"

def download_and_convert_pdf(pdf_url: str) -> List[PIL.Image.Image]:
    """Download PDF from URL and convert to list of PIL Images"""
    # Convert Google Drive link if needed
    if 'drive.google.com' in pdf_url:
        pdf_url = convert_drive_link_to_direct_download(pdf_url)
    
    # Download PDF to temporary file
    response = requests.get(pdf_url)
    if response.status_code != 200:
        raise ValueError(f"Failed to download PDF: HTTP {response.status_code}")
        
    temp_pdf = "temp_slides.pdf"
    with open(temp_pdf, "wb") as f:
        f.write(response.content)
    
    try:
        # Convert to images
        images = convert_from_path(temp_pdf)
        if not images:
            raise ValueError("No images were extracted from the PDF")
        return images
    except Exception as e:
        raise ValueError(f"Failed to convert PDF: {str(e)}")
    finally:
        # Clean up
        if os.path.exists(temp_pdf):
            os.remove(temp_pdf)

def get_context_until_timestamp(lecture_id: str, session_id: str, timestamp: float) -> tuple:
    """
    Get slides and transcript content up to the given timestamp
    
    Args:
        lecture_id: ID of the lecture
        session_id: ID of the session
        timestamp: Video timestamp in seconds
    
    Returns:
        List of content items (images and text) for Gemini
    """
    try:
        # Get lecture info
        lecture_result = supabase.table('lectures').select('*').eq('id', lecture_id).execute()
        if not lecture_result or not lecture_result.data:
            raise ValueError(f"Lecture {lecture_id} not found")
        
        # Since we're querying by ID, we expect only one result
        lecture = lecture_result.data[0]
        
        # Get slide mappings and transcription from lecture data
        if not lecture.get('slide_mappings'):
            raise ValueError("No slide mappings found in lecture data")
        if not lecture.get('audio_transcription'):
            raise ValueError("No audio transcription found in lecture data")
        if not lecture.get('slides'):
            raise ValueError("No slides URL found in lecture data")
            
        slide_mappings = lecture['slide_mappings']
        transcription = lecture['audio_transcription']
        
        # Convert PDF slides to images
        all_slides = download_and_convert_pdf(lecture['slides'])
        if not all_slides:
            raise ValueError("No slides were converted from PDF")
        
        # Get transcript segments up to timestamp from the audio_transcription
        transcript_segments = []
        for segment in transcription.get('segments', []):
            if float(segment['start']) <= timestamp:
                transcript_segments.append(segment)
        # Get current slide based on timestamp
        current_slide_num = 0
        for mapping in slide_mappings["slide_timestamps"]:
            if float(mapping['timestamp']) <= timestamp:
                current_slide_num = int(mapping['slide'])
            else:
                break
                
        # Prepare content items for Gemini
        contents = []
        
        # Add current slide image
        if current_slide_num < len(all_slides):
            contents.append(all_slides[current_slide_num])
            
        # Add transcript text
        if transcript_segments:
            transcript_text = " ".join([seg['text'] for seg in transcript_segments])
            contents.append(transcript_text)
            
        return contents
            
    except Exception as e:
        print(f"Error getting context: {str(e)}")
        raise ValueError(f"Error getting context: {str(e)}")

def generate_questions(lecture_id: str, session_id: str, timestamp: float) -> List[Dict]:
    """
    Generate questions based on lecture content up to timestamp
    
    Args:
        lecture_id: ID of the lecture
        session_id: ID of the session
        timestamp: Video timestamp in seconds
    
    Returns:
        List of dictionaries containing questions and metadata
    """
    try:
        # Get model
        model = setup_gemini()
        
        # Get context as list of content items
        contents = get_context_until_timestamp(lecture_id, session_id, timestamp)
        if not contents:
            raise ValueError("No content was retrieved from lecture")
            
        # Get lecture info to get number of questions
        lecture_result = supabase.table('lectures').select('*').eq('id', lecture_id).execute()
        if not lecture_result or not lecture_result.data:
            raise ValueError(f"Lecture {lecture_id} not found")
        lecture = lecture_result.data[0]
        num_questions = lecture.get('num_questions', 3)  # default to 3 if not specified
        
        # Add the instruction prompt as the first content item
        prompt = f"""You are an expert teaching assistant helping to generate questions to test student understanding.
        Based on the lecture slides (shown as images) and transcript provided, generate {num_questions} questions that test student comprehension
        of the key concepts covered so far. Each question should with an emphasis on the most recent slide shown and test big picture concepts:
        1. Test understanding, not just recall
        2. Be clear and unambiguous
        3. Focus on important concepts, not minor details
        4. Include the correct answer and a brief explanation
        5. Be answered by a short answer response
        
        Format each question as a JSON object with these fields:
        - question: The actual question text
        - answer: The correct answer
        - explanation: Brief explanation of why this is correct
        
        Return exactly {num_questions} questions in a JSON array. Return ONLY the JSON array, no other text or formatting."""
        
        contents.insert(0, prompt)
        
        # Generate response
        response = model.generate_content(contents)
        if not response or not response.text:
            raise ValueError("No response received from Gemini model")
        
        # Clean up response text
        response_text = response.text.strip()
        
        # Remove markdown code block if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        # Remove any leading/trailing whitespace and newlines
        response_text = response_text.strip()
        if not response_text:
            raise ValueError("Empty response from model after cleanup")
        
        # Parse questions and add topic IDs
        questions = json.loads(response_text)
        
        # Categorize each question into topics
        for question in questions:
            # Use LLM to categorize the question into multiple topics
            question["topic_ids"] = categorize_question(
                question["question"], 
                question.get("explanation", "")
            )
            # print(question, question["topic_ids"])
            
        # Validate response structure
        if not isinstance(questions, list):
            raise ValueError(f"Response is not a list. Got type: {type(questions)}")
        if len(questions) != num_questions:
            raise ValueError(f"Did not receive exactly {num_questions} questions. Got {len(questions)} questions")
        
        # Validate each question has required fields
        required_fields = {"question", "answer", "explanation", "topic_ids"}
        for i, q in enumerate(questions):
            if not isinstance(q, dict):
                raise ValueError(f"Question {i} is not a dictionary. Got type: {type(q)}")
            missing_fields = required_fields - set(q.keys())
            if missing_fields:
                raise ValueError(f"Question {i} is missing required fields: {missing_fields}")
                
        try:
            # Save questions to database
            for i, q in enumerate(questions):
                # For each topic ID, create a separate question-topic mapping
                base_question_data = {
                    'session_id': session_id,
                    'question_number': i,
                    'question_text': q["question"],
                    # 'answer': q["answer"],
                    # 'explanation': q["explanation"]
                }
                
                # Insert the question first
                question_response = supabase.table('session_questions').insert(base_question_data).execute()
                if not question_response or not question_response.data:
                    raise ValueError(f"Failed to insert question {i}")
                question_id = question_response.data[0]["id"]

                
                # Create question-topic mappings
                for topic_id in q["topic_ids"]:
                    mapping_data = {
                        'question_id': question_id,
                        'topic_id': topic_id
                    }
                    mapping_response = supabase.table('session_questions<>topic').insert(mapping_data).execute()
                    if not mapping_response or not mapping_response.data:
                        raise ValueError(f"Failed to create mapping for question {question_id} and topic {topic_id}")
                        
            return questions
            
        except Exception as e:
            print(f"Error saving questions to database: {str(e)}")
            raise ValueError(f"Error saving questions to database: {str(e)}")
        
    except Exception as e:
        error_msg = f"Error generating questions: {str(e)}"
        print(error_msg)
        raise ValueError(error_msg)

def save_questions(questions: List[Dict], output_dir: str):
    """
    Save generated questions to a JSON file
    
    Args:
        questions: List of question dictionaries
        output_dir: Directory to save questions
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # Use timestamp of first question as filename
    timestamp = datetime.now().timestamp()
    output_path = os.path.join(output_dir, f"questions_t{timestamp:.1f}.json")
    
    with open(output_path, "w") as f:
        json.dump(questions, f, indent=2)
    
    return output_path
