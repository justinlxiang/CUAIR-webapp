import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  // Get individual CPU core usage
  const cpus = os.cpus();
  const cpuCores = cpus.map(cpu => {
    const total = Object.values(cpu.times).reduce((a, b) => a + b);
    const idle = cpu.times.idle;
    return ((total - idle) / total) * 100;
  });

  // Calculate average CPU usage
  const cpuUsage = cpuCores.reduce((acc, usage) => acc + usage, 0) / cpus.length;

  return NextResponse.json({
    memory: {
      total: totalMem,
      used: usedMem,
      free: freeMem,
    },
    cpu: cpuUsage,
    cpuCores: cpuCores,
    hostname: os.hostname(),
    platform: os.platform(),
    architecture: os.arch(),
  });
} 