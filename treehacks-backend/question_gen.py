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

# Initialize Supabase client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def setup_gemini():
    """Initialize Gemini API with key"""
    api_key = "AIzaSyBvK_qSGnPZuCFPjMf5cMbCxVYW0h1vSHg"
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
        # Get lecture data from Supabase
        lecture_response = supabase.table('lectures').select('*').eq('id', lecture_id).single().execute()
        if not lecture_response['data']:
            raise ValueError(f"Lecture {lecture_id} not found")
        
        # Get slide mappings and transcription from lecture data
        lecture_data = lecture_response['data']
        if not lecture_data.get('slide_mappings'):
            raise ValueError("No slide mappings found in lecture data")
        if not lecture_data.get('audio_transcription'):
            raise ValueError("No audio transcription found in lecture data")
        if not lecture_data.get('slides'):
            raise ValueError("No slides URL found in lecture data")
            
        slide_mappings = lecture_data['slide_mappings']
        transcription = lecture_data['audio_transcription']
        
        # Convert PDF slides to images
        all_slides = download_and_convert_pdf(lecture_data['slides'])
        if not all_slides:
            raise ValueError("No slides were converted from PDF")
        
        # Get slides up to timestamp
        relevant_slide_numbers = []
        for change in slide_mappings.get("slide_timestamps", []):
            if float(change["timestamp"]) <= timestamp:
                relevant_slide_numbers.append(change["slide"] - 1)  # Convert to 0-based index
        
        # Get the unique, latest slides shown up to this point
        if relevant_slide_numbers:
            latest_slide_index = max(relevant_slide_numbers)
            if latest_slide_index >= len(all_slides):
                raise ValueError(f"Slide index {latest_slide_index} is out of range (total slides: {len(all_slides)})")
            relevant_slides = [all_slides[i] for i in range(latest_slide_index + 1)]
        else:
            relevant_slides = []
            
        if not relevant_slides:
            raise ValueError(f"No relevant slides found before timestamp {timestamp}")
        
        # Get transcript up to timestamp
        relevant_transcript = []
        for segment in transcription.get("segments", []):
            if float(segment["start"]) <= timestamp:
                relevant_transcript.append(segment["text"])
                
        if not relevant_transcript:
            raise ValueError(f"No transcript segments found before timestamp {timestamp}")
        
        # Create content items for each slide and the transcript
        contents = []
        
        # Add each slide as an image content item
        for i, slide in enumerate(relevant_slides):
            encoded_image = encode_pil_image(slide)
            contents.append({
                "mime_type": "image/jpeg",
                "data": encoded_image
            })
            contents.append(f"Slide {i+1}")  # Add slide number after each image
        
        # Add transcript as the final text content
        contents.append(f"""
        Lecture Transcript up to timestamp {timestamp}s:
        {' '.join(relevant_transcript)}
        """)
        
        return contents
        
    except Exception as e:
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
        
        # Add the instruction prompt as the first content item
        prompt = """You are an expert teaching assistant helping to generate questions to test student understanding.
        Based on the lecture slides (shown as images) and transcript provided, generate 3 questions that test student comprehension
        of the key concepts covered so far. Each question should:
        1. Test understanding, not just recall
        2. Be clear and unambiguous
        3. Focus on important concepts, not minor details
        4. Include the correct answer and a brief explanation
        5. Be answered by a short answer response
        
        Format each question as a JSON object with these fields:
        - question: The actual question text
        
        Return exactly 3 questions in a JSON array. Return ONLY the JSON array, no other text or formatting."""
        
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
        
        # Parse response as JSON
        try:
            questions = json.loads(response_text)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse model response as JSON: {str(e)}\nResponse text: {response_text}")
        
        # Validate response structure
        if not isinstance(questions, list):
            raise ValueError(f"Response is not a list of questions. Got type: {type(questions)}")
        if len(questions) != 3:
            raise ValueError(f"Did not receive exactly 3 questions. Got {len(questions)} questions")
        
        # Validate each question has required fields
        required_fields = {"question", "answer", "explanation", "concepts", "difficulty"}
        for i, q in enumerate(questions):
            if not isinstance(q, dict):
                raise ValueError(f"Question {i} is not a dictionary. Got type: {type(q)}")
            missing_fields = required_fields - set(q.keys())
            if missing_fields:
                raise ValueError(f"Question {i} missing required fields: {missing_fields}")
        
        # Get session data to know how many questions we already have
        existing_questions_response = supabase.table('session_questions').select('question_number').eq('session_id', session_id).execute()
        if not existing_questions_response['data']:
            next_question_number = 1
        else:
            next_question_number = len(existing_questions_response['data']) + 1
        
        # Add metadata and save to Supabase
        saved_questions = []
        for i, q in enumerate(questions, start=next_question_number):
            try:
                # Prepare data for Supabase - only include fields that exist in the table
                question_data = {
                    'session_id': session_id,
                    'question_number': i,
                    'question_text': q["question"]
                }
                
                print(f"Inserting question {i} with data:", json.dumps(question_data, indent=2))
                
                # Save to Supabase
                try:
                    result = supabase.table('session_questions').insert(question_data).execute()
                    print(f"Full Supabase response:", result)
                    
                    if not result.get('data'):
                        error_msg = f"No data returned from Supabase insert. Full response: {result}"
                        print(error_msg)
                        raise ValueError(error_msg)
                        
                    # Store the full question data in memory even though we only save part to Supabase
                    q['id'] = result['data'][0]['id']
                    saved_questions.append(q)
                    
                except Exception as e:
                    print(f"Supabase insert error: {str(e)}")
                    raise
                
            except Exception as e:
                error_msg = f"Error saving question {i} to Supabase: {str(e)}\nQuestion data: {json.dumps(question_data, indent=2)}"
                print(error_msg)
                raise ValueError(error_msg)
        
        return saved_questions
        
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
    timestamp = questions[0]["timestamp"]
    output_path = os.path.join(output_dir, f"questions_t{timestamp:.1f}.json")
    
    with open(output_path, "w") as f:
        json.dump(questions, f, indent=2)
    
    return output_path
