'use client';

import Link from 'next/link';
import Image from 'next/image';
import Header from './components/Header';

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-black p-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Welcome to CUAir's IntSys Ground Station</h1>
          <p className="text-gray-300 text-xl">Select a system to monitor and control</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Link href="/obstacle-avoidance" className="transform hover:scale-105 transition-transform">
            <div className="bg-[#1a1a1a] rounded-lg shadow-lg p-6 border border-gray-800">
              <div className="relative h-48 mb-4">
                <Image
                  src="/images/obstacle-avoidance.jpg"
                  alt="Obstacle Avoidance"
                  fill
                  className="rounded-lg object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Obstacle Avoidance</h2>
              <p className="text-gray-400">Monitor and control obstacle detection systems</p>
            </div>
          </Link>

          <Link href="/warning-system" className="transform hover:scale-105 transition-transform">
            <div className="bg-[#1a1a1a] rounded-lg shadow-lg p-6 border border-gray-800">
              <div className="relative h-48 mb-4">
                <Image
                  src="/images/warning-system.jpg"
                  alt="Warning System"
                  fill
                  className="rounded-lg object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Warning System</h2>
              <p className="text-gray-400">View real-time alerts and system warnings</p>
            </div>
          </Link>

          <Link href="/system-status" className="transform hover:scale-105 transition-transform">
            <div className="bg-[#1a1a1a] rounded-lg shadow-lg p-6 border border-gray-800">
              <div className="relative h-48 mb-4">
                <Image
                  src="/images/system-status.jpg"
                  alt="System Status"
                  fill
                  className="rounded-lg object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">System Status</h2>
              <p className="text-gray-400">Check system health and performance metrics</p>
            </div>
          </Link>
        </div>
      </main>
    </>
  );
}