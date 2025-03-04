'use client';

import Link from 'next/link';
import Image from 'next/image';
import Header from './components/Header';

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background p-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Welcome to CUAir&apos;s IntSys Ground Station</h1>
          <p className="text-muted-foreground text-xl">Select a system to monitor and control</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Link href="/obstacle-avoidance" className="transform hover:scale-105 transition-transform lg:col-start-1 group">
            <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
              <div className="relative h-48 mb-4">
                <Image
                  src="/images/obstacle-avoidance.jpg"
                  alt="Obstacle Avoidance"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="rounded-lg object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold text-card-foreground mb-2 flex items-center">
                Obstacle Avoidance
                <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span>
              </h2>
              <p className="text-muted-foreground">Monitor and control obstacle detection systems</p>
            </div>
          </Link>

          <Link href="/warning-system" className="transform hover:scale-105 transition-transform lg:col-start-2 group">
            <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
              <div className="relative h-48 mb-4">
                <Image
                  src="/images/warning-system.jpg"
                  alt="Warning System"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="rounded-lg object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold text-card-foreground mb-2 flex items-center">
                Warning System
                <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span>
              </h2>
              <p className="text-muted-foreground">View real-time alerts and system warnings</p>
            </div>
          </Link>

          <Link href="/mapping" className="transform hover:scale-105 transition-transform lg:col-start-3 lg:col-span-3 group">
            <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
              <div className="relative h-48 mb-4">
                <Image
                  src="/images/mapping_card.jpg"
                  alt="Mapping"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="rounded-lg object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold text-card-foreground mb-2 flex items-center">
                Mapping
                <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span>
              </h2>
              <p className="text-muted-foreground">View and control mapping operations</p>
            </div>
          </Link>

          <Link href="/system" className="transform hover:scale-105 transition-transform lg:col-start-2 group">
            <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
              <div className="relative h-48 mb-4">
                <Image
                  src="/images/system-status.jpg"
                  alt="System Status"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="rounded-lg object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold text-card-foreground mb-2 flex items-center">
                System Status
                <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">→</span>
              </h2>
              <p className="text-muted-foreground">Check system health and performance metrics</p>
            </div>
          </Link>
        </div>
      </main>
    </>
  );
}