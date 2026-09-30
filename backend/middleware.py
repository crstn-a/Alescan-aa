from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from starlette.responses import JSONResponse
import logging
from services.auth import decode_token, verify_admin_account

logger = logging.getLogger(__name__)


class AdminAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):

        path = request.url.path

        # ✅ Allow preflight
        if request.method == "OPTIONS":
            return await call_next(request)

        # ✅ Allow login endpoint (public)
        if path.startswith("/admin/api/login"):
            return await call_next(request)

        # ✅ Allow public report endpoints (user auth handled separately)
        if path.startswith("/api/reports"):
            return await call_next(request)

        # ✅ Protect only admin API routes
        if path.startswith("/admin/api"):
            auth = request.headers.get("Authorization")

            if not auth or not auth.startswith("Bearer "):
                return JSONResponse(status_code=401, content={"detail": "Unauthorized"})

            parts = auth.split(" ", 1)
            if len(parts) != 2 or not parts[1].strip():
                return JSONResponse(status_code=401, content={"detail": "Unauthorized"})

            token = parts[1].strip()

            # 1. Cryptographically decode & validate token signature, expiration, and type
            claims = decode_token(token)
            if not claims:
                return JSONResponse(status_code=401, content={"detail": "Invalid or expired token"})

            # 2. Visibly authorize admin role claim
            role = claims.get("role", "admin")
            if role not in ("admin", "superadmin"):
                logger.warning(f"Forbidden: Token has unauthorized role '{role}'")
                return JSONResponse(status_code=403, content={"detail": "Forbidden: Insufficient privileges"})

            # 3. Visibly authorize against current admin account record in database on each request
            username = claims.get("sub")
            if not username:
                return JSONResponse(status_code=401, content={"detail": "Invalid token subject"})

            admin_account = verify_admin_account(username)
            if not admin_account:
                logger.warning(f"Unauthorized admin access attempt: user '{username}' not found or inactive in database")
                return JSONResponse(status_code=403, content={"detail": "Forbidden: Admin account not authorized or inactive"})

            # Attach authorized admin account and claims to request state
            request.state.admin_user = admin_account
            request.state.admin_claims = claims

        return await call_next(request)