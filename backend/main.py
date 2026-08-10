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

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from rag.ingest import ingest_document
from rag.retrieve import retrieve_chunks
from rag.llm import generate_answer

app = FastAPI(title="DocuMind AI")

# Allows a future Next.js frontend (running on a different port) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your actual frontend URL before deploying
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/")
def health_check():
    return {"status": "DocuMind AI backend is running"}


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported right now.")

    doc_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{doc_id}.pdf")

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        chunk_count = ingest_document(file_path, doc_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"doc_id": doc_id, "filename": file.filename, "chunks_created": chunk_count}


@app.post("/ask")
async def ask_question(doc_id: str = Form(...), question: str = Form(...)):
    chunks = retrieve_chunks(doc_id, question)
    answer = generate_answer(question, chunks)
    return {"question": question, "answer": answer, "sources_used": len(chunks)}
