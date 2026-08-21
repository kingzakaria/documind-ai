# DocuMind AI

**A multilingual document intelligence platform** — upload a PDF and ask questions about it in natural language, in English, French, or Arabic. Answers are grounded strictly in the document's content, with source citations, so it never invents facts that aren't actually there.

> Built as a hands-on project to learn production RAG systems: retrieval-augmented generation, vector databases, authentication, and full-stack deployment — not just a notebook demo.

<!-- Add a screenshot or short screen recording (GIF) of the app here once you have one — this matters more than any paragraph of description. -->

---

## Why this project is different

Most RAG demos on GitHub are single-language, single-user, and skip authentication entirely. DocuMind AI doesn't:

- **Trilingual with real RTL support** — ask in any language, get an answer in whichever of English/French/Arabic you choose, with the entire interface mirroring correctly for Arabic (not just translated text — actual right-to-left layout).
- **Grounded, not just generated** — every answer is built strictly from retrieved document chunks. If the answer isn't in the document, the model says so instead of guessing.
- **Real accounts, real ownership** — JWT authentication, hashed passwords, and per-user data isolation. Your documents are yours.
- **Security considered from the start** — rate limiting, real file-content validation (not just checking the filename), and a prompt-injection defense specific to RAG systems (a document is *data*, never *instructions*, even if it tries to look like one).

---

## Features

- Upload a PDF, get it chunked, embedded, and indexed for semantic search
- Ask questions in natural language — retrieval finds the relevant passages, the LLM answers using only those
- Multilingual answers (English / French / Arabic) with automatic RTL layout
- Full authentication — register, log in, JWT-protected API
- Persistent conversation history — rename, star, delete, and revisit past Q&A sessions
- Cloud file storage (S3-compatible) with a local-disk fallback
- Fully containerized with Docker Compose

---

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS | Modern React framework, type safety |
| Backend | FastAPI | Async, auto-generated docs, great for an API-first architecture |
| LLM | Google Gemini API | Multilingual generation, grounded answers |
| RAG / Retrieval | ChromaDB (vector store) + sentence-transformers (multilingual embeddings) | Local, fast semantic search across languages |
| Database | PostgreSQL + SQLAlchemy | Users, documents, conversations, message history |
| Auth | JWT (python-jose) + bcrypt | Stateless auth, hashed passwords |
| File storage | S3-compatible object storage (Backblaze B2) | Documents survive redeploys, not tied to local disk |
| Containerization | Docker + Docker Compose | Backend and frontend run identically anywhere |

---

## Architecture

```
User
 │
 ▼
Frontend (Next.js) ──── JWT ────► Backend API (FastAPI)
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
              PostgreSQL          RAG Pipeline          Cloud Storage
          (users, docs,        (chunk → embed →       (original PDFs)
           conversations,       ChromaDB → retrieve)
           messages)                   │
                                        ▼
                                  Gemini API
                              (grounded answer,
                               chosen language)
```

**Ingestion flow** (once per upload): PDF → text extraction → chunking → multilingual embeddings → stored in ChromaDB, tagged by document and user.

**Query flow** (every question): question embedded → ChromaDB similarity search → top-k relevant chunks retrieved → chunks + question + language sent to Gemini → grounded answer returned with source count.

---

## Getting started

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL
- A free [Google AI Studio](https://aistudio.google.com) API key (Gemini)
- (Optional) An S3-compatible storage account, e.g. [Backblaze B2](https://www.backblaze.com/b2)

### Option A — Docker (recommended)

```bash
git clone https://github.com/kingzakaria/documind-ai.git
cd documind-ai
# create .env at the project root with GEMINI_API_KEY and POSTGRES_PASSWORD (see below)
docker compose up --build
```

Frontend: `http://localhost:3000` · Backend docs: `http://localhost:8000/docs`

### Option B — Run locally without Docker

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
# create backend/.env — see Environment Variables below
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Environment variables

`backend/.env`:
```
GEMINI_API_KEY=your-gemini-key
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/documind
JWT_SECRET_KEY=a-long-random-string
R2_ENDPOINT_URL=https://your-endpoint.backblazeb2.com
R2_ACCESS_KEY_ID=your-key-id
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
```

---

## API overview

| Endpoint | Method | Description |
|---|---|---|
| `/register`, `/login` | POST | Create an account / get a JWT |
| `/upload` | POST | Upload a PDF (auth required) |
| `/ask` | POST | Ask a question about a document, in a chosen language |
| `/documents/{doc_id}/messages` | GET | Load a document's past Q&A |
| `/conversations` | GET | List your conversations |
| `/conversations/{id}` | PATCH / DELETE | Rename, star, or delete a conversation |

Full interactive documentation is auto-generated at `/docs` when the backend is running.

---

## Known limitations

Being upfront about these, since a project's honesty about its own gaps is worth more than pretending they don't exist:

- **Cloud storage upload** currently fails in some local Windows environments due to a low-level networking issue between `botocore` and the storage provider (not yet fully root-caused — ruled out both Python version and Docker as the cause). The app falls back to local disk storage automatically, so functionality isn't affected, but this needs revisiting before a real production deployment.
- **LLM usage relies on Gemini's free tier**, which has real rate limits — fine for a demo, would need a paid tier for production traffic.
- **UI chrome (buttons, labels) stays in English** even when answers are generated in French/Arabic — only the AI-generated content is translated, not the interface itself.
- Not yet deployed to a public URL — currently runs locally / via Docker Compose.

---

## Roadmap

- [ ] Resolve the cloud storage networking issue and confirm uploads work reliably
- [ ] Deploy backend (Render) and frontend (Vercel) for a public demo URL
- [ ] Full UI internationalization, not just AI-generated content
- [ ] Support additional document types beyond PDF

---

## License

MIT