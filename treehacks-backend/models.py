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
    submissions: int | None = None
    class_id: str | None = None

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

class AssignmentInsightResponse(BaseModel):
    id: int
    assignment_id: int
    summary: str
    created_at: str

class QuestionInsight(BaseModel):
    id: int
    question_id: int
    error_summary: str
    error_count: int
    created_at: str
    problem_number: int
    question_text: str
    total_submission: int
    correct_submission: int

class QuestionInsightsResponse(BaseModel):
    insights: list[QuestionInsight]

class TopicUpdate(BaseModel):
    title: str
    class_id: str

class SessionCreate(BaseModel):
    title: str
    num_questions: int
    lecture_id: str
    timestamp: float
    class_id: str

class LectureCreate(BaseModel):
    name: str
    slides: str | None = None
    lecture_video: str | None = None
    class_id: str

class ResponseItem(BaseModel):
    question_id: str
    response_text: str

class ResponseCreate(BaseModel):
    responses: list[ResponseItem]

class Syllabus(BaseModel):
    syllabus_url: str
    class_id: str

class AssignmentCreate(BaseModel):
    name: str
    due_date: str
    class_id: str
