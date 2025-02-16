from pydantic import BaseModel

class TestRequest(BaseModel):
    text: str
    
class TestResponse(BaseModel):
    response: str

class DownloadRequest(BaseModel):
    lecture_url: str
    slides_url: str

class ExtractAudioRequest(BaseModel):
    video_name: str
    test_mode: bool = False

class TranscribeRequest(BaseModel):
    video_name: str
    test_mode: bool = False

class AssignmentResponse(BaseModel):
    id: int
    name: str | None = None
    due_date: str | None = None
    created_at: str

class QuestionData(BaseModel):
    id: int
    created_at: str
    error_summary: str
    error_count: int
    question_id: int

class AssignmentDetailsResponse(BaseModel):
    id: int
    title: str
    due_date: str | None = None
    created_at: str
    summary: str
    questions: list[QuestionData]