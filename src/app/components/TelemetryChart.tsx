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

        wsClient.onMessage((message) => {
            if (message.type === 'telemetry') {
                setTelemetryData((prevData) => {
                    const newData = [...(prevData || []), message.data];
                    return newData.slice(-MAX_DATA_POINTS);
                });
            }
        });
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
                    bottom: 30,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" className="text-muted" />
                <XAxis dataKey="time" className="text-muted-foreground" />
                <YAxis domain={[-40, 40]} className="text-muted-foreground" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                <Legend className="text-card-foreground" />
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