from pathlib import Path

# Service URLs
LIDAR_SERVICE_URL = "http://10.49.82.237:5000"
CAMERA_SERVICE_URL = "http://10.49.82.237:6000"
MAPPING_SERVICE_URL = "http://127.0.0.1:8000"

# Directories for storing mapping data
MAPPING_DIR = Path("mapping_images")
MAPPING_METADATA_DIR = Path("mapping_metadata")

# CORS settings
CORS_ORIGINS = ["*"]  # In development, allow all origins
CORS_CREDENTIALS = True
CORS_METHODS = ["*"]
CORS_HEADERS = ["*"] 