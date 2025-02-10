'use client';

import React, { useState, useEffect, useRef } from 'react';
import LidarPlot from '../components/LidarPlot';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from '../components/Header';
import styles from '../styles/Home.module.css';
import { wsClient } from '../api/websocket';
import Image from 'next/image';
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
  const [detectionFrame, setDetectionFrame] = useState<string | null>(null);
  const [isLidarActive, setIsLidarActive] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);

  const checkLidarStatus = async () => {
    try {
      const response = await fetch('http://localhost:8888/status');
      if (response.ok) {
        const status = await response.json();
        setIsLidarActive(status.isRunning);
      }
    } catch (error) {
      console.error('Error checking LiDAR status:', error);
    }
  };

  const toggleLidar = async () => {
    try {
      const endpoint = isLidarActive ? 'stop' : 'start';
      const response = await fetch(`http://localhost:8888/${endpoint}`, {
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
  };

  useEffect(() => {
    wsClient.connect();
    checkLidarStatus();
    
    wsClient.onMessage((message) => {
        if (message.type === 'lidar') {
            setLidarData(message.data);
        }
        if (message.type === 'detection_frame') {
            setDetectionFrame(message.data.frame);
        }
    });

    // async function setupWebRTC() {
    //   try {
    //     // Create peer connection
    //     const pc = new RTCPeerConnection();
    //     peerRef.current = pc;

    //     // Handle incoming tracks
    //     pc.ontrack = (event) => {
    //       console.log("Received track:", event.track.kind);
    //       if (videoRef.current && event.streams[0]) {
    //         videoRef.current.srcObject = event.streams[0];
    //       }
    //     };

        // Create and send offer
      //   const offer = await pc.createOffer({
      //     offerToReceiveVideo: true,
      //     offerToReceiveAudio: false
      //   });
      //   await pc.setLocalDescription(offer);

      //   // Send offer to server
      //   const response = await fetch('http://localhost:8888/client/offer', {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify({
      //       sdp: pc.localDescription?.sdp,
      //       type: pc.localDescription?.type,
      //     }),
      //   });

      //   if (!response.ok) {
      //     throw new Error(`Server returned ${response.status}`);
      //   }

      //   // Get and set remote description
      //   const answer = await response.json();
      //   await pc.setRemoteDescription(new RTCSessionDescription(answer));
      //   console.log("WebRTC connection established");
      // } catch (err) {
      //   console.error("Error setting up WebRTC:", err);
      // }
    // }

    // setupWebRTC();

    const videoElement = videoRef.current;

    return () => {
      if (peerRef.current) {
        peerRef.current.close();
      }
      if (videoElement?.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
                {lidarData?.clusters.map((cluster, idx) => (
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
          
          <div className="mt-8 flex flex-col gap-4">
            <Card className={`bg-card border-border p-4 ${styles.card}`}>
              <h2 className="text-xl font-bold text-card-foreground mb-4">Detection Frame Feed</h2>
              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                {detectionFrame && (
                  <Image
                    src={`data:image/jpeg;base64,${detectionFrame}`}
                    alt="Detection Frame"
                    className="w-full h-full object-cover"
                    width={1280}
                    height={720}
                  />
                )}
              </div>
            </Card>

            <Card className={`bg-card border-border p-4 ${styles.card}`}>
              <h2 className="text-xl font-bold text-card-foreground mb-4">WebRTC Video Feed</h2>
              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
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