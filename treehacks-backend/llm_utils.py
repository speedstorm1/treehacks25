from openai import OpenAI
import os
from typing import List
import json
import traceback

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def extract_topics_from_syllabus(syllabus_text: str) -> List[str]:
    """
    Use OpenAI to extract topics from a syllabus using function calling for structured output.
    Returns a list of topic titles.
    
    Args:
        syllabus_text (str): The text content of the syllabus to analyze
        
    Returns:
        List[str]: A list of extracted topic titles
        
    Raises:
        ValueError: If the syllabus text is empty or if no valid topics could be extracted
        Exception: For other errors during API calls or processing
    """
    if not syllabus_text or not syllabus_text.strip():
        raise ValueError("Syllabus text cannot be empty")
        
    # Truncate text to approximately 8k tokens (about 32k characters)
    # This ensures we stay within GPT-3.5's context window
    MAX_CHARS = 32000
    if len(syllabus_text) > MAX_CHARS:
        print(f"Truncating syllabus text from {len(syllabus_text)} to {MAX_CHARS} characters")
        syllabus_text = syllabus_text[:MAX_CHARS]
        
    system_prompt = """
    You are an expert at analyzing course syllabi and identifying the core concepts and recurring themes that appear throughout the course.
    Identify fundamental topics and concepts that:
    1. Form the foundation of the subject matter
    2. Appear repeatedly across different sections
    3. Are referenced in multiple assignments or exam questions
    4. Connect different parts of the course together
    
    Make topics specific enough to be meaningful but general enough to span multiple lectures.
    Each topic should be 2-5 words long and capture a distinct concept.
    """
    
    try:
        print(f"Processing syllabus text of length: {len(syllabus_text)}")
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Extract the core topics from this syllabus:\n\n{syllabus_text}"}
            ],
            functions=[{
                "name": "extract_topics",
                "description": "Extract core topics and concepts from a course syllabus",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "topics": {
                            "type": "array",
                            "description": "List of core topics and concepts that appear throughout the course",
                            "items": {
                                "type": "string",
                                "description": "A topic or concept title (2-5 words)"
                            }
                        }
                    },
                    "required": ["topics"]
                }
            }],
            function_call={"name": "extract_topics"}
        )
        
        # Extract and validate topics
        function_args = json.loads(response.choices[0].message.function_call.arguments)
        topics = function_args.get("topics", [])
        
        # Validate topics
        if not topics:
            raise ValueError("No topics were extracted from the syllabus")
            
        # Filter out invalid topics
        valid_topics = [
            topic.strip() for topic in topics 
            if topic and topic.strip() and len(topic.split()) >= 2 and len(topic.split()) <= 5
        ]
        
        if not valid_topics:
            raise ValueError("No valid topics were found after filtering")
            
        print(f"Successfully extracted {len(valid_topics)} topics")
        return valid_topics
        
    except json.JSONDecodeError as e:
        print(f"Failed to parse OpenAI response: {str(e)}")
        print(f"Raw response: {response.choices[0].message.function_call.arguments}")
        raise Exception("Failed to parse topics from OpenAI response") from e
        
    except Exception as e:
        print(f"Error extracting topics: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise
