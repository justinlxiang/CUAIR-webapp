'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { fetchOrientationData } from '../api/api';

const MAX_DATA_POINTS = 50;

// Wrap the component with dynamic import and ssr: false
const TelemetryChart = dynamic(() => Promise.resolve(function Chart() {
    const [data, setData] = useState<Array<{
        time: string;
        pitch: number;
        roll: number;
        yaw: number;
    }>>([]);

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const newOrientation = await fetchOrientationData();
                
                setData(prevData => {
                    const newPoint = {
                        time: new Date().toLocaleTimeString(),
                        pitch: newOrientation.pitch,
                        roll: newOrientation.roll,
                        yaw: newOrientation.yaw
                    };

                    const newData = [...prevData, newPoint];
                    
                    // Keep only the last MAX_DATA_POINTS points
                    if (newData.length > MAX_DATA_POINTS) {
                        newData.shift();
                    }

                    return newData;
                });
            } catch (error) {
                console.error('Error fetching orientation data:', error);
            }
        }, 100); // Update every 100ms

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-[400px] p-4">
            <LineChart
                width={800}
                height={400}
                data={data}
                margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 10,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[-40, 40]} />
                <Tooltip />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="pitch"
                    stroke="#ff4d4d"
                    dot={false}
                    isAnimationActive={false}
                />
                <Line
                    type="monotone"
                    dataKey="roll"
                    stroke="#4dc3ff"
                    dot={false}
                    isAnimationActive={false}
                />
                <Line
                    type="monotone"
                    dataKey="yaw"
                    stroke="#4dff4d"
                    dot={false}
                    isAnimationActive={false}
                />
            </LineChart>
        </div>
    );
}), { ssr: false });

export default TelemetryChart;