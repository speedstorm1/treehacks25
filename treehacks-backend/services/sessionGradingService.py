import os
from typing import Dict, List
from PyPDF2 import PdfReader
import json
from openai import OpenAI
from dotenv import load_dotenv
from supabase import create_client, Client
from services.questionGradingService import grade_student_answer

# Load environment variables and initialize clients
load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)
openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

async def grade_session(short_id: str):
    """

    """
    try:
        result = supabase.table("sessions").select("id").eq("short_id", short_id).execute()
        session_id = result.data[0]["id"]
        # get number of problems in session from "session" table in supabase from "num_questions" column
        result = supabase.table("sessions").select("num_questions").eq("id", session_id).execute()
        num_questions = result.data[0]["num_questions"]

        # for each question in the session:
        for i in range(0, num_questions):
            # get question_id, question_text from "session_questions" by session_id and question_number
            result = supabase.table("session_questions").select("id", "question_text", "total_submission", "correct_submission").eq("session_id", session_id).eq("question_number", i).execute()
            question_id = result.data[0]["id"]
            question_text = result.data[0]["question_text"]

            # get all student answers for the question_id from session_responses 
            result = supabase.table("session_responses").select("response_text").eq("question_id", question_id).execute()
            answers = [answer["response_text"] for answer in result.data]

            # for each student answer:
            for answer in answers:
                # call questionGradingService to grade it given the problem statement and the student's answer
                grade = await grade_student_answer(question_id, question_text, answer)
                # add 1 to the "total_submission" column of the session_questions table for this question_id
                supabase.table("session_questions").update({"total_submission": result.data[0].get("total_submission") + 1}).eq("id", question_id).execute()
                # if incorrect, call add_session_answer_insight
                if grade == "0":
                    add_session_answer_insight(question_id, question_text, answer)
                # if correct, add 1 to the "correct_submission" column of the session_questions table for this question_id
                if grade == "1":
                    supabase.table("session_questions").update({"correct_submission": result.data[0].get("correct_submission") + 1}).eq("id", question_id).execute()
    
    except Exception as e:
        raise Exception(f"Error processing session: {str(e)}")


def add_session_answer_insight(question_id: int, question_text: str, answer_text: str):
    # openai call to get what is the main misunderstanding of the problem
    prompt = f"""
    Given this quiz question: {question_text}
    
    And this student's answer: {answer_text}
    
    Please analyze the student's answer and identify:
    1. The main misunderstanding or misconception
    2. Key areas where the student needs improvement
    
    Provide a concise response focusing on these points.
    """
    
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an educational assistant helping to analyze student answers to a learning check."},
            {"role": "user", "content": prompt}
        ]
    )
    
    insight = response.choices[0].message.content

    # add to session_answer_insight table
    response = supabase.table("session_answer_insight").insert({
        "summary": insight,
        "question_id": question_id,
    }).execute()
    
    return response