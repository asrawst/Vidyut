"""
Electricity Theft Detection API Main Application.

This module initializes the FastAPI application, configures CORS,
and includes the necessary API routers for processing datasets.
"""

import sys
import os
from pathlib import Path

# Add the project root to sys.path to ensure absolute imports from 'app' work properly.
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.api.routes import router as api_router

app = FastAPI(title="Electricity Theft Detection API")

# Compress JSON responses > 500 bytes by up to 90% for lightning-fast network transfer on Render
app.add_middleware(GZipMiddleware, minimum_size=500)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev flexibility (ports 5173, 5174, etc)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
@app.head("/")
async def root():
    """
    Fast root health check endpoint for pre-warming Render instances.
    """
    return {"status": "online", "message": "Electricity Theft Detection System API is running"}

@app.get("/health")
@app.head("/health")
async def health_check():
    """
    Dedicated lightweight health check for keep-alive pinging.
    """
    return {"status": "healthy", "service": "vidyut-ml-engine"}
