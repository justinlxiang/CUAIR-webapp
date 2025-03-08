# CUAir IntSys Ground Station

A comprehensive web application for monitoring and controlling CUAir's Intelligent Systems, including obstacle avoidance, mapping, and warning systems.

## Features

- **Obstacle Avoidance**: Real-time LiDAR data visualization and obstacle detection
- **Mapping System**: Capture, store, and generate mapping data
- **Warning System**: Monitor and respond to system warnings
- **System Status**: Track the status of all connected systems

## Tech Stack

### Frontend
- [Next.js](https://nextjs.org/) - React framework with App Router
- [React](https://react.dev/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Plotly.js](https://plotly.com/javascript/) - Data visualization
- [Recharts](https://recharts.org/) - Responsive charts

### Backend
- [FastAPI](https://fastapi.tiangolo.com/) - Python web framework
- WebSocket - Real-time data streaming
- Computer Vision - Obstacle detection algorithms
- RTSP - Video streaming

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/cuair/intsys-ground-station.git
   cd intsys-ground-station
   ```

2. Install frontend dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Install backend dependencies
   ```bash
   cd src/server
   pip install -r requirements.txt
   ```

## Development

### Frontend

Run the development server with Turbopack:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Backend

Start the FastAPI server:

```bash
npm run start-backend
# or
cd src/server
uvicorn main:app --host 0.0.0.0 --reload --port 8888
```

The backend API will be available at [http://localhost:8888](http://localhost:8888).

## API Endpoints

### WebSocket

- `/ws` - Real-time LiDAR and telemetry data
- `/ws/detection` - Real-time obstacle detection data

### REST API

#### LiDAR Control
- `POST /start` - Start LiDAR service
- `POST /stop` - Stop LiDAR service
- `GET /status` - Check LiDAR service status

#### Mapping
- `GET /mapping/images` - Retrieve captured mapping images
- `POST /mapping/upload` - Upload new mapping data
- `POST /mapping/start` - Start mapping process
- `POST /mapping/stop` - Stop mapping process
- `POST /mapping/generate` - Generate mapping data
- `DELETE /mapping/images/{image_id}` - Delete a mapping image

#### WebRTC
- `POST /raspberry-pi/offer` - Handle Raspberry Pi WebRTC offer
- `POST /client/offer` - Handle client WebRTC offer

## Project Structure

```
├── src/
│   ├── app/                  # Next.js frontend
│   │   ├── components/       # Shared UI components
│   │   ├── mapping/          # Mapping system UI
│   │   ├── obstacle-avoidance/ # Obstacle avoidance UI
│   │   ├── warning-system/   # Warning system UI
│   │   └── system/           # System status UI
│   ├── components/           # Global components
│   ├── lib/                  # Utility functions
│   └── server/               # FastAPI backend
│       ├── main.py           # Main server file
│       ├── obstacle_detection.py # Obstacle detection logic
│       ├── rtsp_server.py    # RTSP camera integration
│       └── webrtc_manager.py # WebRTC connection management
├── public/                   # Static assets
└── detectionscript.py        # Standalone detection script
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

## Contributing

Contributions to the CUAir IntSys Ground Station are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is maintained by Cornell University Autonomous Aerial Systems (CUAir).
