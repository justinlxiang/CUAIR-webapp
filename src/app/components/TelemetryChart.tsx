'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { wsClient } from '../api/websocket';

const MAX_DATA_POINTS = 50;

const TelemetryChart = dynamic(() => Promise.resolve(function Chart() {
    const [telemetryData, setTelemetryData] = useState<{
        timestamp: number;
        pitch: number;
        roll: number;
        yaw: number;
    }[] | null>(null);

    useEffect(() => {
        wsClient.connect();

        const handleTelemetryData = (data: { type: string; data: { timestamp: number; pitch: number; roll: number; yaw: number; } }) => {
            if (data.type === 'telemetry') {
                // Keep only the last MAX_DATA_POINTS
                setTelemetryData((prevData) => {
                    const newData = [...(prevData || []), data.data];
                    return newData.slice(-MAX_DATA_POINTS);
                });
            }
        };
        
        wsClient.subscribe('telemetry', handleTelemetryData);

        return () => {
            wsClient.unsubscribe('telemetry', handleTelemetryData);
        };
    }, []);

    return (
        <div className="w-full h-[400px] p-4">
            <LineChart
                width={800}
                height={400}
                data={telemetryData || []}
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