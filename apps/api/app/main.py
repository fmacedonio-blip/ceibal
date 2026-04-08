from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import audio_analyze, auth, chat, courses, dashboard, handwrite_analyze, handwrite_analyze_aws, students, submissions

app = FastAPI(
    title="Ceibal Copiloto Pedagógico API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(courses.router)
app.include_router(students.router)
app.include_router(audio_analyze.router)
app.include_router(handwrite_analyze.router)
app.include_router(handwrite_analyze_aws.router)
app.include_router(submissions.router)
app.include_router(chat.router)
