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

class TopicUpdate(BaseModel):
    title: str


class SessionCreate(BaseModel):
    title: str
    num_questions: int
    lecture_id: str
    timestamp: float

class LectureCreate(BaseModel):
    name: str
    slides: str | None = None
    lecture_video: str | None = None

class ResponseCreate(BaseModel):
    question_id: str
    response_text: str

class Syllabus(BaseModel):
    syllabus_url: str