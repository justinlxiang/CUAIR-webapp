'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import { wsClient } from '../api/websocket';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ReferenceArea } from 'recharts';
import styles from '../styles/LidarPlot.module.css';

interface Point {
  x: number;
  y: number;
}

interface Cluster {
  center: [number, number];
  width: number;
  height: number;
  points: number[][];
  id?: number;
  movement?: number;
}

interface LidarData {
  points: number[][];
  clusters: Cluster[];
  radius_threshold: number;
}

const LidarPlot = dynamic(() => Promise.resolve(function Plot() {
  const [lidarData, setLidarData] = useState<LidarData | null>(null);

  useEffect(() => {
    console.log('LidarPlot: Connecting to WebSocket');
    wsClient.connect();

    const handleLidarData = (data: { type: string; data: LidarData }) => {
      if (data.type === 'lidar') {
        setLidarData(data.data);
      }
    };
    
    wsClient.subscribe('lidar', handleLidarData);
    
    return () => {
      wsClient.unsubscribe('lidar', handleLidarData);
    };
  }, []);

  const formatPoints = (points: number[][]): Point[] => {
    return points.map(([x, y]) => ({ x, y }));
  };

  if (!lidarData) return <div>Loading...</div>;

  return (
    <div className={styles.plotContainer}>
      <h1 className="text-2xl font-bold text-white text-center">LIDAR Data</h1>
      <ScatterChart
        width={700}
        height={700}
        margin={{ top: 20, right: 50, bottom: 20, left: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
        <XAxis 
          type="number" 
          dataKey="x" 
          name="X" 
          unit="m"
          stroke="#ff4d4d"
          label={{ value: 'X (meters)', position: 'bottom', fill: '#FFFFFF' }}
          domain={[-20, 20]}
          allowDataOverflow={true} // Prevent domain from auto-adjusting
        />
        <YAxis 
          type="number" 
          dataKey="y" 
          name="Y" 
          unit="m"
          stroke="#ff4d4d"
          label={{ value: 'Y (meters)', angle: -90, position: 'left', fill: '#FFFFFF' }}
          domain={[-20, 20]}
          allowDataOverflow={true} // Prevent domain from auto-adjusting
        />
        {/* Plot all points */}
        <Scatter 
          data={formatPoints(lidarData.points)} 
          fill="#00FFFF"
          opacity={0.6}
          isAnimationActive={false}
        />
        

        {/* Plot clusters - simplified version */}
        {lidarData.clusters.map((cluster, idx) => (
          <Scatter
            key={idx}
            data={formatPoints(cluster.points)}
            fill={`hsl(${(idx * 137) % 360}, 70%, 50%)`}
            opacity={0.8}
            isAnimationActive={false}
          />
        ))}

        {/* Plot bounding boxes separately */}
        {lidarData.clusters.map((cluster, idx) => (
          <ReferenceArea
            key={idx}
            x1={cluster.center[0] - cluster.width/2}
            x2={cluster.center[0] + cluster.width/2}
            y1={cluster.center[1] - cluster.height/2}
            y2={cluster.center[1] + cluster.height/2}
            stroke={`hsl(${(idx * 137) % 360}, 70%, 50%)`}
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="none"
          />
        ))}
      </ScatterChart>
    </div>
  );
}), { ssr: false });

export default LidarPlot;
