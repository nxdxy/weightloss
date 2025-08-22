from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import os
from .config import settings
from .database import engine, Base
from .routers import auth, users, daily_logs, meals, chat, reports, data_import, food_analysis, health

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="AI Fitness Pal API",
    description="Backend API for AI Fitness Pal application",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
if os.path.exists(settings.upload_dir):
    app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api", include_in_schema=True)
app.include_router(users.router, prefix="/api", include_in_schema=True)
app.include_router(daily_logs.router, prefix="/api", include_in_schema=True)
app.include_router(meals.router, prefix="/api", include_in_schema=True)
app.include_router(chat.router, prefix="/api", include_in_schema=True)
app.include_router(reports.router, prefix="/api", include_in_schema=True)
app.include_router(data_import.router, prefix="/api", include_in_schema=True)
app.include_router(food_analysis.router, prefix="/api", include_in_schema=True)
app.include_router(health.router, prefix="/api", include_in_schema=True)


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "AI Fitness Pal API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "API is running"}


@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Endpoint not found"}
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )
