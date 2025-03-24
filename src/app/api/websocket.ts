export type WebSocketMessage = {
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
} | {
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

// Base WebSocket class that can be extended
export class WebSocketClient {
    protected ws: WebSocket | null = null;
    protected messageHandler: ((message: WebSocketMessage) => void) | null = null;
    protected endpoint: string;

    constructor(endpoint: string) {
        this.endpoint = endpoint;
    }

    connect() {
        if (this.ws?.readyState === WebSocket.OPEN) {
            return;
        }

        this.ws = new WebSocket(`ws://10.48.61.73:8888${this.endpoint}`);

        this.ws.onopen = () => {
            console.log(`WebSocket connected to ${this.endpoint}`);
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data) as WebSocketMessage;
                this.messageHandler?.(message);
            } catch (error) {
                console.error(`WebSocket ${this.endpoint}: Error processing message:`, error);
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

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

export class LidarWebSocketClient extends WebSocketClient {
    constructor() {
        super('/ws/lidar');
    }
}

export class VideoWebSocketClient extends WebSocketClient {
    constructor() {
        super('/ws/detection_stream');
    }
}

export class MappingWebSocketClient extends WebSocketClient {
    constructor() {
        super('/ws/mapping');
    }
}

export class TelemetryWebSocketClient extends WebSocketClient {
    constructor() {
        super('/ws/telemetry');
    }
}

// Create separate instances
export const lidarWsClient = new LidarWebSocketClient();
export const videoWsClient = new VideoWebSocketClient(); 
export const mappingWsClient = new MappingWebSocketClient();
export const telemetryWsClient = new TelemetryWebSocketClient();