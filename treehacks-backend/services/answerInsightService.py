import os
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI

load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)
openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def add_answer_insight(question_id: int, question_text: str, answer_text: str):
    # openai call to get what is the main misunderstanding of the problem
    prompt = f"""
    Given this homework question: {question_text}
    
    And this student's answer: {answer_text}
    
    Please analyze the student's answer and identify:
    1. The main misunderstanding or misconception
    2. Key areas where the student needs improvement
    
    Provide a concise response focusing on these points.
    """
    
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are an educational assistant helping to analyze student answers."},
            {"role": "user", "content": prompt}
        ]
    )
    
    insight = response.choices[0].message.content

    # add to homework_answer_insight table
    response = supabase.table("homework_answer_insight").insert({
        "summary": insight,
        "question_id": question_id,
    }).execute()
    
    return response