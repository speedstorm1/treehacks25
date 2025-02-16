import asyncio
from services.assignmentGradingService import grade_student_assignment

async def test_grade_assignment():
    # Test assignment ID (you can change this as needed)
    assignment_id = 2
    
    # Path to the test PDF
    pdf_path = "test_assignment_grade.pdf"
    
    try:
        await grade_student_assignment(assignment_id, pdf_path)
        
        print("Successfully completed")
            
    except Exception as e:
        print(f"Error: {str(e)}")

# Run the test
if __name__ == "__main__":
    asyncio.run(test_grade_assignment())