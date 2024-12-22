'use client';

import React, { useState, useEffect } from 'react';
import LidarPlot from '../components/LidarPlot';
import { Card } from "@/components/ui/card";
import Header from '../components/Header';
import styles from '../styles/Home.module.css';
import { wsClient } from '../api/websocket';

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

export default function Home() {
  const [lidarData, setLidarData] = useState<LidarData | null>(null);

  useEffect(() => {
    wsClient.connect();

    const handleLidarData = (data: any) => {
      if (data.type === 'lidar') {
        setLidarData(data.data);
      }
    };
    
    wsClient.subscribe('lidar', handleLidarData);
    
    return () => {
      wsClient.unsubscribe('lidar', handleLidarData);
    };
  }, []);

  return (
    <>
      <Header />
      <main className={styles.container}>
        <div className={styles.wrapper}>
          <h1 className={styles.title}>CUAIR Obstacle Avoidance</h1>
          <div className="flex flex-row gap-4" style={{ minHeight: '700px' }}>
            <Card className={styles.card} style={{ width: '700px' }}>
              <div className={styles.cardContent}>
                <div className={styles.plotContainer}>
                  <LidarPlot />
                </div>
              </div>
            </Card>

            <Card className={`${styles.card} p-4`} style={{ width: '500px' }}>
              <h2 className="text-xl font-bold text-white mb-4">Detected Obstacles</h2>
              <div className="flex flex-col gap-3">
                {lidarData?.clusters.map((cluster, idx) => (
                  <div 
                    key={idx}
                    className="px-4 py-3 rounded-lg border flex justify-between items-center"
                    style={{
                      borderColor: `hsl(${(idx * 137) % 360}, 70%, 50%)`,
                      color: `hsl(${(idx * 137) % 360}, 70%, 50%)`
                    }}
                  >
                    <div>
                      <div>ID: {cluster.id || 'Unknown'}</div>
                      <div>Movement: {cluster.movement?.toFixed(2)}</div>
                      <div>Moving Towards Lidar: {cluster.moving_towards_lidar ? 'Yes' : 'No'}</div>
                    </div>
                    <div>
                      <div>Center: ({cluster.center[0].toFixed(2)}, {cluster.center[1].toFixed(2)})</div>
                      <div>Width: {cluster.width.toFixed(2)}</div>
                      <div>Height: {cluster.height.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}