# backend/services/auth.py
import os
import bcrypt
from datetime import datetime, timedelta
from jose import JWTError, jwt
from services.db import get_supabase
import logging

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

SECRET_KEY  = os.getenv("JWT_SECRET")
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
    Returns the user row if password matches and account is active, None otherwise.
    """
    try:
        sb = get_supabase()
        result = (
            sb.table("admin_users")
            .select("id, username, password_hash")
            .eq("username", username.strip().lower())
            .limit(1)
            .execute()
        )
        if not result.data:
            return None
        user = result.data[0]
        if "is_active" in user and not user["is_active"]:
            logger.warning(f"Admin login attempt for inactive account: '{username}'")
            return None
        if "status" in user and user["status"] != "active":
            logger.warning(f"Admin login attempt for account with status '{user['status']}': '{username}'")
            return None
        if not verify_password(password, user["password_hash"]):
            return None
        return user
    except Exception as e:
        logger.error(f"Error authenticating admin '{username}': {e}")
        return None


def get_admin_by_username(username: str) -> dict | None:
    """
    Look up username in admin_users table and verify current account record and status.
    Returns the admin account record if active and valid, None otherwise.
    """
    if not username:
        return None
    try:
        sb = get_supabase()
        result = (
            sb.table("admin_users")
            .select("id, username, created_at")
            .eq("username", username.strip().lower())
            .limit(1)
            .execute()
        )
        if not result.data:
            return None
        user = result.data[0]
        # Verify account status and role if fields are present in schema
        if "is_active" in user and not user["is_active"]:
            logger.warning(f"Admin account '{username}' is inactive.")
            return None
        if "status" in user and user["status"] != "active":
            logger.warning(f"Admin account '{username}' has inactive status '{user['status']}'.")
            return None
        if "role" in user and user["role"] not in ("admin", "superadmin"):
            logger.warning(f"Admin account '{username}' has invalid role '{user['role']}'.")
            return None
        return user
    except Exception as e:
        logger.error(f"Failed to verify admin account status for '{username}': {e}")
        return None


def verify_admin_account(username: str) -> dict | None:
    """Alias for get_admin_by_username to verify account record and status."""
    return get_admin_by_username(username)


def create_access_token(username: str, role: str = "admin") -> str:
    """Create a signed JWT with admin role that expires after EXPIRE_MINS minutes."""
    expire = datetime.utcnow() + timedelta(minutes=EXPIRE_MINS)
    payload = {
        "sub": username,
        "exp": expire,
        "type": "admin",
        "role": role,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict | None:
    """
    Decode and validate an admin JWT cryptographically.
    Validates cryptographic signature, expiration, and ensures type is 'admin'
    and role is an authorized admin role.
    Returns token payload dict if valid, None if expired, tampered, or wrong role.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "admin":
            return None
        role = payload.get("role", "admin")
        if role not in ("admin", "superadmin"):
            return None
        return payload
    except JWTError:
        return None


def verify_admin_token(token: str) -> dict | None:
    """
    Decode token, check admin role claims, and authorize against current database account status.
    Returns combined dict with account record and claims if fully authorized, None otherwise.
    """
    claims = decode_token(token)
    if not claims:
        return None
    username = claims.get("sub")
    if not username:
        return None
    account = verify_admin_account(username)
    if not account:
        return None
    return {**account, "claims": claims}