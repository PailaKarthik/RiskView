from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from schemas.requests import SummarizeAllRequest
from prompts.summarize import SUMMARIZE_ALL_REPORTS
from core.llm import llm, GroqLLMError
from collections import Counter
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class SummarizeAllResponse(BaseModel):
    summary: str
    statistics: dict


def _count_categories(reports: list) -> dict:
    """Count reports by category."""
    categories = [r.get("category", "unknown").lower() for r in reports if isinstance(r, dict)]
    return dict(Counter(categories))


@router.post("/summarize-all")
async def summarize_all_reports(request: SummarizeAllRequest) -> SummarizeAllResponse:
    """
    Summarize all reports with aggregated analysis.
    
    Frontend pre-filters reports to specific location (within 1km).
    Backend receives pre-formatted reports and generates comprehensive summary.
    
    Reports should contain:
    - title: str
    - description: str
    - category: str (scam or danger)
    - createdAt: str (datetime)
    """
    try:
        if not request.reports or len(request.reports) == 0:
            raise HTTPException(status_code=400, detail="At least one report required")
        
        # Extract statistics
        total_reports = len(request.reports)
        categories = _count_categories(request.reports)
        scam_count = categories.get("scam", 0)
        danger_count = categories.get("danger", 0)
        
        # Format reports text for LLM
        reports_text = "\n\n".join([
            f"Report {i+1}: {report.get('title', 'N/A')} "
            f"(Category: {report.get('category', 'N/A')}, Date: {report.get('createdAt', 'N/A')})\n"
            f"Description: {report.get('description', 'N/A')}"
            for i, report in enumerate(request.reports)
        ])
        
        # Build prompt with statistics (no location data)
        prompt = SUMMARIZE_ALL_REPORTS.format(
            reports_text=reports_text,
            total_reports=total_reports,
            scam_count=scam_count,
            danger_count=danger_count
        )
        
        logger.info(f"Summarizing {total_reports} reports from this location...")
        summary = llm.generate_completion(prompt).strip()
        logger.info(f"Summary generated successfully")
        
        return SummarizeAllResponse(
            summary=summary,
            statistics={
                "total_reports": total_reports,
                "scam_reports": scam_count,
                "danger_reports": danger_count,
                "categories": categories
            }
        )
    except HTTPException as e:
        raise e
    except GroqLLMError as e:
        logger.error(f"LLM error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")
    except Exception as e:
        logger.error(f"Error summarizing reports: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


