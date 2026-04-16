import os
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

class AdminAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/admin"):
            secret = request.headers.get("X-Admin-Secret")
            expected = os.getenv("ADMIN_SECRET")
            if secret != expected:
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Forbidden"}
                )
        return await call_next(request)


# Add to main.py AFTER the CORS middleware:
# from middleware import AdminAuthMiddleware
# app.add_middleware(AdminAuthMiddleware)