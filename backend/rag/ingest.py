"""
Ingestion pipeline — same logic as rag_poc.py, now reusable as functions
instead of a top-to-bottom script.

Key difference from the POC: every chunk is now tagged with a doc_id in
its metadata. That's what lets multiple documents live in the same
ChromaDB collection without their chunks getting mixed up when we
retrieve later.
"""

from pypdf import PdfReader

from .embeddings import get_embedder
from .vectorstore import get_collection


def load_pdf_text(file_path: str) -> str:
    reader = PdfReader(file_path)
    pages_text = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(pages_text)


def chunk_text(text: str, chunk_size: int = 200, overlap: int = 40) -> list[str]:
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunks.append(" ".join(words[start:end]))
        start = end - overlap
    return chunks


def ingest_document(file_path: str, doc_id: str) -> int:
    """
    Process a PDF end-to-end: extract text, chunk it, embed each chunk,
    and store everything in ChromaDB under this doc_id.

    Returns the number of chunks created.
    """
    text = load_pdf_text(file_path)
    if not text.strip():
        raise ValueError(
            "No extractable text found in this PDF — it might be a scanned image."
        )

    chunks = chunk_text(text)
    embedder = get_embedder()
    embeddings = embedder.encode(chunks).tolist()

    collection = get_collection()
    ids = [f"{doc_id}-{i}" for i in range(len(chunks))]
    metadatas = [{"doc_id": doc_id, "chunk_index": i} for i in range(len(chunks))]

    collection.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas,
    )

    return len(chunks)
