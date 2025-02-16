import os
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI

load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)
openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

async def grade_student_answer(question_id: int, question_text: str, answer_text: str, max_points: int = 1):
    print("grading student answer")
    # openai call to score the problem (either 0 points or full points)
    prompt = f"""
    Given this assignment question: {question_text} with a maximum of {max_points} point{'' if max_points == 1 else 's' }
    
    And this student's response: {answer_text}
    
    Please analyze the student's response and respond only with a numerical score of either 0 or {max_points} point{'s' if max_points != 1 else ''}
     representing whether the student's response is correct or not.
    """
    
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are an educational assistant helping to analyze student responses."},
            {"role": "user", "content": prompt}
        ]
    )

    grade = response.choices[0].message.content
    print(grade)
    
    return grade