from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.db.session import SessionLocal
from app.db.init_db import init_db
from app.api.routes.auth import router as auth_router
from app.api.routes.recruiter import router as recruiter_router
from app.api.routes.candidate import router as candidate_router
from app.api.routes.hr import router as hr_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables and seed accounts exist
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
    yield
    # Shutdown logic if needed

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API services for AI-Powered Recruitment Copilot (Infosys Springboard Project)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for React Vite frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(recruiter_router, prefix=settings.API_V1_STR)
app.include_router(candidate_router, prefix=settings.API_V1_STR)
app.include_router(hr_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "project": "AI Recruitment Copilot API",
        "version": "1.0.0",
        "status": "online",
        "docs_url": "/docs",
        "roles_supported": ["hr", "recruiter", "candidate"]
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
