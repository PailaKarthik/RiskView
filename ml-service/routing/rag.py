from fastapi import APIRouter, HTTPException
from schemas.requests import RagRequest, RagResponse
from services.rag import answer_question, reset_vector_store
from core.llm import GroqLLMError
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/rag")
async def rag_query(request: RagRequest) -> RagResponse:
    """
    Answer questions using RAG (Retrieval-Augmented Generation).
    
    The service:
    1. Chunks the provided context into manageable pieces
    2. Converts chunks to embeddings
    3. Searches for relevant chunks matching the question
    4. Sends relevant context + question to LLM for answer
    
    Args:
        request: RagRequest with context, question, and optional k (number of chunks)
        
    Returns:
        RagResponse with answer and retrieval information
    """
    try:
        if not request.context or not isinstance(request.context, str):
            raise HTTPException(status_code=400, detail="Context must be non-empty string")
        if not request.question or not isinstance(request.question, str):
            raise HTTPException(status_code=400, detail="Question must be non-empty string")
        
        logger.info(f"RAG query: question='{request.question[:50]}...', context_length={len(request.context)}, k={request.k}")
        
        # Call RAG service
        response = answer_question(
            context=request.context,
            question=request.question,
            k=request.k or 3
        )
        
        logger.info(f"RAG response generated with {response.sources_used} sources")
        return response
        
    except HTTPException as e:
        raise e
    except GroqLLMError as e:
        logger.error(f"LLM error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")
    except Exception as e:
        logger.error(f"RAG error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"RAG error: {str(e)}")


@router.post("/rag/reset")
async def reset_rag():
    """Clear cached RAG vector store (useful for fresh analysis)."""
    try:
        reset_vector_store()
        return {"status": "success", "message": "RAG vector store reset"}
    except Exception as e:
        logger.error(f"Reset error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Reset error: {str(e)}")

