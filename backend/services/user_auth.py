# backend/services/user_auth.py
"""
Authentication service for public users (consumers).
Completely separate from admin auth — uses `public_users` table,
email-based login, and JWT tokens with type="user".
"""

import os
import bcrypt
from datetime import datetime, timedelta
from jose import JWTError, jwt
from services.db import get_supabase
import logging

logger = logging.getLogger(__name__)

SECRET_KEY  = os.getenv("JWT_SECRET", "change-this-in-production-env")
ALGORITHM   = "HS256"
USER_EXPIRE_MINS = 1440   # 24 hours for public users


def hash_password(plain: str) -> str:
    """Hash a plain password with bcrypt."""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain password against a stored bcrypt hash."""
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def register_user(first_name: str, last_name: str, email: str, password: str, phone: str = None) -> dict:
    """
    Register a new public user.
    Returns the created user row or raises on duplicate email.
    """
    sb = get_supabase()
    
    # Check if email already exists
    existing = (
        sb.table("public_users")
        .select("id")
        .eq("email", email.strip().lower())
        .execute()
    )
    if existing.data:
        raise ValueError("An account with this email already exists")
    
    hashed = hash_password(password)
    user_data = {
        "first_name": first_name.strip(),
        "last_name": last_name.strip(),
        "email": email.strip().lower(),
        "password_hash": hashed,
        "phone": phone.strip() if phone else None,
    }
    
    result = sb.table("public_users").insert(user_data).execute()
    if not result.data:
        raise RuntimeError("Failed to create user account")
    
    return result.data[0]


def authenticate_user(email: str, password: str) -> dict | None:
    """
    Look up email in public_users table.
    Returns the user row if password matches, None otherwise.
    """
    sb = get_supabase()
    result = (
        sb.table("public_users")
        .select("id, first_name, last_name, email, phone")
        .eq("email", email.strip().lower())
        .execute()
    )
    if not result.data:
        return None
    
    user = result.data[0]
    
    # Need password_hash separately for verification
    pw_result = (
        sb.table("public_users")
        .select("password_hash")
        .eq("id", user["id"])
        .single()
        .execute()
    )
    if not pw_result.data:
        return None
    
    if not verify_password(password, pw_result.data["password_hash"]):
        return None
    
    return user


def create_user_token(user_id: int, email: str) -> str:
    """Create a signed JWT for a public user that expires after USER_EXPIRE_MINS."""
    expire = datetime.utcnow() + timedelta(minutes=USER_EXPIRE_MINS)
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": expire,
        "type": "user",
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_user_token(token: str) -> dict | None:
    """
    Decode and validate a public user JWT.
    Returns {"user_id": ..., "email": ...} if valid, None otherwise.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "user":
            return None
        return {
            "user_id": int(payload.get("sub")),
            "email": payload.get("email"),
        }
    except JWTError:
        return None
