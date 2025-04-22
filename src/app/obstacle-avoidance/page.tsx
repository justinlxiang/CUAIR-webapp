'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import LidarPlot from '../components/LidarPlot';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from '../components/Header';
import styles from '../styles/Home.module.css';
import { lidarWsClient, videoWsClient, WebSocketMessage } from '../api/websocket';

interface Cluster {
  center: [number, number];
  width: number;
  height: number;
  points: number[][];
  id?: number;
  movement?: number;
  moving_towards_lidar?: boolean;
}

interface LidarData {
  points: number[][];
  clusters: Cluster[];
  radius_threshold: number;
}

const getClusterColor = (cluster: Cluster, idx: number) => {
  const colorId = cluster.id ?? idx;
  return `hsl(${(colorId * 137) % 360}, 70%, 50%)`;
};

export default function Home() {
  const [lidarData, setLidarData] = useState<LidarData | null>(null);
  const [isLidarActive, setIsLidarActive] = useState<boolean | null>(null);

  const checkLidarStatus = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8888/lidar/status');
      if (response.ok) {
        const status = await response.json();
        setIsLidarActive(status.isRunning);
      }
    } catch (error) {
      console.error('Error checking LiDAR status:', error);
    }
  }, []);

  const toggleLidar = useCallback(async () => {
    try {
      const endpoint = isLidarActive ? 'stop' : 'start';
      const response = await fetch(`http://localhost:8888/lidar/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: endpoint }),
      });
      if (!response.ok) {
        throw new Error(`Failed to ${endpoint} LiDAR`);
      }
      setIsLidarActive(!isLidarActive);
    } catch (error) {
      console.error(`Error ${isLidarActive ? 'stopping' : 'starting'} LiDAR:`, error);
    }
  }, [isLidarActive]);

  const handleLidarMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'lidar') {
      setLidarData(message.data);
      setIsLidarActive(true);
    }
  }, []);

  useEffect(() => {
    // Connect to WebSockets
    lidarWsClient.connect();
    videoWsClient.connect();
    
    // Check LiDAR status initially
    checkLidarStatus();
    
    // Set up polling interval to check LiDAR status every 1 second
    const statusPollInterval = setInterval(checkLidarStatus, 1000);
    
    // Set up specialized message handlers
    lidarWsClient.onMessage(handleLidarMessage);
    
    // Clean up WebSocket connections and interval when component unmounts
    return () => {
      clearInterval(statusPollInterval);
      lidarWsClient.disconnect();
      videoWsClient.disconnect();
    };
  }, [checkLidarStatus, handleLidarMessage]);

  const renderClusters = useMemo(() => {
    if (!lidarData?.clusters) return null;
    return lidarData.clusters.map((cluster, idx) => (
      <div 
        key={idx}
        className="px-4 py-3 rounded-lg border flex justify-between items-center"
        style={{
          borderColor: getClusterColor(cluster, idx),
          color: getClusterColor(cluster, idx)
        }}
      >
        <div>
          <div>ID: {cluster.id || 'Unknown'}</div>
          <div>Meters/Second: {cluster.movement?.toFixed(2)}</div>
          <div>Moving Towards Lidar: {cluster.moving_towards_lidar ? 'Yes' : 'No'}</div>
        </div>
        <div>
          <div>Center: ({cluster.center[0].toFixed(2)}, {cluster.center[1].toFixed(2)})</div>
          <div>Width: {cluster.width.toFixed(2)}</div>
          <div>Height: {cluster.height.toFixed(2)}</div>
        </div>
      </div>
    ));
  }, [lidarData?.clusters]);

  return (
    <>
      <Header />
      <main className={`bg-background ${styles.container}`}>
        <div className={styles.wrapper}>
          <h1 className={`text-foreground text-center ${styles.title}`}>Intsys Obstacle Avoidance</h1>
          
          {/* LiDAR toggle button */}
          <div className="flex justify-center mb-4">
            <Button
              onClick={toggleLidar}
              variant={isLidarActive === null ? "outline" : "default"}
              className={isLidarActive === null ? "" : 
                `${isLidarActive ? 'bg-red-700 hover:bg-red-800' : 'bg-green-600 hover:bg-green-700'} text-white`}
            >
              {isLidarActive === null ? 'Loading...' : isLidarActive ? 'Stop LiDAR' : 'Start LiDAR'}
            </Button>
          </div>

          <div className="flex flex-row gap-4" style={{ minHeight: '700px' }}>
            <Card className={`bg-card border-border ${styles.card}`} style={{ width: '700px' }}>
              <div className={styles.cardContent}>
                <div className={styles.plotContainer}>
                  <LidarPlot data={lidarData} />
                </div>
              </div>
            </Card>

            <Card className={`bg-card border-border p-4 ${styles.card}`} style={{ width: '500px' }}>
              <h2 className="text-xl font-bold text-card-foreground mb-4">Detected Obstacles</h2>
              <div className="flex flex-col gap-3">
                {renderClusters}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}