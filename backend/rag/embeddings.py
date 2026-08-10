"""
Shared embedding model.

Loading the SentenceTransformer model takes a few seconds, so we cache it
with lru_cache — every part of the app that needs embeddings calls
get_embedder() and gets back the SAME already-loaded model instead of
reloading it on every request.
"""

from functools import lru_cache
from sentence_transformers import SentenceTransformer


@lru_cache(maxsize=1)
def get_embedder() -> SentenceTransformer:
    return SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
