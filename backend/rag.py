"""
RAG (Retrieval-Augmented Generation) module using ChromaDB.

Stores document chunks as embeddings and retrieves the most relevant
ones for a given query, so the LLM gets focused context instead of
the entire document.
"""

import chromadb
from chromadb.config import Settings

# In-memory ChromaDB client (no persistence needed — re-indexed per session)
_client = chromadb.Client(Settings(anonymized_telemetry=False))

# Track the current collection name
_current_collection = None


def index_document(doc_id: str, chunks: list[dict]) -> str:
    """
    Index document chunks into ChromaDB.

    Args:
        doc_id: Unique identifier for this document (used as collection name)
        chunks: List of {"section": str, "source": str, "content": str}

    Returns:
        Collection name for later retrieval
    """
    global _current_collection

    # Clean doc_id for collection name (ChromaDB has restrictions)
    collection_name = f"doc_{doc_id[:50]}".replace(" ", "_").replace(".", "_")

    # Delete old collection if exists
    try:
        _client.delete_collection(collection_name)
    except Exception:
        pass

    # Create new collection (uses ChromaDB's default embedding function)
    collection = _client.create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )

    # Add chunks
    documents = []
    metadatas = []
    ids = []

    for i, chunk in enumerate(chunks):
        content = chunk.get("content", "").strip()
        if not content:
            continue

        documents.append(content)
        metadatas.append({
            "section": chunk.get("section", ""),
            "source": chunk.get("source", ""),
        })
        ids.append(f"chunk_{i}")

    if documents:
        collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids,
        )

    _current_collection = collection_name
    return collection_name


def retrieve(query: str, collection_name: str = None, top_k: int = 5) -> list[dict]:
    """
    Retrieve the most relevant chunks for a query.

    Args:
        query: The user's question
        collection_name: ChromaDB collection to search (uses current if None)
        top_k: Number of chunks to retrieve

    Returns:
        List of {"content": str, "section": str, "source": str, "score": float}
    """
    name = collection_name or _current_collection
    if not name:
        return []

    try:
        collection = _client.get_collection(name)
    except Exception:
        return []

    results = collection.query(
        query_texts=[query],
        n_results=min(top_k, collection.count()),
    )

    retrieved = []
    if results and results["documents"] and results["documents"][0]:
        for i, doc in enumerate(results["documents"][0]):
            meta = results["metadatas"][0][i] if results["metadatas"] else {}
            distance = results["distances"][0][i] if results["distances"] else 0
            # ChromaDB cosine distance: 0 = identical, 2 = opposite
            # Convert to similarity score (0-1)
            score = round(1 - (distance / 2), 3)
            retrieved.append({
                "content": doc,
                "section": meta.get("section", ""),
                "source": meta.get("source", ""),
                "score": score,
            })

    return retrieved


def get_current_collection() -> str | None:
    """Return the current collection name."""
    return _current_collection
 