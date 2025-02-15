import os
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI

load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)
openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def grade_student_answer(question_id: int, question_text: str, answer_text: str, max_points: int):
    # openai call to score the problem (either 0 points or full points)
    prompt = f"""
    Given this homework question: {question_text} with a maximum of {max_points} points
    
    And this student's answer: {answer_text}
    
    Please analyze the student's answer and respond only with a numerical score of either 0 or {max_points} points
    representing whether the student's response is correct or not.
    """
    
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are an educational assistant helping to analyze student answers."},
            {"role": "user", "content": prompt}
        ]
    )

    grade = response.choices[0].message.content
    print(grade)

    # TODO add to database, use score to trigger if feedback is needed or not