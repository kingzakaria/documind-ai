"""
Database connection setup.

get_db() is a FastAPI dependency — every endpoint that needs the database
takes db: Session = Depends(get_db) as a parameter, and FastAPI handles
opening a session before the request and closing it after, even if the
request raises an error.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
