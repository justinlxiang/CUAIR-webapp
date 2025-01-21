from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from typing import List, Dict
import time
import asyncio
from fastapi.websockets import WebSocketDisconnect
from obstacle_detection import ObstacleDetector

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class WebSocketManager:
    def __init__(self):
        self.connection: WebSocket | None = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.connection = websocket

    async def disconnect(self):
        self.connection = None

    async def send_message(self, message: dict):
        if self.connection:
            try:
                await self.connection.send_json(message)
            except Exception as e:
                print(f"Error sending to websocket: {e}")
                self.connection = None

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

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    
    try:
        while True:
            try:
                # Get obstacle detection data
                # obstacle_data = detector.process_frame()
                # lidar_data = {"type": "lidar", "data": obstacle_data}
                
                # Get telemetry data
                telemetry_data = {"type": "telemetry", "data": generate_telemetry_data()}
                await websocket.send_json(telemetry_data)
                await asyncio.sleep(0.1)  # 10 FPS
            
            except WebSocketDisconnect:
                break
            except asyncio.CancelledError:
                break
            
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await ws_manager.disconnect()

@app.post("/lidar-data")
async def receive_lidar_data(data: dict):
    try:
        # Extract data from the request
        timestamp = data.get("timestamp")
        scan_points = data.get("scan_points", [])
        point_labels = data.get("point_labels", [])
        bounding_boxes = data.get("bounding_boxes", [])

        # Store the latest data in state object
        lidar_state.scan_points = scan_points
        lidar_state.point_labels = point_labels
        lidar_state.bounding_boxes = bounding_boxes

        # print("Received LiDAR data: {} points, {} clusters".format(len(lidar_state.scan_points), len(lidar_state.bounding_boxes)))
        print(lidar_state.bounding_boxes)

        lidar_data = {
            "type": "lidar",
            "data": {
                "points": scan_points,
                "clusters": bounding_boxes,
                "radius_threshold": 0.5
            }
        }
        
        await ws_manager.send_message(lidar_data)
        return {"status": "success"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
