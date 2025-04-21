'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const RECONNECT_DELAY = 2000; // 2 seconds
const TIME_WINDOW = 5; // 5 seconds window
const UPDATE_INTERVAL = 0.05; // 50ms update interval for smooth animation

const TelemetryChart = dynamic(() => Promise.resolve(function Chart() {
    const [telemetryData, setTelemetryData] = useState<{
        secondsAgo: number;
        pitch: number;
        roll: number;
        yaw: number;
    }[] | null>(null);

    const lastUpdateTime = useRef<number | null>(null);

    const connectWebSocket = useCallback(() => {
        const ws = new WebSocket('ws://localhost:8888/ws/warning-system');
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'telemetry') {
                const currentTime = performance.now();
                const timeDelta = lastUpdateTime.current ? (currentTime - lastUpdateTime.current) / 1000 : UPDATE_INTERVAL;
                lastUpdateTime.current = currentTime;

                setTelemetryData((prevData) => {
                    const prevDataArray = prevData || [];

                    const newPitch = message.data.pitch;
                    const newRoll = message.data.roll;
                    const newYaw = message.data.yaw;

                    // Create new data point
                    const newPoint = {
                        secondsAgo: 0, // Newest point is at 0 seconds ago
                        pitch: newPitch,
                        roll: newRoll,
                        yaw: newYaw
                    };

                    // Update existing points with real elapsed time
                    const updatedData = prevDataArray.map(point => ({
                        ...point,
                        secondsAgo: point.secondsAgo + timeDelta
                    }));

                    // Filter out points older than TIME_WINDOW seconds
                    const filteredData = updatedData
                        .filter(point => point.secondsAgo <= TIME_WINDOW)
                        .concat([newPoint]);

                    return filteredData;
                });
            }
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed. Attempting to reconnect...');
            lastUpdateTime.current = null;
            setTimeout(connectWebSocket, RECONNECT_DELAY);
        };

        return ws;
    }, []);

    useEffect(() => {
        const ws = connectWebSocket();
        return () => {
            ws.close();
            lastUpdateTime.current = null;
        };
    }, [connectWebSocket]);

    const formatXAxis = (value: number) => {
        return `${value.toFixed(1)}s`;
    };

    return (
        <div className="w-full h-[400px] p-4">
            <LineChart
                width={1200}
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
                <XAxis 
                    dataKey="secondsAgo" 
                    domain={[0, TIME_WINDOW]}
                    type="number"
                    allowDataOverflow={true}
                    ticks={[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]}
                    tickCount={11}
                    tickFormatter={formatXAxis}
                    className="text-muted-foreground"
                    label={{ value: "Seconds Ago", position: "bottom" }}
                />
                <YAxis 
                    domain={[-180, 180]} 
                    className="text-muted-foreground"
                    ticks={[-180, -135, -90, -45, 0, 45, 90, 135, 180]}
                    label={{ value: "Degrees", angle: -90, position: "insideLeft" }}
                />
                <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    labelFormatter={(value) => `${value.toFixed(1)}s ago`}
                />
                <Legend 
                    className="text-card-foreground" 
                    verticalAlign="bottom" 
                    height={50}
                    layout="horizontal"
                    wrapperStyle={{ 
                        paddingLeft: 20,
                        display: 'flex',
                        justifyContent: 'space-around',
                        width: '60%',
                        margin: '0 auto'
                    }}
                />
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