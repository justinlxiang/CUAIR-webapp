type WebSocketMessage = {
    type: 'lidar';
    data: {
        points: number[][];
        clusters: {
            center: [number, number];
            width: number;
            height: number;
            points: number[][];
            id?: number;
            movement?: number;
            moving_towards_lidar?: boolean;
        }[];
        radius_threshold: number;
    };
} | {
    type: 'telemetry';
    data: {
        timestamp: number;
        pitch: number;
        roll: number;
        yaw: number;
    };
} | {
    type: 'video';
    data: string;
} | {
    type: 'detection_frame';
    data: {
        timestamp: number;
        frame: string;
    };
}
  | {
    type: 'mapping_image';
    data: {
        image_url: string;
        image_id: string;
        timestamp: string;
        latitude: number;
        longitude: number;
        altitude: number;
        yaw: number;
    };
};

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private messageHandler: ((message: WebSocketMessage) => void) | null = null;

    connect() {
        if (this.ws?.readyState === WebSocket.OPEN) {
            return;
        }

        this.ws = new WebSocket('ws://localhost:8888/ws');

        this.ws.onopen = () => {
            console.log('WebSocket connected');
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.messageHandler?.(message);
            } catch (error) {
                console.error('WebSocket: Error processing message:', error);
            }
        };

        this.ws.onclose = () => {
            // Attempt to reconnect after a delay
            setTimeout(() => this.connect(), 1000);
        };
    }

    onMessage(handler: (message: WebSocketMessage) => void) {
        this.messageHandler = handler;
    }
}

// Single instance for the application
export const wsClient = new WebSocketClient(); 