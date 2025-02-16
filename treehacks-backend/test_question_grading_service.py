import asyncio
from services.questionGradingService import grade_student_answer

async def test_question_grading():
    # Test assignment ID (you can change this as needed)
    question_id = 6
    question_text = "In how many ways can a pack of fifty-two cards be dealt to thirteen players, four to each, so that every player has one card of each suit?"
    answer_text = "Apply the product rule: First deal the hearts, one to each person, then the spades, one to each person, then diamonds, then the clubs. For each of these steps, there are 13! possibilities. Therefore, the answer is (13!)^4"
    # HW1, Q2 [qid 6]    
    try:
        response = grade_student_answer(question_id, question_text, answer_text)
        print(response)
            
    except Exception as e:
        print(f"Error: {str(e)}")

# Run the test
if __name__ == "__main__":
    asyncio.run(test_question_grading())