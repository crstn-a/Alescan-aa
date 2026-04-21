# backend/services/auth.py
import os
import bcrypt
from datetime import datetime, timedelta
from jose import JWTError, jwt
from services.db import get_supabase

SECRET_KEY  = os.getenv("JWT_SECRET", "change-this-in-production-env")
ALGORITHM   = "HS256"
EXPIRE_MINS = 480   # 8 hours


def hash_password(plain: str) -> str:
    """Hash a plain password with bcrypt. Use this to seed admin_users."""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain password against a stored bcrypt hash."""
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


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