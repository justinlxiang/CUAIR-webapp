from fastapi import APIRouter, HTTPException, WebSocket
from fastapi.websockets import WebSocketDisconnect
import requests
import json
import base64
import asyncio
import logging
from pathlib import Path
from websocket_manager import WebSocketManager
from config import MAPPING_DIR, MAPPING_METADATA_DIR, MAPPING_SERVICE_URL

router = APIRouter()
logger = logging.getLogger(__name__)
mapping_ws_manager = WebSocketManager(name="mapping")

# Create directories if they don't exist
MAPPING_DIR.mkdir(exist_ok=True)
MAPPING_METADATA_DIR.mkdir(exist_ok=True)

@router.websocket("/ws/mapping")
async def mapping_websocket_endpoint(websocket: WebSocket):
    await mapping_ws_manager.connect(websocket)
    
    try:
        while True:
            try:
                await websocket.receive_text()
            
            except WebSocketDisconnect:
                break
            except asyncio.CancelledError:
                break
            
    except Exception as e:
        print(f"Mapping WebSocket error: {e}")
    finally:
        await mapping_ws_manager.disconnect()

@router.post("/mapping/upload")
async def save_new_mapping(data: dict):
    try:        
        logger.info(f"Processing mapping upload for image ID: {data.get('image_id')}")
        image_path = MAPPING_DIR / f"{data['image_id']}.jpg"
        metadata_path = MAPPING_METADATA_DIR / f"{data['image_id']}.json"
        
        # Save the base64 encoded image data to a file
        image_data_bytes = base64.b64decode(data["image_data"])
        with open(image_path, 'wb') as f:
            f.write(image_data_bytes)
            
        image_url = f"/mapping_images/{data['image_id']}.jpg"
        
        # Extract geolocation and orientation data
        timestamp = data.get("timestamp", 0.0)
        latitude = data.get("lat", 0.0)
        longitude = data.get("lon", 0.0)
        altitude = data.get("alt", 0.0)
        yaw = data.get("yaw", 0.0)
        
        # Save metadata to JSON file
        metadata = {
            "image_url": image_url,
            "image_id": data['image_id'],
            "timestamp": timestamp,
            "latitude": latitude,
            "longitude": longitude,
            "altitude": altitude,
            "yaw": yaw
        }
        
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f)
        
        mapping_image = {
            "type": "mapping_image",
            "data": metadata
        }
        
        # Send via WebSocket if connection exists
        if mapping_ws_manager.connection:
            success = await mapping_ws_manager.send_message(mapping_image)
            if not success:
                logger.warning("Failed to send mapping data via WebSocket")
                
        return {"status": "success", "image_url": image_url}

    except Exception as e:
        logger.error(f"Error saving mapping image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/mapping/images")
async def get_mapping_images():
    try:
        # Get all files in the directory and filter by common image extensions
        image_extensions = {'.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'}
        image_files = [f for f in MAPPING_DIR.iterdir() if f.is_file() and f.suffix in image_extensions]
        
        images_with_metadata = []
        for image_file in image_files:
            image_id = image_file.stem
            metadata_path = MAPPING_METADATA_DIR / f"{image_id}.json"
            
            if metadata_path.exists():
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
                images_with_metadata.append(metadata)
            else:
                # Fallback if no metadata exists
                images_with_metadata.append({
                    "image_url": f"/mapping_images/{image_file.name}",
                    "image_id": image_id,
                    "timestamp": "",
                    "latitude": 0.0,
                    "longitude": 0.0,
                    "altitude": 0.0,
                    "yaw": 0.0
                })
        
        return {"images": images_with_metadata}
    except Exception as e:
        print(f"Error getting mapping images: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.delete("/mapping/images/{image_id}")
async def delete_mapping_image(image_id: str):
    try:
        image_path = MAPPING_DIR / f"{image_id}.jpg"
        metadata_path = MAPPING_METADATA_DIR / f"{image_id}.json"
        
        if image_path.exists():
            image_path.unlink()
        if metadata_path.exists():
            metadata_path.unlink()

        response = requests.delete(f"{MAPPING_SERVICE_URL}", json={"image_id": image_id}, timeout=3)
        return response.json()
    except Exception as e:
        print(f"Error deleting mapping image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mapping/start")
async def start_mapping():
    print("Forwarding start request to mapping service")
    response = requests.post(f"{MAPPING_SERVICE_URL}/start", json={"command": "start"}, timeout=3)
    return response.json()

@router.post("/mapping/stop")
async def stop_mapping():
    print("Forwarding stop request to mapping service")
    response = requests.post(f"{MAPPING_SERVICE_URL}/stop", json={"command": "stop"}, timeout=3) 
    return response.json()

@router.post("/mapping/generate")
async def generate_mapping():
    print("Forwarding generate request to mapping service")
    response = requests.post(f"{MAPPING_SERVICE_URL}/generate", json={"command": "generate"}, timeout=3)
    return response.json() 