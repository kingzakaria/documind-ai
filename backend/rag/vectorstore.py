"""
Shared ChromaDB connection.

Like embeddings.py, this makes sure every part of the app talks to the
SAME persistent database on disk (./chroma_db) instead of accidentally
creating multiple disconnected connections.
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
