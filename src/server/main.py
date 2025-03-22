from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from routers import lidar, mapping, detection
from config import (
    CORS_ORIGINS, 
    CORS_CREDENTIALS, 
    CORS_METHODS, 
    CORS_HEADERS,
    MAPPING_DIR,
    MAPPING_METADATA_DIR
)

# Initialize FastAPI app
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=CORS_CREDENTIALS,
    allow_methods=CORS_METHODS,
    allow_headers=CORS_HEADERS,
)

# Create directories for storing mapping data
MAPPING_DIR.mkdir(exist_ok=True)
MAPPING_METADATA_DIR.mkdir(exist_ok=True)

# Mount the mapping_images directory to serve files
app.mount("/mapping_images", StaticFiles(directory=str(MAPPING_DIR)), name="mapping_images")

# Include routers
app.include_router(lidar.router, tags=["lidar"])
app.include_router(mapping.router, tags=["mapping"])
app.include_router(detection.router, tags=["detection"])

@app.get("/")
async def root():
    return {"message": "API is running"}