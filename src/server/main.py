from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from typing import List, Dict
import time
import asyncio
import cv2
import base64
from fastapi.websockets import WebSocketDisconnect
from obstacle_detection import ObstacleDetector
from aiortc import VideoStreamTrack, RTCPeerConnection, RTCSessionDescription
from webrtc_manager import WebRTCManager

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In development, allow all origins
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

# Add this new class after LidarState
class RTSPCamera:
    def __init__(self, rtsp_url):
        self.rtsp_url = rtsp_url
        self.cap = None
        
    def connect(self):
        self.cap = cv2.VideoCapture(self.rtsp_url)
        if not self.cap.isOpened():
            raise Exception("Failed to connect to RTSP stream")
            
    def read_frame(self):
        if self.cap is None:
            self.connect()
        ret, frame = self.cap.read()
        if not ret:
            return None
        return frame
        
    def release(self):
        if self.cap:
            self.cap.release()

# Initialize RTSP camera with your stream URL
rtsp_camera = RTSPCamera("rtsp://localhost:8554/mystream")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    
    try:
        while True:
            try:
                # Get frame from RTSP stream
                frame = rtsp_camera.read_frame()
                if frame is not None:
                    # Encode frame to JPEG
                    _, buffer = cv2.imencode('.jpg', frame)
                    # Convert to base64
                    frame_base64 = base64.b64encode(buffer).decode('utf-8')
                    
                    # Send frame data
                    frame_data = {
                        "type": "camera_frame",
                        "data": {
                            "timestamp": time.time(),
                            "frame": frame_base64
                        }
                    }
                    await websocket.send_json(frame_data)
                
                # Get telemetry data
                # telemetry_data = {"type": "telemetry", "data": generate_telemetry_data()}
                # await websocket.send_json(telemetry_data)
                
                await asyncio.sleep(0.033)  # ~30 FPS                
            
            except WebSocketDisconnect:
                break
            except asyncio.CancelledError:
                break
            
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        rtsp_camera.release()
        await ws_manager.disconnect()

@app.post("/lidar-data")
async def receive_lidar_data(data: dict):
    try:
        # Add debug logging at the start of the function
        print("Received POST request to /lidar-data")
        print("Request data:", data)
        
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
        await ws_manager.send_message(lidar_data)
        
        # Update state after sending (non-blocking)
        lidar_state.scan_points = scan_points
        lidar_state.point_labels = data.get("point_labels", [])
        lidar_state.bounding_boxes = bounding_boxes

        # Optional: Move logging to after sending data
        print("Received LiDAR data: {} points, {} clusters".format(
            len(scan_points), len(bounding_boxes)))

        return {"status": "success"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detection-frame")
async def receive_detection_frame(data: dict):
    try:
        # Add debug logging at the start of the function
        print("Received POST request to /detection-frame")
        
        # Send the frame data through WebSocket
        detection_frame = {
            "type": "detection_frame",
            "data": {
                "timestamp": int(time.time()),  # Generate timestamp on server
                "frame": data  # Pass through the base64 encoded frame
            }
        }

        await ws_manager.send_message(detection_frame)
        
        print("Successfully received and forwarded frame")
        return {"status": "success"}

    except Exception as e:
        print(f"Error processing detection frame: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Initialize WebRTC manager
webrtc_manager = WebRTCManager()

# Endpoint for Raspberry Pi to connect
@app.post("/raspberry-pi/offer")
async def handle_raspberry_pi_offer(offer: dict):
    try:
        answer = await webrtc_manager.handle_offer(offer, source="raspberry_pi")
        return answer
    except Exception as e:
        print(f"Error handling Raspberry Pi offer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint for frontend clients to connect
@app.post("/client/offer")
async def handle_client_offer(offer: dict):
    try:
        if not webrtc_manager.has_video_source:
            raise HTTPException(status_code=503, detail="No video source available")
        answer = await webrtc_manager.handle_offer(offer, source="client")
        return answer
    except Exception as e:
        print(f"Error handling client offer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("shutdown")
async def shutdown_event():
    await webrtc_manager.close_connections()