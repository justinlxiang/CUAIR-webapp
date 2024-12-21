'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Header from '../components/Header';

interface SystemStats {
  memory: {
    total: number;
    used: number;
    free: number;
  };
  cpu: number;
}

export default function System() {
  const [stats, setStats] = React.useState<SystemStats | null>(null);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/system-stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch system stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold mb-6 text-white">System Monitoring</h1>
        
        <Card className="w-full max-w-md bg-[#1a1a1a] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats ? (
              <>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">Memory Usage</h3>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Used</span>
                    <span>
                      {(stats.memory.used / 1024 / 1024 / 1024).toFixed(2)} / {(stats.memory.total / 1024 / 1024 / 1024).toFixed(2)} GB
                    </span>
                  </div>
                  <Progress 
                    value={(stats.memory.used / stats.memory.total) * 100}
                    className="h-2 bg-black [&>div]:bg-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">CPU Usage</h3>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Total CPU</span>
                    <span>{stats.cpu.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={stats.cpu} 
                    className="h-2 bg-black [&>div]:bg-gray-400"
                  />
                </div>
              </>
            ) : (
              <p className="text-gray-400">Loading system stats...</p>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
} 