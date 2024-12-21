from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from typing import List, Dict
import time
import psutil

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Move lidar simulation logic here
def generate_lidar_points(num_points: int = 360) -> List[Dict[str, float]]:
    angles = np.linspace(0, 2 * np.pi, num_points)
    points = []
    
    for angle in angles:
        # Simulate distance between 0.5 and 5 meters
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

@app.get("/api/lidar-data")
async def get_lidar_data():
    points = generate_lidar_points()
    return {"points": points} 

@app.get("/api/orientation-data")
async def get_orientation_data():
    # Simulate continuous but somewhat random changes in orientation
    timestamp = time.time()
    
    # Generate somewhat continuous values using sin waves with some noise
    pitch = 20 * np.sin(timestamp / 2) + np.random.normal(0, 2)
    roll = 15 * np.sin(timestamp / 3 + 1) + np.random.normal(0, 2)
    yaw = 30 * np.sin(timestamp / 4 + 2) + np.random.normal(0, 2)
    
    return {
        "timestamp": timestamp,
        "pitch": float(pitch),
        "roll": float(roll),
        "yaw": float(yaw)
    }