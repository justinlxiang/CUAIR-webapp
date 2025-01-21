from fastapi import FastAPI, WebSocket
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
    await websocket.accept()
    detector = ObstacleDetector(simulation=True)
    
    try:
        while True:
            try:
                # Get obstacle detection data
                obstacle_data = detector.process_frame()
                lidar_data = {"type": "lidar", "data": obstacle_data}
                
                # Get telemetry data
                telemetry_data = {"type": "telemetry", "data": generate_telemetry_data()}
                
                # Send both types of data
                try:
                    await websocket.send_json(lidar_data)
                    await websocket.send_json(telemetry_data)
                except Exception:
                    await websocket.close()
                    break
                
                await asyncio.sleep(0.1)  # 10 FPS
            
            except WebSocketDisconnect:
                break
            except asyncio.CancelledError:
                await websocket.close()
                break
            
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()