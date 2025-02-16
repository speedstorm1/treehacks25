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


def publish_session_question_extracted_insight(short_id: int):
    result = supabase.table("sessions").select("id").eq("short_id", short_id).execute()
    session_id = result.data[0]["id"]
    response = supabase.table("session_questions").select("id").eq("session_id", session_id).execute()
    question_ids = response.data

    for value in question_ids:
        question_id = value["id"]
        supabase.table("session_question_extracted_insight").delete().eq("question_id", question_id).execute()
    
    for value in question_ids:
        question_id = value["id"]
        answer_insight_response = supabase.table("session_answer_insight").select("*").eq("question_id", question_id).execute()
        insights = answer_insight_response.data
        print(f"insights for question id: {question_id}: ", insights)
        
        if not insights:
            continue
            
        all_insights = "\n".join([insight["summary"] for insight in insights])
        
        prompt = f"""
        Analyze these student answer insights and identify the most common misconceptions or errors (max 3):
        {all_insights}
        
        For each misconception/error, provide:
        1. A clear description of the misconception that is under 8 words
        2. An exact count of how many students had this misconception. There is one student for each Main Misunderstanding or Misconception and Key Areas for Improvement insight.

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
            misconceptions = [response_content.get("misconceptions", [])[0]]
            print(f"Response for question {question_id}: ", response_content)
            print(f"Extracted misconceptions: ", misconceptions)
            
            for misconception in misconceptions:
                supabase.table("session_question_extracted_insight").insert({
                    "question_id": question_id,
                    "error_summary": misconception["error_type"],
                    "error_count": misconception["error_count"],
                }).execute()
                
        except Exception as e:
            print(f"Error processing question {question_id}: {str(e)}")
            continue
    
    return "Question insights published successfully"

def publish_session_summary(short_id: int):
    result = supabase.table("sessions").select("id").eq("short_id", short_id).execute()
    session_id = result.data[0]["id"]
    # Get questions with their problem numbers
    questions_response = supabase.table("session_questions").select("id,question_number").eq("session_id", session_id).execute()
    question_map = {q["id"]: q["question_number"] for q in questions_response.data}
    question_ids = list(question_map.keys())
    
    all_insights = []
    for qid in question_ids:
        insights_response = supabase.table("session_question_extracted_insight").select("*").eq("question_id", qid).execute()
        # Add problem_number to each insight
        for insight in insights_response.data:
            insight["question_number"] = question_map[qid]
        all_insights.extend(insights_response.data)
    
    if not all_insights:
        return "No insights found for this session"
    
    insights_text = ""
    for insight in all_insights:
        insights_text += f"Problem {insight['question_number']}: {insight['error_summary']} (Found in {insight['error_count']} responses)\n"
    
    prompt = f"""
    Analyze these question-level insights from a learning check quiz and create a comprehensive summary:
    
    {insights_text}
    
    Please only provide:
    1. A high-level summary of the main conceptual issues across all questions
    2. Identify any patterns or related misconceptions across different questions
    
    Format your response in a clear, simple, very concise way that would be helpful for an instructor. Don't leave any additional comments.
    """
    
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are an educational analyst creating quiz-level summaries from question-level insights."},
            {"role": "user", "content": prompt}
        ]
    )
    
    summary = response.choices[0].message.content
    
    try:
        existing_insight = supabase.table("session_insight").select("*").eq("session_id", session_id).execute()
            
        if existing_insight.data:
            supabase.table("session_insight").update({
                "summary": summary,
            }).eq("session_id", session_id).execute()
            return "Session summary updated successfully"
        else:
            supabase.table("session_insight").insert({
                "session_id": session_id,
                "summary": summary,
            }).execute()
            return "Session summary published successfully"
    except Exception as e:
        print(f"Error publishing session summary: {str(e)}")
        return f"Error: {str(e)}"

if __name__ == "__main__":
    assignment_id = None
    # print("\n=== Testing publish_question_extracted_insight ===")
    # print(f"Getting questions for assignment {assignment_id}...")
    
    # # Get questions to verify data
    # questions_response = supabase.table("assignment_question").select("*").eq("assignment_id", assignment_id).execute()
    # print(f"Found {len(questions_response.data)} questions:")
    # for q in questions_response.data:
    #     print(f"- Question ID: {q['id']}")
        
    #     # Get answer insights for each question
    #     insights = supabase.table("homework_answer_insight").select("*").eq("question_id", q['id']).execute()
    #     print(f"  Found {len(insights.data)} answer insights")
    #     for insight in insights.data:
    #         print(f"  - {insight['summary']}")
    
    # print("\nPublishing question extracted insights...")
    # result = publish_question_extracted_insight(assignment_id)
    # print("Result:", result)
    
    # # Verify the extracted insights
    # print("\nVerifying extracted insights...")
    # for q in questions_response.data:
    #     extracted = supabase.table("homework_question_extracted_insight").select("*").eq("question_id", q['id']).execute()
    #     print(f"\nQuestion {q['id']} extracted insights:")
    #     for e in extracted.data:
    #         print(f"- {e['error_summary']}: {e['error_count']} occurrences")
    
    # print("\n=== Testing publish_homework_summary ===")
    # print(f"Publishing homework summary for assignment {assignment_id}...")
    # result = publish_homework_summary(assignment_id)
    # print("Result:", result)
    
    # # Verify the homework summary
    # print("\nVerifying homework summary...")
    # summary = supabase.table("assignment_insight").select("*").eq("assignment_id", assignment_id).execute()
    # if summary.data:
    #     print("\nHomework Summary:")
    #     print(summary.data[0]['summary'])
    # else:
    #     print("No summary found")