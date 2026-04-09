import json
import logging
import os
import urllib.request

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)

# ── Load secrets from gateway-vault ───────────────────────────────────────
# Must run before app.config is imported so pydantic-settings reads the
# already-populated os.environ (DATABASE_URL, JWT_SECRET, etc.).
_vault_url = os.environ.get("VAULT_URL")
if _vault_url:
    _service_name = os.environ.get("SERVICE_NAME", "ceibal-api")
    _payload = json.dumps({
        "action": "get_lambda_config",
        "payload": {"lambda_name": _service_name},
    }).encode()
    _req = urllib.request.Request(
        _vault_url, data=_payload, headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(_req, timeout=10) as _resp:
            _body = json.loads(_resp.read())
        if "body" in _body:
            _body = json.loads(_body["body"]) if isinstance(_body["body"], str) else _body["body"]
        if not _body.get("success"):
            raise RuntimeError(_body.get("error", "unknown vault error"))
        _variables = _body.get("variables", {})
        for _k, _v in _variables.items():
            os.environ.setdefault(_k, _v)
        logging.getLogger(__name__).info("Loaded %d variables from vault", len(_variables))
    except Exception as _exc:
        raise RuntimeError(f"Failed to load vault secrets: {_exc}") from _exc
# ──────────────────────────────────────────────────────────────────────────

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from app.config import settings  # noqa: E402
from app.routers import (  # noqa: E402
    admin,
    audio_analyze,
    chat,
    courses,
    dashboard,
    handwrite_analyze,
    handwrite_analyze_aws,
    me,
    students,
    submissions,
)

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


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/healthcheck")
def healthcheck() -> dict:
    return {"status": "ok"}


@app.get("/gateway-feedback/health")
def health_prefixed() -> dict:
    return {"status": "ok"}


_ROUTERS = [
    admin.router,
    dashboard.router,
    courses.router,
    students.router,
    audio_analyze.router,
    handwrite_analyze.router,
    handwrite_analyze_aws.router,
    submissions.router,
    chat.router,
    me.router,
]

# Register all routes at / and at /gateway-feedback so the EKS ALB ingress
# (path prefix /gateway-feedback) and direct in-cluster calls both work.
for _router in _ROUTERS:
    app.include_router(_router)
    app.include_router(_router, prefix="/gateway-feedback")
