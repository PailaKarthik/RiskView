"""
RAG SERVICE (Retrieval-Augmented Generation)
=============================================
Pipeline: CHUNK → EMBED → INDEX → RETRIEVE → GENERATE

1. CHUNK   - Split context into overlapping text pieces
2. EMBED   - Convert chunks to vectors
3. INDEX   - Store vectors in FAISS (in-memory vector database)
4. RETRIEVE- Find top-k most relevant chunks for question
5. GENERATE- Send relevant chunks + question to LLM for answer
"""

import os

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from core.llm import llm, GroqLLMError
from schemas.requests import RagResponse, RetrievalResult
import logging
from dotenv import load_dotenv

load_dotenv()
Embedding_Model_Name = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

logger = logging.getLogger(__name__)

_vector_store = None
_embeddings = None

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
DEFAULT_K = 3

PROMPT_TEMPLATE = """You are a travel safety assistant. Answer based ONLY on the provided reports.
If there isn't enough information, say so clearly.

Reports:
{context}

Question:
{question}

Answer:"""


def _get_embeddings():
    """Get or create embeddings model (singleton)."""
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(
            model_name=Embedding_Model_Name,
        )
    return _embeddings


def _build_vector_store(context: str):
    """Build FAISS index from context."""
    global _vector_store
    
    if not context or not isinstance(context, str) or len(context.strip()) == 0:
        raise ValueError("Context cannot be empty")
    
    logger.info("Building vector store...")
    
    doc = Document(page_content=context.strip(), metadata={"source": "context"})
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", " ", ""]
    )
    
    chunks = splitter.split_documents([doc])
    logger.info(f"Created {len(chunks)} chunks")
    
    embeddings = _get_embeddings()
    _vector_store = FAISS.from_documents(chunks, embeddings)
    logger.info("Vector store ready")
    
    return _vector_store


def answer_question(context: str, question: str, k: int = DEFAULT_K) -> RagResponse:
    """
    Answer question using RAG pipeline.
    
    Args:
        context: Source text to search
        question: User question
        k: Number of chunks to retrieve
        
    Returns:
        RagResponse with answer and sources
    """
    global _vector_store
    
    if not context or not isinstance(context, str):
        raise ValueError("Context must be non-empty string")
    if not question or not isinstance(question, str):
        raise ValueError("Question must be non-empty string")
    if not (1 <= k <= 10):
        raise ValueError("k must be between 1 and 10")
    
    try:
        # Build index if needed
        if _vector_store is None:
            _build_vector_store(context)
        
        # Retrieve top-k chunks
        results = _vector_store.similarity_search_with_score(question, k=k)
        
        if not results:
            return RagResponse(
                answer="No relevant information found in provided context.",
                retrieved_chunks=[],
                sources_used=0
            )
        
        # Format context
        context_parts = []
        retrieval_info = []
        
        for i, (doc, score) in enumerate(results):
            context_parts.append(doc.page_content)
            retrieval_info.append(
                RetrievalResult(
                    rank=i + 1,
                    similarity_score=round(float(score), 4),
                    preview=doc.page_content[:100].replace("\n", " ") + "..."
                )
            )
        
        context_text = "\n\n---\n\n".join(context_parts)
        
        # Generate answer
        prompt = PROMPT_TEMPLATE.format(context=context_text, question=question.strip())
        answer = llm.generate_completion(prompt).strip()
        
        logger.info(f"Generated answer using {len(retrieval_info)} chunks")
        
        return RagResponse(
            answer=answer,
            retrieved_chunks=retrieval_info,
            sources_used=len(retrieval_info)
        )
        
    except GroqLLMError as e:
        logger.error(f"LLM error: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"RAG error: {str(e)}")
        raise GroqLLMError(f"Error during RAG: {str(e)}") from e


def reset_vector_store():
    """Clear cached vector store (for testing or fresh queries)."""
    global _vector_store
    _vector_store = None
    logger.info("Vector store reset")

