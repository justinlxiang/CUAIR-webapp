'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import { wsClient } from '../api/websocket';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Text } from 'recharts';
import styles from '../styles/LidarPlot.module.css';

// Wrap the component with dynamic import
const LidarPlot = dynamic(() => Promise.resolve(function Plot() {
  const [points, setPoints] = useState<{x: number, y: number, angle: number, distance: number}[]>([]);

  useEffect(() => {
    console.log('LidarPlot: Connecting to WebSocket');
    wsClient.connect();

    const handleLidarData = (data: any) => {
      if (data.type === 'lidar') {
        // console.log('LidarPlot: Received websocket message:', data.data);
        setPoints(data.data);
      }
    };
    
    wsClient.subscribe('lidar', handleLidarData);
    console.log('LidarPlot: Subscribed to lidar topic');

    return () => {
      wsClient.unsubscribe('lidar', handleLidarData);
    };
  }, []);

  return (
    <div className={styles.plotContainer}>
      <h1 className="text-2xl font-bold text-white text-center">LIDAR Data</h1>
      <ScatterChart
        width={700}
        height={700}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
        <XAxis 
          type="number" 
          dataKey="x" 
          name="X" 
          unit="m"
          stroke="#ff4d4d"
          label={{ value: 'X (meters)', position: 'bottom', fill: '#FFFFFF' }}
          // domain={[-10, 10]} // Add fixed domain
        />
        <YAxis 
          type="number" 
          dataKey="y" 
          name="Y" 
          unit="m"
          stroke="#ff4d4d"
          label={{ value: 'Y (meters)', angle: -90, position: 'left', fill: '#FFFFFF' }}
          // domain={[-10, 10]} // Add fixed domain
        />
        <Scatter 
          name="Lidar Points" 
          data={points} 
          fill="#00FFFF"
          opacity={0.8}
          isAnimationActive={false}
        />
      </ScatterChart>
    </div>
  );
}), { ssr: false });

export default LidarPlot;
