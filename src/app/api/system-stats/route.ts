import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  // Calculate CPU usage
  const cpus = os.cpus();
  const cpuUsage = cpus.reduce((acc, cpu) => {
    const total = Object.values(cpu.times).reduce((a, b) => a + b);
    const idle = cpu.times.idle;
    return acc + ((total - idle) / total) * 100;
  }, 0) / cpus.length;

  return NextResponse.json({
    memory: {
      total: totalMem,
      used: usedMem,
      free: freeMem,
    },
    cpu: cpuUsage,
  });
} 