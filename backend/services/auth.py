# backend/services/auth.py
import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from services.db import get_supabase

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY  = os.getenv("JWT_SECRET")
ALGORITHM   = "HS256"
EXPIRE_MINS = 480   # 8 hours — enough for a full admin session


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def authenticate_admin(username: str, password: str) -> dict | None:
    """
    Look up username in admin_users table.
    Returns the user row if password matches, None otherwise.
    """
    sb = get_supabase()
    result = (
        sb.table("admin_users")
        .select("id, username, password_hash")
        .eq("username", username.strip().lower())
        .single()
        .execute()
    )
    if not result.data:
        return None
    user = result.data
    if not verify_password(password, user["password_hash"]):
        return None
    return user


def create_access_token(username: str) -> str:
    """Create a signed JWT that expires after EXPIRE_MINS minutes."""
    expire = datetime.utcnow() + timedelta(minutes=EXPIRE_MINS)
    payload = {"sub": username, "exp": expire, "type": "admin"}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> str | None:
    """
    Decode and validate a JWT.
    Returns the username (sub) if valid, None if expired or tampered.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "admin":
            return None
        return payload.get("sub")
    except JWTError:
        return None