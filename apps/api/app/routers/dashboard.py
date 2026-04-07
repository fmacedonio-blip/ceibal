from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.mock_data import ALERTS, COURSES, RECENT_ACTIVITY

router = APIRouter(prefix="/api/v1", tags=["dashboard"])


@router.get("/dashboard")
def get_dashboard(_user: dict = Depends(get_current_user)) -> dict:
    return {
        "alerts": ALERTS,
        "courses": [
            {
                "id": c["id"],
                "name": c["name"],
                "shift": c["shift"],
                "student_count": c["student_count"],
                "average": c["average"],
            }
            for c in COURSES[:2]
        ],
        "recent_activity": RECENT_ACTIVITY,
    }
