# Re-export all models so existing imports (from app.models import User) keep working
from app.models.base import Base
from app.models.chat import ChatMessage, ChatSession
from app.models.existing import Activity, AiDiagnosis, Alert, Course, Student, User
from app.models.submission import Submission, SubmissionError

__all__ = [
    "Base",
    "User",
    "Course",
    "Student",
    "Activity",
    "AiDiagnosis",
    "Alert",
    "Submission",
    "SubmissionError",
    "ChatSession",
    "ChatMessage",
]
