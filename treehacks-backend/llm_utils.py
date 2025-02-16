from openai import OpenAI
import os
from typing import List
import json

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def extract_topics_from_syllabus(syllabus_text: str) -> List[str]:
    """
    Use OpenAI to extract topics from a syllabus using function calling for structured output.
    Returns a list of topic titles.
    """
    system_prompt = """
    You are an expert at analyzing course syllabi and identifying the core concepts and recurring themes that appear throughout the course.
    Identify fundamental topics and concepts that:
    1. Form the foundation of the subject matter
    2. Appear repeatedly across different sections
    3. Are referenced in multiple assignments or exam questions
    4. Connect different parts of the course together
    
    Make topics specific enough to be meaningful but general enough to span multiple lectures.
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4",
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
                                "description": "A topic or concept title"
                            }
                        }
                    },
                    "required": ["topics"]
                }
            }],
            function_call={"name": "extract_topics"}
        )
        
        # Extract the function call arguments
        function_args = json.loads(response.choices[0].message.function_call.arguments)
        return function_args["topics"]
        
    except Exception as e:
        print(f"Error extracting topics: {e}")
        return ["Course Introduction", "Basic Concepts", "Advanced Topics"]
