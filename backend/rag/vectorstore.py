"""
Shared ChromaDB connection.
"""

import chromadb

_client = None


def get_chroma_client():
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path="./chroma_db")
    return _client


def get_collection():
    return get_chroma_client().get_or_create_collection("documind")


def delete_document_chunks(doc_id: str) -> None:
    collection = get_collection()
    collection.delete(where={"doc_id": doc_id})