from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from schemas.requests import ValidateCategoryRequest
from services.classification import classify
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class ValidateResponse(BaseModel):
    valid: bool
    confidence: float = 0.0
    message: str = ""


@router.post("/validate-category")
async def validate_category(request: ValidateCategoryRequest) -> ValidateResponse:
    """
    Validate if text matches the specified category.
    
    Args:
        request: ValidateCategoryRequest with text and category fields
        
    Returns:
        ValidateResponse with validation result
        
    Raises:
        HTTPException: If validation fails or service error occurs
    """
    try:
        # Validate input
        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        if not request.category or len(request.category.strip()) == 0:
            raise HTTPException(status_code=400, detail="Category cannot be empty")
        
        # Classify the text
        result = classify(request.text)
        detected_category = result["category"].lower()
        confidence = result["confidence"]
        requested_category = request.category.lower()
        
        # Check if detected category matches requested category
        is_valid = detected_category == requested_category
        
        logger.info(f"Valid: {is_valid}, Detected: {detected_category}, Requested: {requested_category}")
        
        return ValidateResponse(
            valid=is_valid,
            confidence=confidence,
            message=f"Text {'matches' if is_valid else 'does not match'} the '{request.category}' category"
        )
        
    except HTTPException as e:
        logger.error(f"Error: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

