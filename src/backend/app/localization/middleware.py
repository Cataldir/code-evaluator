"""Request-scoped locale negotiation middleware."""

from __future__ import annotations

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from .utils import parse_accept_language


class LocalizationMiddleware(BaseHTTPMiddleware):
    """Attach the negotiated locale to the request state."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        locale = parse_accept_language(request.headers.get("accept-language"))
        request.state.locale = locale
        response = await call_next(request)
        response.headers["Content-Language"] = locale
        return response
