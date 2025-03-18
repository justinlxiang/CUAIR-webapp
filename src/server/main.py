from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import numpy as np
from typing import List, Dict
import time
import asyncio
from fastapi.websockets import WebSocketDisconnect
import requests
import base64
from pathlib import Path
import json
import cv2
from websocket_manager import WebSocketManager

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories for storing mapping data
MAPPING_DIR = Path("mapping_images")
MAPPING_DIR.mkdir(exist_ok=True)
MAPPING_METADATA_DIR = Path("mapping_metadata") 
MAPPING_METADATA_DIR.mkdir(exist_ok=True)

# Mount the mapping_images directory to serve files
app.mount("/mapping_images", StaticFiles(directory="mapping_images"), name="mapping_images")

# Initialize the WebSocket manager
ws_manager = WebSocketManager()

# Store most recent LiDAR data in state object
class LidarState:
    def __init__(self):
        self.scan_points = []
        self.point_labels = []
        self.bounding_boxes = []

lidar_state = LidarState()

# Keep existing data generation functions
def generate_lidar_points(num_points: int = 360) -> List[Dict[str, float]]:
    angles = np.linspace(0, 2 * np.pi, num_points)
    points = []
    
    for angle in angles:
        distance = np.random.uniform(0.5, 5)
        x = distance * np.cos(angle)
        y = distance * np.sin(angle)
        
        points.append({
            "x": float(x),
            "y": float(y),
            "angle": float(angle),
            "distance": float(distance)
        })
    
    return points

def generate_telemetry_data():
    timestamp = time.time()
    pitch = 20 * np.sin(timestamp / 2) + np.random.normal(0, 2)
    roll = 15 * np.sin(timestamp / 3 + 1) + np.random.normal(0, 2)
    yaw = 30 * np.sin(timestamp / 4 + 2) + np.random.normal(0, 2)
    
    return {
        "timestamp": timestamp,
        "pitch": float(pitch),
        "roll": float(roll),
        "yaw": float(yaw)
    }

@app.websocket("/ws/lidar")
async def lidar_websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect_lidar(websocket)
    
    try:
        while True:
            try:
                # Get telemetry data
                # telemetry_data = {"type": "telemetry", "data": generate_telemetry_data()}
                # await websocket.send_json(telemetry_data)
                
                # Add a small delay to avoid overwhelming the client
                # await asyncio.sleep(0.1)  # 100ms delay between messages
                await websocket.receive_text()
            
            except WebSocketDisconnect:
                break
            except asyncio.CancelledError:
                break
            
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await ws_manager.disconnect_lidar()

@app.websocket("/ws/mapping")
async def mapping_websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect_mapping(websocket)
    
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
        await ws_manager.disconnect_mapping()

@app.websocket("/ws/detection_stream")
async def detection_websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect_detection_frontend(websocket)
    
    try:
        while True:
            try:
                await websocket.receive_text()
            
            except WebSocketDisconnect:
                break
            except asyncio.CancelledError:
                break
            
    except Exception as e:
        print(f"Detection WebSocket error: {e}")
    finally:
        await ws_manager.disconnect_detection_frontend()

@app.websocket("/ws/detection")
async def detection_websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect_pi_detection(websocket)
    
    try:
        while True:
            try:
                # Receive frame data from Raspberry Pi
                data = await websocket.receive_json()
                print("Received frame data from Raspberry Pi")
                # Forward the frame data to frontend client
                detection_frame = {
                    "type": "detection_frame",
                    "data": {
                        "timestamp": int(time.time()),
                        "frame": data["frame"]
                    }
                }
                
                await ws_manager.send_frontend_detection_message(detection_frame)
                
            except WebSocketDisconnect:
                break
            except asyncio.CancelledError:
                break
            
    except Exception as e:
        print(f"Detection WebSocket error: {e}")
    finally:
        await ws_manager.disconnect_pi_detection()

@app.post("/lidar-data")
async def receive_lidar_data(data: dict):
    if not ws_manager.connection:
        print("WebSocket connection not established")
    
    try:
        # Add debug logging at the start of the function
        print("Received POST request to /lidar-data")
        # print("Request data:", data)
        
        # Extract data from the request
        scan_points = data.get("scan_points", [])
        bounding_boxes = data.get("bounding_boxes", [])

        # Send the data immediately through WebSocket without any processing
        lidar_data = {
            "type": "lidar",
            "data": {
                "points": scan_points,
                "clusters": bounding_boxes,
                "radius_threshold": 14
            }
        }
        
        # Send WebSocket message first
        await ws_manager.send_lidar_message(lidar_data)
        
        # Update state after sending (non-blocking)
        lidar_state.scan_points = scan_points
        lidar_state.point_labels = data.get("point_labels", [])
        lidar_state.bounding_boxes = bounding_boxes

        # print("Received LiDAR data: {} points, {} clusters".format(
            # len(scan_points), len(bounding_boxes)))

        return {"status": "success"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/start")
async def start_lidar():
    print("Forwarding start request to LiDAR service")
    response = requests.post("http://10.49.82.237:5000/start", json={"name": "start"})
    return response.json()

@app.post("/stop")
async def stop_lidar():
    print("Forwarding stop request to LiDAR service")
    response = requests.post("http://10.49.82.237:5000/stop", json={"name": "stop"}) 
    return response.json()

@app.get("/status")
async def get_status():
    print("Checking LiDAR service status")
    response = requests.get("http://10.49.82.237:5000/status")
    return response.json()

@app.post("/mapping/upload")
async def save_new_mapping(data: dict):
    try:        
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
        
        await ws_manager.send_mapping_image_message(mapping_image)
        return {"status": "success", "image_url": image_url}

    except Exception as e:
        print(f"Error saving mapping image: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/mapping/images")
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
    
@app.delete("/mapping/images/{image_id}")
async def delete_mapping_image(image_id: str):
    try:
        image_path = MAPPING_DIR / f"{image_id}.jpg"
        metadata_path = MAPPING_METADATA_DIR / f"{image_id}.json"
        
        if image_path.exists():
            image_path.unlink()
        if metadata_path.exists():
            metadata_path.unlink()

        response = requests.delete("http://127.0.0.1:8000", json={"image_id": image_id})
        return response.json()
    except Exception as e:
        print(f"Error deleting mapping image: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/mapping/start")
async def start_mapping():
    print("Forwarding start request to LiDAR service")
    response = requests.post("http://127.0.0.1:8000/start", json={"command": "start"})
    return response.json()

@app.post("/mapping/stop")
async def stop_mapping():
    print("Forwarding stop request to LiDAR service")
    response = requests.post("http://127.0.0.1:8000/stop", json={"command": "stop"}) 
    return response.json()

@app.post("/mapping/generate")
async def generate_mapping():
    print("Forwarding generate request to LiDAR service")
    response = requests.post("http://127.0.0.1:8000/generate", json={"command": "generate"})
    return response.json()