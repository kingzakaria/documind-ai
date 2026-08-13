"""
DocuMind AI — Backend API

Two endpoints:
  POST /upload  — send a PDF, get back a doc_id
  POST /ask     — send a doc_id + question, get back a grounded answer

Run with:  uvicorn main:app --reload
Then open: http://127.0.0.1:8000/docs  (interactive Swagger UI — test everything here)
"""

import os
import shutil
import uuid

from dotenv import load_dotenv

load_dotenv()  # must run before importing rag.llm, since it reads GEMINI_API_KEY at call time — fine either way, but keeping it first is good habit

from fastapi import FastAPI, Request, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from rag.ingest import ingest_document
from rag.retrieve import retrieve_chunks
from rag.llm import generate_answer

app = FastAPI(title="DocuMind AI")

# Only the local Next.js dev server is allowed to call this API.
# Update this list to your real deployed frontend URL when you deploy.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB — generous for a text PDF, small enough to prevent abuse
PDF_MAGIC_BYTES = b"%PDF-"


@app.get("/")
def health_check():
    return {"status": "DocuMind AI backend is running"}


@app.post("/upload")
@limiter.limit("5/minute")
async def upload_document(request: Request, file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported right now.")

    doc_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{doc_id}.pdf")

    # Stream to disk in chunks, aborting early if the file is larger than allowed
    # (never trust a single file.read() to be safely bounded by size).
    size = 0
    with open(file_path, "wb") as f:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_FILE_SIZE:
                f.close()
                os.remove(file_path)
                raise HTTPException(status_code=413, detail="File too large — max size is 10 MB.")
            f.write(chunk)

    # A ".pdf" filename is user-controlled and proves nothing — check the actual
    # file content matches the real PDF file signature before trusting it.
    with open(file_path, "rb") as f:
        header = f.read(len(PDF_MAGIC_BYTES))
    if header != PDF_MAGIC_BYTES:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="This file isn't a valid PDF.")

    try:
        chunk_count = ingest_document(file_path, doc_id)
    except ValueError as e:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail=str(e))

    return {"doc_id": doc_id, "filename": file.filename, "chunks_created": chunk_count}


@app.post("/ask")
@limiter.limit("15/minute")
async def ask_question(request: Request, doc_id: str = Form(...), question: str = Form(...)):
    chunks = retrieve_chunks(doc_id, question)
    answer = generate_answer(question, chunks)
    return {"question": question, "answer": answer, "sources_used": len(chunks)}