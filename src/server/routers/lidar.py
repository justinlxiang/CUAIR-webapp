from fastapi import APIRouter, HTTPException, WebSocket
from fastapi.websockets import WebSocketDisconnect
import requests
import asyncio
import logging
from websocket_manager import WebSocketManager
from config import LIDAR_SERVICE_URL
import signal
import sys

router = APIRouter()
logger = logging.getLogger(__name__)

def handle_sigterm(signum, frame):
    print("Received SIGTERM/SIGINT. Shutting down gracefully...")
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGINT, handle_sigterm)
signal.signal(signal.SIGTERM, handle_sigterm)

class LidarState:
    def __init__(self):
        self.scan_points = []
        self.point_labels = []
        self.bounding_boxes = [] 

lidar_state = LidarState()
lidar_ws_manager = WebSocketManager(name="lidar")

@router.websocket("/ws/lidar")
async def lidar_websocket_endpoint(websocket: WebSocket):
    await lidar_ws_manager.connect(websocket)
    
    try:
        while True:
            try:
                await websocket.receive_text()
            
            except WebSocketDisconnect:
                break
            except asyncio.CancelledError:
                break
            
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await lidar_ws_manager.disconnect()

@router.post("/lidar-data")
async def receive_lidar_data(data: dict):
    try:
        logger.info("Received POST request to /lidar-data")
        
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
        
        # Update state before sending
        lidar_state.scan_points = scan_points
        lidar_state.point_labels = data.get("point_labels", [])
        lidar_state.bounding_boxes = bounding_boxes
        
        # Send WebSocket message if connection exists
        if lidar_ws_manager.connection:
            success = await lidar_ws_manager.send_message(lidar_data)
            if not success:
                logger.warning("Failed to send lidar data via WebSocket")

        return {"status": "success"}

    except Exception as e:
        logger.error(f"Error processing lidar data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/lidar/start")
async def start_lidar():
    print("Forwarding start request to LiDAR service")
    response = requests.post(f"{LIDAR_SERVICE_URL}/start", json={"name": "start"}, timeout=3)
    return response.json()

@router.post("/lidar/stop")
async def stop_lidar():
    print("Forwarding stop request to LiDAR service")
    response = requests.post(f"{LIDAR_SERVICE_URL}/stop", json={"name": "stop"}, timeout=3) 
    return response.json()

@router.get("/lidar/status")
async def get_status():
    print("Checking LiDAR service status")
    try:
        response = requests.get(f"{LIDAR_SERVICE_URL}/status", timeout=3)
        return response.json()
    except requests.exceptions.Timeout:
        return {"isRunning": False, "error": "Request timed out"}
    except Exception as e:
        logger.error(f"Error checking LiDAR status: {str(e)}")
        return {"isRunning": False, "error": str(e)}