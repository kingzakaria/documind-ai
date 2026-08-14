"""
Authentication logic.

Three jobs:
  1. Hash/verify passwords (never store a plain-text password, ever)
  2. Create a signed JWT after a successful login
  3. Verify a JWT and look up the user it belongs to, for protected routes
"""

import os
from datetime import datetime, timedelta

from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from db.database import get_db
from db import models

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # tokens last 1 week

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Gives Swagger UI (and the frontend) a simple "paste your token" flow,
# instead of a username/password login form baked into the docs page.
security_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme), db: Session = Depends(get_db)
) -> models.User:
    """
    Runs automatically on any endpoint that takes
    current_user: models.User = Depends(get_current_user)

    Decodes the JWT from the request's Authorization header, checks it's
    valid and not expired, then loads the matching user from the database.
    """
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user