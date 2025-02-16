import os
from typing import Dict, List
from PyPDF2 import PdfReader
import json
from openai import OpenAI
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables and initialize clients
load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)
openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text content from a PDF file."""
    print("extract text from pdf")
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")

async def split_into_answers(text: str) -> List[Dict[str, str]]:
    """
    Use GPT-4 to split text into individual answers.
    
    Args:
        text: The text to split
        
    Returns:
        List of dictionaries containing answer number and text
    """
    prompt = f"""
    Parse this student homework document into separate answers.
    
    Document text:
    {text}
    
    Split this into individual answers and return them in the following JSON format:
    {{
        "answers": [
            {{
                "number": 1,
                "text": "full answer text here"
            }},
            ...
        ]
    }}

    Guidelines:
    1. Preserve all formatting and content within each answer
    2. Include any subparts or additional context with each answer
    3. Number answers sequentially starting from 1
    4. Remove any headers, footers, or non-answer content
    5. Keep mathematical formulas, code snippets, and special characters intact
    """
    print("splitting answers")
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at parsing academic documents and identifying distinct answers."
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
        return result["answers"]
        
    except Exception as e:
        raise Exception(f"Error splitting text into answers: {str(e)}")