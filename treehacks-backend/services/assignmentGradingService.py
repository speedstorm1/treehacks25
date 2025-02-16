import os
from typing import Dict, List
from PyPDF2 import PdfReader
import json
from openai import OpenAI
from dotenv import load_dotenv
from supabase import create_client, Client
from services.submissionParsingService import extract_text_from_pdf, split_into_answers
from services.questionGradingService import grade_student_answer
from services.answerInsightService import add_answer_insight

# Load environment variables and initialize clients
load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)
openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

async def grade_student_assignment(assignment_id: int, pdf_path: str):
    """

    """
    try:
        # Extract text from PDF
        text = extract_text_from_pdf(pdf_path)
        
        # Split into questions
        answers = await split_into_answers(text)

        problem_num = 1
        for answer in answers:
            # fetch question for this assignment_id and this problem_number from Supabase
            question_response = supabase.table("assignment_question").select("*").eq("assignment_id", assignment_id).eq("problem_number", problem_num).execute()
            question_id = question_response.data[0].get("id")
            question_text = question_response.data[0].get("text")

            print(question_text)
            print("response", answer)

            # for each question, call questionGradingService to grade it given the problem statement and the student's answer
            grade = await grade_student_answer(question_id, question_text, answer)

            # update the "total_submission" column of the assignment_question table for this question_id by 1
            supabase.table("assignment_question").update({"total_submission": question_response.data[0].get("total_submission") + 1}).eq("id", question_id).execute()
            print("grade", grade)
            if grade == "0":
                # was incorrect, need to trigger insights for the problem
                add_answer_insight(question_id, question_text, answer)
            else:
                # was correct
                supabase.table("assignment_question").update({"correct_submission": question_response.data[0].get("correct_submission") + 1}).eq("id", question_id).execute()

            problem_num += 1
            print("\n\n")
        
    except Exception as e:
        raise Exception(f"Error processing assignment: {str(e)}")