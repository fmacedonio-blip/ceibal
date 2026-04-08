import json
import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT = 90.0


class GatewaySession:
    """
    HTTP client for the Ceibal AI Gateway.

    Encapsulates the gateway's custom request protocol and automatically
    accumulates message_history across turns. One instance per pipeline run.

    Usage:
        session = GatewaySession(model="google/gemini-3.1-flash-lite-preview")
        content = session.send(user_content, system_prompt="You are...")
        # session._history now has 1 turn; send() again to continue the conversation
    """

    def __init__(
        self,
        model: str,
        user_profile: list[str] | None = None,
        timeout: float = DEFAULT_TIMEOUT,
        request_id: str | None = None,
    ) -> None:
        self.model = model
        self.user_profile = user_profile or []
        self.timeout = timeout
        self.request_id = request_id
        self._history: list[dict[str, Any]] = []

    def send(
        self,
        user_content: str | list,
        system_prompt: str,
        metadata: dict[str, Any] | None = None,
        attachment: dict[str, Any] | None = None,
    ) -> str:
        """
        Send a message to the gateway and return the response content as a string.
        Appends the completed turn to _history for subsequent calls.

        Args:
            user_content: Text string or multimodal list (for vision calls).
            system_prompt: Top-level system instruction for this turn.
            metadata: Optional gateway metadata (agent_max_tokens, agent_temperature, etc.).
            attachment: Optional S3 image attachment {"type","format","s3_bucket","s3_key"}.

        Returns:
            The response content string from the model.

        Raises:
            EnvironmentError: If GATEWAY_AI_URL is not set.
            RuntimeError: On HTTP errors or timeouts.
        """
        url = self._get_url()
        payload = self._build_payload(user_content, system_prompt, metadata, attachment)

        # Log payload para debug (trunca base64 de imágenes)
        debug_payload = json.loads(json.dumps(payload))
        for msg in debug_payload.get("messages", []):
            if isinstance(msg.get("content"), list):
                for part in msg["content"]:
                    if part.get("type") == "image_url":
                        url_val = part.get("image_url", {}).get("url", "")
                        part["image_url"]["url"] = url_val[:40] + "...[truncated]"
        logger.info("Gateway payload: %s", json.dumps(debug_payload, ensure_ascii=False, indent=2))

        try:
            response = httpx.post(
                url,
                json=payload,
                timeout=self.timeout,
            )
        except httpx.TimeoutException:
            raise RuntimeError(
                f"Gateway timeout after {self.timeout}s for model '{self.model}'"
            )
        except httpx.RequestError as e:
            raise RuntimeError(f"Network error calling gateway: {e}") from e

        if response.status_code != 200:
            raise RuntimeError(
                f"Gateway returned HTTP {response.status_code}: {response.text[:500]}"
            )

        body = response.json()
        content = self._extract_content(body)

        self._history.append({"role": "user", "content": user_content})
        self._history.append({"role": "assistant", "content": content})

        return content

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _get_url(self) -> str:
        from app.config import settings
        url = settings.gateway_ai_url
        if not url:
            raise EnvironmentError(
                "GATEWAY_AI_URL is not set. "
                "Add it to your .env file: GATEWAY_AI_URL=<gateway endpoint>"
            )
        return url

    def _build_payload(
        self,
        user_content: str | list,
        system_prompt: str,
        metadata: dict[str, Any] | None,
        attachment: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": self.model,
            "system_prompt": system_prompt,
            "messages": [{"role": "user", "content": user_content}],
        }

        if attachment:
            payload["attachment"] = attachment

        if self._history:
            payload["message_history"] = list(self._history)

        if self.user_profile:
            payload["user_profile"] = self.user_profile

        combined_metadata: dict[str, Any] = {}
        if self.request_id:
            combined_metadata["request_id"] = self.request_id
        if metadata:
            combined_metadata.update(metadata)
        if combined_metadata:
            payload["metadata"] = combined_metadata

        return payload

    def _extract_content(self, body: dict[str, Any]) -> str:
        """
        Extract the text content from the Ceibal AI Gateway response.

        Gateway response shape:
        {
            "statusCode": 200,
            "assistant_message": {"role": "assistant", "content": "...", "tool_calls": null},
            "provider": "...",
            "model": "...",
            "metadata": {...},
            "error": null
        }
        """
        try:
            return body["assistant_message"]["content"]
        except (KeyError, TypeError):
            pass

        raise RuntimeError(
            f"Cannot extract content from gateway response. "
            f"Expected body['assistant_message']['content']. "
            f"Response keys: {list(body.keys())}."
        )
