import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create FastAPI app instance
app = FastAPI(
    title="RiskView ML Service",
    description="Modern FastAPI ML microservice for RiskView",
    version="1.0.0"
)

# Add CORS middleware - allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
from routing import health, validate, summarize, rag

# Register routers
app.include_router(health.router, tags=["health"])
app.include_router(validate.router, prefix="/api", tags=["validation"])
app.include_router(summarize.router, prefix="/api", tags=["summarization"])
app.include_router(rag.router, prefix="/api", tags=["rag"])

# Global exception handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors globally"""
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "body": exc.body
        },
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    return JSONResponse(
        status_code=500,
        content={
            "detail": str(exc),
            "message": "An unexpected error occurred"
        },
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=debug
    )
