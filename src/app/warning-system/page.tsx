import TelemetryChart from '../components/TelemetryChart';
import Header from '../components/Header';
import styles from '../styles/Home.module.css';

export default function WarningSystem() {
    return (
        <>
            <Header />
            <main className={`bg-background ${styles.container}`}>
                <div className={styles.wrapper}>
                    <h1 className={`text-foreground text-center ${styles.title}`}>Warning System</h1>
                    <div className={`bg-card border-border ${styles.card}`}>
                        <div className={styles.cardContent}>
                            <TelemetryChart />
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}