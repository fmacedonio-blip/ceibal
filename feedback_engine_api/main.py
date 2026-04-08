import logging

from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)

from fastapi import FastAPI

from routers import audio_analyze, handwrite_analyze

app = FastAPI(title="Feedback Engine API")

app.include_router(handwrite_analyze.router)
app.include_router(audio_analyze.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
