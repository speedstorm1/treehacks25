import os
from re import S
from typing import Dict, List, Tuple
from PyPDF2 import PdfReader
from .questionGradingService import grade_student_answer
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class AssignmentGradingService:
    def extract_text_from_pdf(pdf_path: str) -> str:
        """Extract text content from a PDF file."""
        try:
            reader = PdfReader(pdf_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text()
            return text
        except Exception as e:
            raise Exception(f"Error extracting text from PDF: {str(e)}")

    async def split_into_questions(text: str, is_problem_statement: bool = True) -> List[Dict[str, str]]:
        """
        Use openai apis split text into individual questions or answers.
        
        Args:
            text: The text to split
            is_problem_statement: Whether this is a problem statement (True) or student answer (False)
            
        Returns:
            List of dictionaries containing question/answer number and text
        """
        prompt = f"""
        {'Parse this problem statement document' if is_problem_statement else 'Parse this student answer document'} into separate questions.
        
        Document text:
        {text}
        
        Split this into individual {'questions' if is_problem_statement else 'answers'} and return them in the following JSON format:
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
        3. Maintain the original question numbering
        4. Remove any headers, footers, or non-question content
        5. Keep mathematical formulas, code snippets, and special characters intact
        """

        try:
            response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at parsing academic documents and identifying distinct questions and answers."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                response_format={"type": "json_object"},
                temperature=0.1  # Low temperature for consistent parsing
            )
            
            result = json.loads(response.choices[0].message.content)
            return result["questions"]
            
        except Exception as e:
            raise Exception(f"Error splitting text into questions: {str(e)}")

    async def match_questions_and_answers(
        problem_text: str,
        answer_text: str
    ) -> List[Tuple[Dict[str, str], Dict[str, str]]]:
        """
        Match questions from the problem statement with their corresponding answers using GPT-4.
        Returns a list of (question, answer) tuples.
        """
        # Split both texts into questions and answers
        problems = await AssignmentGradingService.split_into_questions(problem_text, True)
        answers = await AssignmentGradingService.split_into_questions(answer_text, False)
        
        # Sort by question number to ensure proper matching
        problems.sort(key=lambda x: x["number"])
        answers.sort(key=lambda x: x["number"])
        
        # Match questions with answers
        pairs = []
        for i in range(min(len(problems), len(answers))):
            pairs.append((problems[i], answers[i]))
            
        return pairs

    async def grade_assignment(
        assignment_id: str,
        problem_pdf_path: str,
        submission_pdf_path: str,
        max_points_per_question: Dict[int, int]
    ) -> List[Dict]:
        """
        Grade an entire assignment by processing both PDFs and grading each question.
        
        Args:
            assignment_id: The ID of the assignment
            problem_pdf_path: Path to the PDF containing problem statements
            submission_pdf_path: Path to the PDF containing student's submission
            max_points_per_question: Dictionary mapping question numbers to their max points
            
        Returns:
            List of grading results for each question
        """
        try:
            # Extract text from both PDFs
            problem_text = AssignmentGradingService.extract_text_from_pdf(problem_pdf_path)
            submission_text = AssignmentGradingService.extract_text_from_pdf(submission_pdf_path)
            
            # Match questions with answers
            question_answer_pairs = await AssignmentGradingService.match_questions_and_answers(
                problem_text,
                submission_text
            )
            
            # Grade each question
            grading_results = []
            scores = {}
            for question_dict, answer_dict in question_answer_pairs:
                question_num = question_dict["number"]
                if question_num not in max_points_per_question:
                    continue
                    
                max_points = max_points_per_question[question_num]
                
                # Grade the question using questionGradingService
                result = await grade_student_answer(
                    question_id=question_num,
                    question_text=question_dict["text"],
                    answer_text=answer_dict["text"],
                    max_points=max_points
                )
                
                grading_results.append({
                    "question_number": question_num,
                    "question_text": question_dict["text"],
                    "answer_text": answer_dict["text"],
                    "grading_result": result
                })

                scores[question_num] = int(result["score"])
            
            return scores, AssignmentGradingService.calculate_total_score(grading_results), grading_results
            
        except Exception as e:
            raise Exception(f"Error grading assignment: {str(e)}")

    @staticmethod
    def calculate_total_score(grading_results: List[Dict]) -> Tuple[int, int]:
        """
        Calculate the total score and maximum possible score from grading results.
        
        Returns:
            Tuple of (total_score, max_possible_score)
        """
        total_score = sum(result["grading_result"]["score"] for result in grading_results)
        max_score = sum(result["grading_result"]["max_points"] for result in grading_results)
        return total_score, max_score