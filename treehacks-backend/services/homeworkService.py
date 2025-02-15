import os
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI
from pydantic import BaseModel
import json

load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)
openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


def publish_question_extracted_insight(homework_id: int):
    response = supabase.table("homework_question").select("id").eq("homework_id", homework_id).execute()
    question_ids = response.data

    for value in question_ids:
        question_id = value["id"]
        supabase.table("homework_question_extracted_insight").delete().eq("question_id", question_id).execute()
    
    for value in question_ids:
        question_id = value["id"]
        answer_insight_response = supabase.table("homework_answer_insight").select("*").eq("question_id", question_id).execute()
        insights = answer_insight_response.data
        print(f"insights for question id: {question_id}: ", insights)
        
        if not insights:
            continue
            
        all_insights = "\n".join([insight["summary"] for insight in insights])
        
        prompt = f"""
        Analyze these student answer insights and identify the most common misconceptions or errors(max 5):
        {all_insights}
        
        For each misconception/error, provide:
        1. A clear description of the misconception that is under 8 words
        2. An exact count of how many students had this misconception

        Return the response in the following JSON format:
        {{"misconceptions": [
            {{"error_type": "description of the misconception",
             "error_count": number of answers with this misconception}}
        ]}}

        """
        
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an educational analyst identifying common student misconceptions."},
                {"role": "user", "content": prompt}
            ],
            response_format= { "type": "json_object" },
        )
        
        try:
            response_content = json.loads(response.choices[0].message.content)
            misconceptions = response_content.get("misconceptions", [])
            print(f"Response for question {question_id}: ", response_content)
            print(f"Extracted misconceptions: ", misconceptions)
            
            for misconception in misconceptions:
                supabase.table("homework_question_extracted_insight").insert({
                    "question_id": question_id,
                    "error_summary": misconception["error_type"],
                    "error_count": misconception["error_count"],
                }).execute()
                
        except Exception as e:
            print(f"Error processing question {question_id}: {str(e)}")
            continue
    
    return "Question insights published successfully"

def publish_homework_summary(homework_id: int):
    questions_response = supabase.table("homework_question").select("id").eq("homework_id", homework_id).execute()
    question_ids = [q["id"] for q in questions_response.data]
    
    all_insights = []
    for qid in question_ids:
        insights_response = supabase.table("homework_question_extracted_insight").select("*").eq("question_id", qid).execute()
        all_insights.extend(insights_response.data)
    
    if not all_insights:
        return "No insights found for this homework"
    
    insights_text = ""
    for insight in all_insights:
        insights_text += f"Question {insight['question_id']}: {insight['error_summary']} (Found in {insight['error_count']} responses)\n"
    
    prompt = f"""
    Analyze these question-level insights from a homework assignment and create a comprehensive summary:
    
    {insights_text}
    
    Please only provide:
    1. A high-level summary of the main conceptual issues across all questions
    2. Identify any patterns or related misconceptions across different questions
    
    Format your response in a clear, concise way that would be helpful for an instructor. Don't leave any additional comments.
    """
    
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are an educational analyst creating homework-level summaries from question-level insights."},
            {"role": "user", "content": prompt}
        ]
    )
    
    summary = response.choices[0].message.content
    
    try:
        existing_insight = supabase.table("homework_insight").select("*").eq("homework_id", homework_id).execute()
            
        if existing_insight.data:
            supabase.table("homework_insight").update({
                "summary": summary,
            }).eq("homework_id", homework_id).execute()
            return "Homework summary updated successfully"
        else:
            supabase.table("homework_insight").insert({
                "homework_id": homework_id,
                "summary": summary,
            }).execute()
            return "Homework summary published successfully"
    except Exception as e:
        print(f"Error publishing homework summary: {str(e)}")
        return f"Error: {str(e)}"