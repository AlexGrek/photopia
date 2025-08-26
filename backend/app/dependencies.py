from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import API_KEY

class APIKeyAuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware to check for a valid API key on all POST requests.
    This uses a class-based approach for middleware.
    """
    async def dispatch(self, request: Request, call_next):
        if request.method == "POST":
            api_key = request.headers.get("X-Api-Key")
            if not api_key or api_key != API_KEY:
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Invalid or missing API key"}
                )
        response = await call_next(request)
        return response
