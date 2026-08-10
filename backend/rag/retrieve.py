"""
Retrieval — given a question and a doc_id, return the most relevant chunks
FROM THAT DOCUMENT ONLY.

The `where={"doc_id": doc_id}` filter is what scopes the search — without
it, ChromaDB would search across every document ever uploaded, and you'd
risk pulling in irrelevant chunks from someone else's PDF.
"""

from .embeddings import get_embedder
from .vectorstore import get_collection


def retrieve_chunks(doc_id: str, question: str, n_results: int = 3) -> list[str]:
    embedder = get_embedder()
    question_embedding = embedder.encode([question]).tolist()

    collection = get_collection()
    results = collection.query(
        query_embeddings=question_embedding,
        n_results=n_results,
        where={"doc_id": doc_id},
    )

    if not results["documents"]:
        return []
    return results["documents"][0]
