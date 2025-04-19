'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [isStreamActive, setIsStreamActive] = useState<boolean | null>(null);

  const checkStreamStatus = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8888/stream/status');
      if (response.ok) {
        const status = await response.json();
        setIsStreamActive(status.isStreaming);
      }
    } catch (error) {
      console.error('Error checking stream status:', error);
    }
  }, []);

  const toggleStream = async () => {
    try {
      const endpoint = isStreamActive ? 'stop' : 'start';
      const response = await fetch(`http://localhost:8888/stream/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: endpoint }),
      });
      if (!response.ok) {
        throw new Error(`Failed to ${endpoint} stream`);
      }
      setIsStreamActive(!isStreamActive);
    } catch (error) {
      console.error(`Error ${isStreamActive ? 'stopping' : 'starting'} stream:`, error);
    }
  }

  useEffect(() => {
    // Connect to WebSockets
    videoWsClient.connect();
    
    // Check stream status
    checkStreamStatus();
    
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
  }, [checkStreamStatus]);

  return (
    <>
      <Header />
      <main className={`bg-background ${styles.container}`}>
        <div className={styles.wrapper}>
          <h1 className={`text-foreground text-center ${styles.title}`}>Intsys Video Stream</h1>
          
          {/* Stream toggle button */}
          <div className="flex justify-center mb-4">
            <Button
              onClick={toggleStream}
              variant={isStreamActive === null ? "outline" : "default"}
              className={isStreamActive === null ? "" : 
                `${isStreamActive ? 'bg-red-700 hover:bg-red-800' : 'bg-green-600 hover:bg-green-700'} text-white`}
            >
              {isStreamActive === null ? 'Loading...' : isStreamActive ? 'Stop Stream' : 'Start Stream'}
            </Button>
          </div>
          
          <div className="flex flex-col gap-4">
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