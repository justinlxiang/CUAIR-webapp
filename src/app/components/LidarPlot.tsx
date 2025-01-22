'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ReferenceArea, ZAxis } from 'recharts';
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

const LidarPlot = dynamic(() => Promise.resolve(function Plot({ data }: { data: LidarData | null }) {
  if (!data) return <div>Loading...</div>;

  const formatPoints = (points: number[][]): Point[] => {
    return points.map(([x, y]) => ({ x, y, z: 6 }));
  };

  return (
    <div className={styles.plotContainer}>
      <h1 className="text-2xl font-bold text-white text-center">LIDAR Data</h1>
      <ScatterChart
        width={700}
        height={645}
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
          domain={[-12, 12]}
          allowDataOverflow={true} // Prevent domain from auto-adjusting
        />
        <YAxis 
          type="number" 
          dataKey="y" 
          name="Y" 
          unit="m"
          stroke="#ff4d4d"
          label={{ value: 'Y (meters)', angle: -90, position: 'left', fill: '#FFFFFF' }}
          domain={[-12, 12]}
          allowDataOverflow={true} // Prevent domain from auto-adjusting
        />
        <ZAxis type="number" dataKey="z" range={[0, 100]} name="size"/>

        {/* Plot all points */}
        <Scatter 
          data={formatPoints(data.points)} 
          fill="#00FFFF"
          opacity={0.6}
          isAnimationActive={false}
        />
        

        {/* Plot clusters - simplified version */}
        {data.clusters.map((cluster, idx) => (
          <Scatter
            key={idx}
            data={formatPoints(cluster.points)}
            fill={`hsl(${(idx * 137) % 360}, 70%, 50%)`}
            opacity={0.8}
            isAnimationActive={false}
          />
        ))}

        {/* Plot bounding boxes separately */}
        {data.clusters.map((cluster, idx) => (
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

        {/* Plot radius circle */}
        <ReferenceArea
          x1={-data.radius_threshold}
          x2={data.radius_threshold}
          y1={-data.radius_threshold}
          y2={data.radius_threshold}
          stroke="#FFFFFF"
          strokeWidth={1}
          fill="none"
          shape={(props) => {
            const { x, y, width, height } = props;
            return (
              <circle 
                cx={x + width/2} 
                cy={y + height/2} 
                r={width/2} 
                stroke="#FFFFFF" 
                strokeWidth={1} 
                fill="none"
              />
            );
          }}
        />
        {/* Plot origin point */}
        <Scatter
          data={[{ x: 0, y: 0, z: 3 }]}
          fill="#FFFFFF"
          stroke="#FFFFFF"
          r={10}
          isAnimationActive={false}
          shape="triangle"
        />
      </ScatterChart>
    </div>
  );
}), { ssr: false });

export default LidarPlot;
