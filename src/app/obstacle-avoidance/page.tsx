'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    wsClient.connect();
    
    wsClient.onMessage((message) => {
        if (message.type === 'lidar') {
            setLidarData(message.data);
        }
    });

    const currentVideo = videoRef.current;

    // Start webcam
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (currentVideo) {
            currentVideo.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Error accessing webcam:", err);
        });
    }

    return () => {
      if (currentVideo?.srcObject) {
        const stream = currentVideo.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <>
      <Header />
      <main className={`bg-background ${styles.container}`}>
        <div className={styles.wrapper}>
          <h1 className={`text-foreground text-center ${styles.title}`}>CUAIR Obstacle Avoidance</h1>
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
          
          <div className="mt-8">
            <Card className={`bg-card border-border p-4 ${styles.card}`}>
              <h2 className="text-xl font-bold text-card-foreground mb-4">Live Video Feed</h2>
              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ display: 'block' }}
                  className="w-full h-full object-cover"
                />
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}