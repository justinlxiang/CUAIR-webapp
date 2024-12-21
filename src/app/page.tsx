import React from 'react';
import LidarPlot from './components/LidarPlot';
import { Card } from "@/components/ui/card";
import Header from './components/Header';
import styles from './styles/Home.module.css';

export default function Home() {
  return (
    <>
      <Header />
      <main className={styles.container}>
        <div className={styles.wrapper}>
          <h1 className={styles.title}>CUAIR Obstacle Avoidance</h1>
          <Card className={styles.card}>
            <div className={styles.cardContent}>
              <div className={styles.plotContainer}>
                <LidarPlot />
              </div>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}