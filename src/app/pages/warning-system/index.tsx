import OrientationChart from '../../components/TelemetryChart';
import Header from '../../components/Header';

export default function WarningSystem() {
    return (
        <>
            <Header />
            <main className="min-h-screen bg-black p-6">
                <h1 className="text-3xl font-bold mb-6 text-white">Warning System</h1>
                <div className="bg-[#1a1a1a] rounded-lg shadow-lg p-4 border border-gray-800">
                    <OrientationChart />
                </div>
            </main>
        </>
    );
}