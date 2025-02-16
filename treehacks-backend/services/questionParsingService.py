import os
from typing import Dict, List
from PyPDF2 import PdfReader
import json
from openai import OpenAI
from dotenv import load_dotenv
from supabase import create_client, Client
import io

# Load environment variables and initialize clients
load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)
openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# def extract_text_from_pdf(pdf_path: str) -> str:
#     """Extract text content from a PDF file."""
#     try:
#         reader = PdfReader(pdf_path)
#         text = ""
#         for page in reader.pages:
#             text += page.extract_text()
#         return text
#     except Exception as e:
#         raise Exception(f"Error extracting text from PDF: {str(e)}")

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extract text content from PDF bytes."""
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")

async def split_into_questions(text: str) -> List[Dict[str, str]]:
    """
    Use GPT-4 to split text into individual questions.
    
    Args:
        text: The text to split
        
    Returns:
        List of dictionaries containing question number and text
    """
    prompt = f"""
    Parse this problem statement document into separate questions.
    
    Document text:
    {text}
    
    Split this into individual questions and return them in the following JSON format:
    {{
        "questions": [
            {{
                "number": 1,
                "text": "full question text here"
            }},
            ...
        ]
    }}

    Guidelines:
    1. Preserve all formatting and content within each question
    2. Include any subparts or additional context with each question
    3. Number questions sequentially starting from 1
    4. Remove any headers, footers, or non-question content
    5. Keep mathematical formulas, code snippets, and special characters intact
    """

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at parsing academic documents and identifying distinct questions."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.05  # Low temperature for consistent parsing
        )
        
        result = json.loads(response.choices[0].message.content)
        return result["questions"]
        
    except Exception as e:
        raise Exception(f"Error splitting text into questions: {str(e)}")

async def parse_and_store_questions(assignment_id: int, pdf_bytes: bytes) -> List[Dict]:
    """
    Parse questions from PDF bytes and store them in the homework_question table.
    
    Args:
        assignment_id: ID of the assignment these questions belong to
        pdf_bytes: Bytes of the PDF file containing questions
        
    Returns:
        List of stored questions with their IDs
    """
    try:
        # Extract text from PDF
        text = extract_text_from_pdf_bytes(pdf_bytes)
        print('extracted text')
        
        # Split into questions
        questions = await split_into_questions(text)
        print("split into questions")
        
        # Store each question in Supabase
        stored_questions = []
        for question in questions:
            # Insert question into homework_question table
            response = supabase.table("assignment_question").insert({
                "assignment_id": assignment_id,
                "problem_number": question["number"],
                "text": question["text"]
            }).execute()
            
            if response.data:
                stored_questions.append(response.data) #maybe get [0]?
            
        return stored_questions
        
    except Exception as e:
        raise Exception(f"Error parsing and storing questions: {str(e)}")