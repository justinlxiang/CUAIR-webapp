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

const LidarPlot = React.memo(function Plot({ data }: { data: LidarData | null }) {
  // Add debug logging
  React.useEffect(() => {
    console.log('Plot update:', new Date().toISOString());
  }, [data]);

  // Move hooks before any conditional returns
  const formatPoints = React.useMemo(() => (points: number[][]): Point[] => {
    return points.map(([x, y]) => ({ x, y, z: 6 }));
  }, []);

  const getClusterColor = React.useMemo(() => (cluster: Cluster, idx: number) => {
    const colorId = cluster.id ?? idx;
    return `hsl(${(colorId * 137) % 360}, 70%, 50%)`;
  }, []);

  const formattedData = React.useMemo(() => {
    if (!data) return null;
    return {
      points: formatPoints(data.points),
      clusters: data.clusters.map((cluster, idx) => ({
        ...cluster,
        points: formatPoints(cluster.points),
        color: getClusterColor(cluster, idx)
      }))
    };
  }, [data, formatPoints, getClusterColor]);

  if (!formattedData) return <div>No incoming data...</div>;

  return (
    <div className={styles.plotContainer}>
      <h1 className="text-2xl font-bold text-black dark:text-white text-center">LIDAR Data</h1>
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
          stroke="currentColor"
          label={{ value: 'X (meters)', position: 'bottom', fill: 'currentColor' }}
          domain={[-15, 15]}
          allowDataOverflow={true}
          interval={0}
          tickCount={7}
        />
        <YAxis 
          type="number" 
          dataKey="y" 
          name="Y" 
          unit="m"
          stroke="currentColor"
          label={{ value: 'Y (meters)', angle: -90, position: 'left', fill: 'currentColor' }}
          domain={[-15, 15]}
          allowDataOverflow={true}
          interval={0}
          tickCount={7}
        />
        <ZAxis type="number" dataKey="z" range={[0, 100]} name="size"/>

        {/* Plot all points */}
        <Scatter 
          data={formattedData.points} 
          fill="#00FFFF"
          opacity={0.6}
          isAnimationActive={false}
        />

        {/* Plot clusters - simplified version */}
        {formattedData.clusters.map((cluster, idx) => (
          <Scatter
            key={idx}
            data={cluster.points}
            fill={cluster.color}
            opacity={0.8}
            isAnimationActive={false}
          />
        ))}
        
        {/* Plot clusters */}
        {formattedData.clusters.map((cluster, idx) => (
          <ReferenceArea
            key={idx}
            x1={cluster.center[0] - cluster.width/2}
            x2={cluster.center[0] + cluster.width/2}
            y1={cluster.center[1] - cluster.height/2}
            y2={cluster.center[1] + cluster.height/2}
            stroke={cluster.color}
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="none"
          />
        ))}

        {/* Plot radius circle */}
        {data && (
          <ReferenceArea
            x1={-data.radius_threshold}
            x2={data.radius_threshold}
            y1={-data.radius_threshold}
            y2={data.radius_threshold}
            stroke="currentColor"
            strokeWidth={1}
            fill="none"
            shape={(props) => {
              const { x, y, width, height } = props;
              return (
                <circle 
                  cx={x + width/2} 
                  cy={y + height/2} 
                  r={width/2} 
                  stroke="currentColor" 
                  strokeWidth={1} 
                  fill="none"
                />
              );
            }}
          />
        )}
        {/* Plot origin point */}
        <Scatter
          data={[{ x: 0, y: 0, z: 3 }]}
          fill="currentColor"
          stroke="currentColor"
          r={10}
          isAnimationActive={false}
          shape="triangle"
        />
      </ScatterChart>
    </div>
  );
});

export default dynamic(() => Promise.resolve(LidarPlot), { 
  ssr: false,
  loading: () => <div>Loading plot...</div>
});
