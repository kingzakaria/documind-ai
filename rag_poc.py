"""
DocuMind AI — Proof of Concept
--------------------------------
This script proves the core RAG loop works before any FastAPI/Next.js code exists:

  1. Load a PDF and extract its text
  2. Split the text into overlapping chunks
  3. Embed each chunk into a vector (a list of numbers capturing its meaning)
  4. Store those vectors in ChromaDB (a local vector database)
  5. Embed your QUESTION the same way, and ask ChromaDB for the most similar chunks
  6. Hand only those chunks (not the whole document) to Gemini, and ask it to answer
     using ONLY that context

Run it with:  python rag_poc.py
"""

import os
from dotenv import load_dotenv
import chromadb
from sentence_transformers import SentenceTransformer
from pypdf import PdfReader
from google import genai

# ---- Config: change these two lines to test your own document/question ----
PDF_PATH = "test.pdf"
QUESTION =  "What is the CEO's name?"
# -----------------------------------------------------------------------

load_dotenv()  # reads ANTHROPIC_API_KEY / GEMINI_API_KEY from your .env file


def load_pdf_text(path: str) -> str:
    """Extract all text from a PDF, page by page."""
    reader = PdfReader(path)
    pages_text = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(pages_text)


def chunk_text(text: str, chunk_size: int = 400, overlap: int = 50) -> list[str]:
    """
    Split text into overlapping word chunks.

    Why chunks?  LLMs answer better from a few focused paragraphs than
    an entire document, and embeddings work best on smaller, coherent pieces.

    Why overlap?  So a sentence that gets cut at a chunk boundary still
    appears in full inside the neighboring chunk.
    """
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunks.append(" ".join(words[start:end]))
        start = end - overlap  # step back by `overlap` words before the next chunk
    return chunks


def main():
    if not os.path.exists(PDF_PATH):
        print(f"Couldn't find '{PDF_PATH}'. Put a PDF in this folder and update PDF_PATH.")
        return

    print(f"Loading {PDF_PATH}...")
    text = load_pdf_text(PDF_PATH)
    if not text.strip():
        print("No extractable text found — this PDF might be a scanned image.")
        return

    chunks = chunk_text(text)
    print(f"Split into {len(chunks)} chunks.")

    print("Loading multilingual embedding model (first run downloads it, ~1-2 min)...")
    embedder = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

    print("Embedding chunks...")
    chunk_embeddings = embedder.encode(chunks).tolist()

    print("Storing in ChromaDB...")
    client = chromadb.PersistentClient(path="./chroma_db")
    collection = client.get_or_create_collection("documind_poc")
    collection.upsert(
        ids=[str(i) for i in range(len(chunks))],
        embeddings=chunk_embeddings,
        documents=chunks,
    )

    print(f"\nQuestion: {QUESTION}")
    question_embedding = embedder.encode([QUESTION]).tolist()

    # Ask ChromaDB for the 3 chunks whose meaning is closest to the question
    results = collection.query(query_embeddings=question_embedding, n_results=3)
    retrieved_chunks = results["documents"][0]
    print(f"Retrieved {len(retrieved_chunks)} relevant chunks out of {len(chunks)} total.")

    context = "\n\n---\n\n".join(retrieved_chunks)
    prompt = f"""Answer the question using ONLY the context below.
If the answer isn't in the context, say so clearly instead of guessing.

Context:
{context}

Question: {QUESTION}

Answer:"""

    print("Calling Gemini...")
    gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    response = gemini_client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt,
    )

    print("\n--- ANSWER ---")
    print(response.text)
    print("\n--- SOURCES USED (for reference) ---")
    for i, chunk in enumerate(retrieved_chunks, 1):
        preview = chunk[:120].replace("\n", " ")
        print(f"[{i}] {preview}...")


if __name__ == "__main__":
    main()
