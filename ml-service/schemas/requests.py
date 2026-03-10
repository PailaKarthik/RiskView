from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class ValidateCategoryRequest(BaseModel):
    """Validate if text matches a given category."""
    text: str = Field(..., description="Text to validate", min_length=1)
    category: str = Field(..., description="Category to validate against", min_length=1)


class SummarizeAllRequest(BaseModel):
    """Summarize all reports with aggregated statistics."""
    reports: List[Dict[str, Any]] = Field(..., description="List of report objects with title, description, category", min_items=1)
    
    class Config:
        json_schema_extra = {
            "example": {
                "reports": [
                    {
                        "title": "Scam Alert",
                        "description": "Tourist lost $500 in fake taxi scam",
                        "category": "scam",
                        "location": "Downtown"
                    }
                ]
            }
        }


class RagRequest(BaseModel):
    """Retrieve and generate answer using RAG pipeline."""
    context: str = Field(..., description="Source text/reports to search within", min_length=10)
    question: str = Field(..., description="Question to answer based on context", min_length=1)
    k: Optional[int] = Field(3, description="Number of relevant chunks to retrieve", ge=1, le=10)
    
    class Config:
        json_schema_extra = {
            "example": {
                "context": "Report 1: Scam in downtown...",
                "question": "What scams occurred in downtown?",
                "k": 3
            }
        }


class RetrievalResult(BaseModel):
    """Result of a single retrieved chunk."""
    rank: int = Field(..., description="Rank of this result")
    similarity_score: float = Field(..., description="Similarity score (0-1, lower is better)")
    preview: str = Field(..., description="Preview of the chunk")


class RagResponse(BaseModel):
    """Response from RAG query."""
    answer: str = Field(..., description="Generated answer")
    retrieved_chunks: List[RetrievalResult] = Field(..., description="Retrieved context chunks")
    sources_used: int = Field(..., description="Number of sources used")

