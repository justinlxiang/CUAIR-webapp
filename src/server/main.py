from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from typing import List, Dict
import time
import asyncio
from fastapi.websockets import WebSocketDisconnect

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_message(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_json(message)
            return True
        except Exception:
            return False

manager = ConnectionManager()

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
    await manager.connect(websocket)
    try:
        while True:
            try:
                # Send both lidar and telemetry data
                lidar_data = {"type": "lidar", "data": generate_lidar_points()}
                telemetry_data = {"type": "telemetry", "data": generate_telemetry_data()}
                
                # Send messages only to the current websocket connection
                success = await manager.send_message(websocket, lidar_data)
                if success:
                    await manager.send_message(websocket, telemetry_data)
                else:
                    # If sending fails, close the connection
                    await websocket.close()
                    break
                
                await asyncio.sleep(0.1)
            
            except WebSocketDisconnect:
                # Handle normal disconnection
                manager.disconnect(websocket)
                break
            except asyncio.CancelledError:
                # Handle cancellation (e.g., during server shutdown)
                manager.disconnect(websocket)
                await websocket.close()
                break
            
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        manager.disconnect(websocket)