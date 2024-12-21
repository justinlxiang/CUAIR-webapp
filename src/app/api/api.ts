// Frontend API calls

// System Stats API
export async function fetchSystemStats() {
    const response = await fetch('http://localhost:8000/api/system-stats');
    if (!response.ok) {
        throw new Error('Failed to fetch system stats');
    }
    return response.json();
}

// Lidar API
export async function fetchLidarData() {
    const response = await fetch('http://localhost:8000/api/lidar-data');
    if (!response.ok) {
        throw new Error('Failed to fetch lidar data');
    }
    return response.json();
}

// Telemetry API
export async function fetchOrientationData() {
    const response = await fetch('http://localhost:8000/api/orientation-data');
    if (!response.ok) {
        throw new Error('Failed to fetch orientation data');
    }
    return response.json();
} 