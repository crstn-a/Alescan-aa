from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, HTTPException
from services.auth import decode_token


class AdminAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):

        path = request.url.path

        # ✅ Allow preflight
        if request.method == "OPTIONS":
            return await call_next(request)

        # ✅ Allow login endpoint (public)
        if path.startswith("/admin/api/login"):
            return await call_next(request)

        # ✅ Protect only admin API routes
        if path.startswith("/admin/api"):
            auth = request.headers.get("Authorization")

            if not auth or not auth.startswith("Bearer "):
                raise HTTPException(status_code=401, detail="Unauthorized")

            token = auth.split(" ")[1]
            user = decode_token(token)

            if not user:
                raise HTTPException(status_code=401, detail="Invalid token")

        return await call_next(request)