import asyncio
from services.questionParsingService import parse_and_store_questions

async def test_parse_assignment():
    # Test assignment ID (you can change this as needed)
    assignment_id = 2
    
    # Path to the test PDF
    pdf_path = "test_assignment_parse.pdf"
    
    try:
        # Parse and store questions
        stored_questions = await parse_and_store_questions(
            assignment_id=assignment_id,
            pdf_path=pdf_path
        )
        
        print("Successfully parsed and stored questions:")
        # for question in stored_questions:
        #     print(f"\nQuestion {question['problem_number']}:")
        #     print(f"Text: {question['text']}")
            
    except Exception as e:
        print(f"Error: {str(e)}")

# Run the test
if __name__ == "__main__":
    asyncio.run(test_parse_assignment())