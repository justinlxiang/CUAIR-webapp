'use client';

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import Header from '../components/Header';
import styles from '../styles/Home.module.css';
import { lidarWsClient, videoWsClient } from '../api/websocket';
import Image from 'next/image';

interface DetectionFrameData {
  timestamp: number;
  frame: string;
}

export default function Home() {
  const [detectionFrame, setDetectionFrame] = useState<DetectionFrameData | null>(null);
  useEffect(() => {
    // Connect to WebSockets
    videoWsClient.connect();
    
    videoWsClient.onMessage((message) => {
      if (message.type === 'detection_frame') {
        setDetectionFrame({
          timestamp: message.data.timestamp,
          frame: message.data.frame
        });
      }
    });
    
    // Clean up WebSocket connections when component unmounts
    return () => {
      lidarWsClient.disconnect();
      videoWsClient.disconnect();
    };
  }, []);

  return (
    <>
      <Header />
      <main className={`bg-background ${styles.container}`}>
        <div className={styles.wrapper}>
          <h1 className={`text-foreground text-center ${styles.title}`}>Intsys Video Stream</h1>
          
          <div className="mt-8 flex flex-col gap-4">
            <Card className={`bg-card border-border p-4 ${styles.card}`}>
              <h2 className="text-xl font-bold text-card-foreground mb-4">Detection Frame Feed</h2>
              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                {detectionFrame ? (
                  <Image
                    src={`data:image/jpeg;base64,${detectionFrame.frame}`}
                    alt="Detection Frame"
                    className="w-full h-full object-cover"
                    width={1280}
                    height={720}
                    onError={(e) => console.error('Error loading image:', e)}
                    priority
                    unoptimized
                    key="detection-frame-image"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No detection frame available
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}