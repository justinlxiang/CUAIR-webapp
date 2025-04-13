from fastapi import APIRouter, HTTPException, WebSocket
from fastapi.websockets import WebSocketDisconnect
from fastapi.responses import Response
import requests
import json
import base64
import asyncio
import logging
from pathlib import Path
from websocket_manager import WebSocketManager
from config import PICAMPIC_DIR, PICAMVID_DIR

router = APIRouter()
logger = logging.getLogger(__name__)

PICAMPIC_DIR.mkdir(exist_ok=True)
PICAMVID_DIR.mkdir(exist_ok=True)

@router.post("/picam/upload")
async def save_new_picam(data : dict):
    print("uploading picam image/video")
    try:        
        file = data.get('file')
        file_type = data.get('file_type') 
        file_name = data.get('file_name')
        
        if file_type == 'image':
            file_path = PICAMPIC_DIR / file_name
        elif file_type == 'video':
            file_path = PICAMVID_DIR / file_name
        else:
            raise HTTPException(status_code=400, detail='invalid file type.')
        print(file_path)
        
        file_data_bytes = base64.b64decode(file)
        with open(file_path, 'wb') as f:
            f.write(file_data_bytes)
            
        if file_type == 'image':
            file_url = f"/picam_images/{file_name}"
        elif file_type == 'video':
            file_url = f"/picam_videos/{file_name}"
        return {"status": "success", f"{file_type}_url": file_url}
    
    except Exception as e:
        print(f"Error saving picam {file_type}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/picam/files")
async def get_picam_files():
    try:
        image_files = [f.name for f in PICAMPIC_DIR.iterdir() if f.is_file]
        video_files = [f.name for f in PICAMVID_DIR.iterdir() if f.is_file]
        files = {
            "images": image_files,
            "videos": video_files
        }
        return files
    
    except Exception as e:
        print(f"Error getting files: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/picam/files/{file_name}")
async def get_picam_file(file_name: str, file_type: str):
    try:
        if file_type == 'image':
            file_path = PICAMPIC_DIR / file_name
        elif file_type == 'video':
            file_path = PICAMVID_DIR / file_name 
        else:
            raise HTTPException(status_code=400)
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail='file not found.')
        
        with open(file_path, 'b') as f:
            content = f.read()
        return Response(content=content, media_type="application/octet-stream")
        
    except Exception as e:
        print(f"Error getting file: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.delete("/picam/files/{file_name}")
async def remove_picam_file(file_name: str, file_type: str):
    try:
        if file_type == 'image':
            file_path = PICAMPIC_DIR / file_name
        elif file_type == 'video':
            file_path = PICAMVID_DIR / file_name 
        else:
            raise HTTPException(status_code=400)
        
        if file_path.exists():
            print("hi")
            try:
                file_path.unlink()
                return {"status": "success", "detail": f"{file_name} deleted"}
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        else:
            raise HTTPException(status_code=404, detail="file not found.")
        
    except Exception as e:
        print(f"Error deleting files: {e}")
        raise HTTPException(status_code=500, detail=str(e))