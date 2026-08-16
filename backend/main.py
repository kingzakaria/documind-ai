"""
DocuMind AI — Backend API

Public endpoints:
  POST /register        — create an account
  POST /login            — get a JWT

Protected endpoints (require Authorization: Bearer <token>):
  POST /upload            — upload a PDF, creates a Document + Conversation you own
  POST /ask                — ask a question about YOUR document
  GET  /conversations      — list your conversations (powers the Recents sidebar)
  PATCH /conversations/{id} — rename or star a conversation
  DELETE /conversations/{id} — delete a conversation

Run with:  uvicorn main:app --reload
Docs at:   http://127.0.0.1:8000/docs
"""

import os
import uuid
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from rag.ingest import ingest_document
from rag.retrieve import retrieve_chunks
from rag.llm import generate_answer

from db.database import get_db, engine, Base
from db import models
import auth

# Creates the 4 tables in Postgres if they don't already exist.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="DocuMind AI")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST", "GET", "PATCH", "DELETE"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 15 * 1024 * 1024
CHUNK_SIZE = 1024 * 1024


async def save_upload_safely(file: UploadFile, dest_path: str) -> int:
    first_chunk = await file.read(CHUNK_SIZE)
    if not first_chunk.startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="This doesn't look like a valid PDF file.")

    size = len(first_chunk)
    if size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400, detail=f"File too large. Max size is {MAX_FILE_SIZE // (1024 * 1024)}MB."
        )

    with open(dest_path, "wb") as f:
        f.write(first_chunk)
        while chunk := await file.read(CHUNK_SIZE):
            size += len(chunk)
            if size > MAX_FILE_SIZE:
                f.close()
                os.remove(dest_path)
                raise HTTPException(
                    status_code=400,
                    detail=f"File too large. Max size is {MAX_FILE_SIZE // (1024 * 1024)}MB.",
                )
            f.write(chunk)

    return size


# ---------- Request/response schemas ----------

class RegisterInput(BaseModel):
    email: str
    password: str


class LoginInput(BaseModel):
    email: str
    password: str


class ConversationUpdateInput(BaseModel):
    title: Optional[str] = None
    starred: Optional[bool] = None


# ---------- Public routes ----------

@app.get("/")
def health_check():
    return {"status": "DocuMind AI backend is running"}


@app.post("/register")
def register(data: RegisterInput, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user = models.User(email=data.email, hashed_password=auth.hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth.create_access_token(str(user.id))
    return {"access_token": token, "token_type": "bearer"}


@app.post("/login")
def login(data: LoginInput, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not auth.verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    token = auth.create_access_token(str(user.id))
    return {"access_token": token, "token_type": "bearer"}


# ---------- Protected routes ----------

@app.post("/upload")
@limiter.limit("5/minute")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported right now.")

    doc_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{doc_id}.pdf")

    await save_upload_safely(file, file_path)

    try:
        chunk_count = ingest_document(file_path, doc_id)
    except ValueError as e:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail=str(e))

    document = models.Document(doc_id=doc_id, user_id=current_user.id, filename=file.filename)
    conversation = models.Conversation(doc_id=doc_id, user_id=current_user.id, title=file.filename)
    db.add(document)
    db.add(conversation)
    db.commit()

    return {"doc_id": doc_id, "filename": file.filename, "chunks_created": chunk_count}


@app.post("/ask")
@limiter.limit("15/minute")
async def ask_question(
    request: Request,
    doc_id: str = Form(...),
    question: str = Form(...),
    language: str = Form("en"),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    # Ownership check: this doc_id must belong to a conversation owned by this user.
    conversation = (
        db.query(models.Conversation)
        .filter(models.Conversation.doc_id == doc_id, models.Conversation.user_id == current_user.id)
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Document not found for this account.")

    chunks = retrieve_chunks(doc_id, question)
    answer = generate_answer(question, chunks, language)

    db.add(models.Message(conversation_id=conversation.id, role="user", content=question))
    db.add(
        models.Message(
            conversation_id=conversation.id, role="assistant", content=answer, sources_used=len(chunks)
        )
    )
    db.commit()

    return {"question": question, "answer": answer, "sources_used": len(chunks)}


@app.get("/documents/{doc_id}/messages")
def get_document_messages(
    doc_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    conversation = (
        db.query(models.Conversation)
        .filter(models.Conversation.doc_id == doc_id, models.Conversation.user_id == current_user.id)
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Document not found for this account.")

    messages = (
        db.query(models.Message)
        .filter(models.Message.conversation_id == conversation.id)
        .order_by(models.Message.created_at.asc())
        .all()
    )

    return {
        "title": conversation.title,
        "messages": [
            {"role": m.role, "content": m.content, "sources_used": m.sources_used} for m in messages
        ],
    }


@app.get("/conversations")
def list_conversations(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    conversations = (
        db.query(models.Conversation)
        .filter(models.Conversation.user_id == current_user.id)
        .order_by(models.Conversation.updated_at.desc())
        .all()
    )
    return [
        {
            "id": str(c.id),
            "doc_id": c.doc_id,
            "title": c.title,
            "starred": c.starred,
            "updated_at": c.updated_at,
        }
        for c in conversations
    ]


@app.patch("/conversations/{conversation_id}")
def update_conversation(
    conversation_id: str,
    data: ConversationUpdateInput,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    conversation = (
        db.query(models.Conversation)
        .filter(models.Conversation.id == conversation_id, models.Conversation.user_id == current_user.id)
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    if data.title is not None:
        conversation.title = data.title
    if data.starred is not None:
        conversation.starred = data.starred

    db.commit()
    return {"id": str(conversation.id), "title": conversation.title, "starred": conversation.starred}


@app.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    conversation = (
        db.query(models.Conversation)
        .filter(models.Conversation.id == conversation_id, models.Conversation.user_id == current_user.id)
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    db.delete(conversation)  # cascades to delete its messages too
    db.commit()
    return {"deleted": True}