'use client'; // Necessary for React components in the App Router

import React, { useEffect, useState } from 'react';
import { generateLidarData } from '../utils/lidarSimulator';
import { Config } from 'plotly.js';
import styles from '../styles/LidarPlot.module.css';

import Plot from 'react-plotly.js';

const LidarPlot: React.FC = () => {
  const [data, setData] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const lidarData = generateLidarData();
      setData(lidarData);
    }, 1000); // Update every 500ms
    return () => clearInterval(interval);
  }, []);

  const xData = data.map((point) => point.x);
  const yData = data.map((point) => point.y);

  // Memoize the layout and config to prevent re-renders from resetting the view
  const layout = React.useMemo(() => ({
    title: 'Live Lidar Data',
    paper_bgcolor: 'black',
    plot_bgcolor: 'black',
    font: {
      family: 'Verdana, Arial, sans-serif',
      color: '#FFFFFF',
      size: 16,
      bold: true
    },
    xaxis: { 
      title: 'X (meters)',
      gridcolor: '#333333',
      zerolinecolor: '#666666',
      tickcolor: '#ff4d4d',  
      linecolor: '#ff4d4d' 
    },
    yaxis: { 
      title: 'Y (meters)',
      gridcolor: '#333333',
      zerolinecolor: '#666666',
      tickcolor: '#ff4d4d', 
      linecolor: '#ff4d4d'  
    },
    width: 700,
    height: 700,
  }), []); // Empty dependency array means this will only be created once

  const config: Partial<Config> = React.useMemo(() => ({
    scrollZoom: true,
    displayModeBar: true,
    responsive: true,
    modeBarButtonsToRemove: ['select2d', 'lasso2d'],
  }), []);

  return (
    <div className={styles.plotContainer}>
      <Plot
        data={[
          {
            x: xData,
            y: yData,
            mode: 'markers',
            marker: { 
              color: '#00FFFF',
              size: 6,
              opacity: .8,
              symbol: 'circle',
              line: {
                color: '#00FFFF',
                width: 1
              }
            },
            type: 'scatter',
          },
        ]}
        layout={layout}
        config={config}
        useResizeHandler={true}
        className={styles.plot}
      />
    </div>
  );
};

export default LidarPlot;
