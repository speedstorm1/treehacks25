from typing import List, Dict, Set
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def setup_gemini():
    """Initialize Gemini API with key"""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("API key not found")
    
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-pro')

def get_all_topics(class_id: str) -> List[Dict]:
    """Get all topics from the topics table."""
    try:
        response = supabase.table('topic').select('*').eq('class_id', class_id).execute()
        if not response or not response.data:
            return []
        return response.data
    except Exception as e:
        print(f"Error getting topics: {str(e)}")
        return []

def get_topic_by_id(topic_id: str) -> Dict:
    """Get a specific topic by ID."""
    try:
        response = supabase.table('topic').select('*').eq('id', topic_id).execute()
        if not response or not response.data:
            raise Exception("Topic not found")
        if len(response.data) == 0:
            raise Exception(f"Topic with id {topic_id} not found")
        return response.data[0]
    except Exception as e:
        raise Exception(f"Error fetching topic: {str(e)}")

def get_topics_for_question_generation(class_id: str) -> List[Dict]:
    """Get topics in a format suitable for question generation context."""
    topics = get_all_topics(class_id)
    return [{"id": topic["id"], "title": topic["title"]} 
            for topic in topics]

def categorize_question(question_text: str, explanation: str, class_id: str) -> List[str]:
    """
    Use LLM to categorize a question into one or more relevant topics.
    Returns a list of topic IDs that the question belongs to.
    """
    try:
        # Get all available topics
        topics = get_all_topics(class_id)
        if not topics:
            raise Exception("No topics available for categorization")
        
        # Create topic context
        topic_context = "\n".join([
            f"- {topic['title']}"
            for topic in topics
        ])
        
        # Setup prompt for topic categorization
        prompt = f"""You are an expert at categorizing educational content.
        Given a question and its explanation, determine which topics from the list below are relevant.
        A question can belong to multiple topics if it spans multiple concepts.
        
        Available Topics:
        {topic_context}
        
        Question: {question_text}
        Explanation: {explanation}
        
        Return ONLY a JSON array of topic titles that are relevant to this question. Consider:
        1. The main concept being tested
        2. Related concepts needed to answer the question
        3. Concepts mentioned in the explanation
        
        Return the array in this exact format (no other text):
        ["Topic 1", "Topic 2"]"""
        
        # Get model response
        model = setup_gemini()
        response = model.generate_content(prompt)
        if not response or not response.text:
            raise Exception("No response from model")
        
        # Parse response and clean it up
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        # Parse topic titles
        import json
        topic_titles = json.loads(response_text)
        
        # Map titles to IDs
        topic_map = {topic["title"]: topic["id"] for topic in topics}
        topic_ids = []
        
        for title in topic_titles:
            if title in topic_map:
                topic_ids.append(topic_map[title])
        
        # If no topics were matched, return the most relevant topic
        if not topic_ids and topics:
            topic_ids = [topics[0]["id"]]
            
        return topic_ids
        
    except Exception as e:
        # If anything fails, return the first topic as a fallback
        print(f"Error in topic categorization: {str(e)}")
        return [topics[0]["id"]] if topics else []
