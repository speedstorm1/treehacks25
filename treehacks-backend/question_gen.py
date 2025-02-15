import os
import json
from typing import List, Dict
import google.generativeai as genai
from datetime import datetime
import PIL.Image
from pdf2image import convert_from_path
import base64
import io

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

def get_context_until_timestamp(timestamp: float, pdf_path: str, transcript_path: str) -> tuple:
    """
    Get slides and transcript content up to the given timestamp
    
    Args:
        timestamp: Video timestamp in seconds
        pdf_path: Path to PDF file
        transcript_path: Path to transcript JSON
    
    Returns:
        List of content items (images and text) for Gemini
    """
    # Load slide mapping
    with open("./data/slide_mappings/slide_mapping.json") as f:
        slide_mapping = json.load(f)
    
    # Convert PDF to images
    all_slides = convert_from_path(pdf_path)
    
    # Get slides up to timestamp
    relevant_slide_numbers = []
    for change in slide_mapping["slide_timestamps"]:
        if change["timestamp"] <= timestamp:
            relevant_slide_numbers.append(change["slide"] - 1)  # Convert to 0-based index
    
    # Get the unique, latest slides shown up to this point
    if relevant_slide_numbers:
        latest_slide_index = max(relevant_slide_numbers)
        relevant_slides = [all_slides[i] for i in range(latest_slide_index + 1)]
    else:
        relevant_slides = []
    
    # Load transcript
    with open(transcript_path) as f:
        transcript = json.load(f)
    
    # Get transcript up to timestamp
    relevant_transcript = []
    for segment in transcript["segments"]:
        if float(segment["start"]) <= timestamp:
            relevant_transcript.append(segment["text"])
    
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

def generate_questions(timestamp: float, pdf_path: str, transcript_path: str) -> List[Dict]:
    """
    Generate questions based on lecture content up to timestamp
    
    Args:
        timestamp: Video timestamp in seconds
        pdf_path: Path to PDF file
        transcript_path: Path to transcript JSON
    
    Returns:
        List of dictionaries containing questions and metadata
    """
    # Get model
    model = setup_gemini()
    
    # Get context as list of content items
    contents = get_context_until_timestamp(timestamp, pdf_path, transcript_path)
    
    # Add the instruction prompt as the first content item
    prompt = """You are an expert teaching assistant helping to generate questions to test student understanding.
    Based on the lecture slides (shown as images) and transcript provided, generate 3 questions that test student comprehension
    of the key concepts covered so far. Each question should:
    1. Test understanding, not just recall
    2. Be clear and unambiguous
    3. Focus on important concepts, not minor details
    4. Include the correct answer and a brief explanation
    
    Format each question as a JSON object with these fields:
    - question: The actual question text
    - answer: The correct answer
    - explanation: Brief explanation of why this is correct
    - concepts: List of key concepts being tested
    - difficulty: One of [easy, medium, hard]
    
    Return exactly 3 questions in a JSON array. Return ONLY the JSON array, no other text or formatting."""
    
    contents.insert(0, prompt)
    
    # Generate response
    response = model.generate_content(contents)
    
    try:
        # Clean up response text
        response_text = response.text.strip()
        
        # Remove markdown code block if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        # Remove any leading/trailing whitespace and newlines
        response_text = response_text.strip()
        
        # Parse response as JSON
        questions = json.loads(response_text)
        
        # Validate response structure
        if not isinstance(questions, list):
            raise ValueError("Response is not a list of questions")
        if len(questions) != 3:
            raise ValueError("Did not receive exactly 3 questions")
        
        # Validate each question has required fields
        required_fields = {"question", "answer", "explanation", "concepts", "difficulty"}
        for q in questions:
            if not isinstance(q, dict):
                raise ValueError("Question is not a dictionary")
            if not required_fields.issubset(q.keys()):
                raise ValueError(f"Question missing required fields: {required_fields - set(q.keys())}")
        
        # Add metadata
        for q in questions:
            q["timestamp"] = timestamp
            q["generated_at"] = datetime.now().isoformat()
        
        return questions
        
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Warning: Could not parse response: {str(e)}")
        return [{
            "error": f"Could not parse response: {str(e)}",
            "raw_response": response.text,
            "timestamp": timestamp,
            "generated_at": datetime.now().isoformat()
        }]

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
