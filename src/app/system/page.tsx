import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Header from '../components/Header';
import { GET } from '@/lib/system-stats/route';

export default async function System() {
  const response = await GET();
  const stats = await response.json();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background flex flex-col items-center p-6">
        <h1 className="text-3xl font-bold mb-6 text-foreground">System Status</h1>
        
        <Card className="w-full max-w-md bg-card border-border">
          <CardContent className="space-y-4">
            {stats ? (
              <>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-card-foreground mt-3">System Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <span>Hostname:</span>
                    <span>{stats.hostname}</span>
                    <span>Platform:</span>
                    <span>{stats.platform}</span>
                    <span>Architecture:</span>
                    <span>{stats.architecture}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-card-foreground">Memory Usage</h3>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Used</span>
                    <span>
                      {(stats.memory.used / 1024 / 1024 / 1024).toFixed(2)} / {(stats.memory.total / 1024 / 1024 / 1024).toFixed(2)} GB
                    </span>
                  </div>
                  <Progress 
                    value={(stats.memory.used / stats.memory.total) * 100}
                    className="h-2 bg-secondary [&>div]:bg-primary"
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-card-foreground">CPU Usage</h3>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Average CPU</span>
                    <span>{stats.cpu.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={stats.cpu} 
                    className="h-2 bg-secondary [&>div]:bg-primary"
                  />
                  
                  <div className="mt-2">
                    <h4 className="text-sm font-semibold text-card-foreground mb-2">CPU Cores</h4>
                    {stats.cpuCores.map((usage: number, index: number) => (
                      <div key={index} className="mb-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Core {index}</span>
                          <span>{usage.toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={usage} 
                          className="h-2 bg-secondary [&>div]:bg-primary"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Loading system stats...</p>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
} 