from __future__ import annotations

import time

import httpx
from jose import JWTError, jwt

from app.config import settings

_cache: dict = {"keys": None, "at": 0.0}
_CACHE_TTL = 3600  # 1 hour


def _get_jwks() -> list:
    if _cache["keys"] is None or time.time() - _cache["at"] > _CACHE_TTL:
        response = httpx.get(settings.cognito_jwks_url, timeout=5.0)
        response.raise_for_status()
        _cache["keys"] = response.json()["keys"]
        _cache["at"] = time.time()
    return _cache["keys"]


def validate_cognito_token(token: str) -> dict:
    """Validate a Cognito RS256 token against the User Pool JWKS. Returns claims dict."""
    try:
        return jwt.decode(
            token,
            {"keys": _get_jwks()},
            algorithms=["RS256"],
            audience=settings.cognito_app_client_id,
            issuer=settings.cognito_issuer,
        )
    except JWTError as e:
        raise ValueError(str(e)) from e
