"""
The final step: take retrieved chunks + the question, and ask Gemini
to answer using ONLY that context.
"""

import os
from google import genai

_client = None


def get_gemini_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    return _client


def generate_answer(question: str, context_chunks: list[str]) -> str:
    if not context_chunks:
        return "I couldn't find any relevant information in this document to answer that."

    context = "\n\n---\n\n".join(context_chunks)
    prompt = f"""Answer the question using ONLY the context below.
If the answer isn't in the context, say so clearly instead of guessing.

Context:
{context}

Question: {question}

Answer:"""

    client = get_gemini_client()
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt,
    )
    return response.text
