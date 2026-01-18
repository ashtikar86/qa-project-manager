import { useEffect, useState } from 'react';
import api from '../api/axios';

interface DashboardStats {
    statusCounts: {
        red: number;
        orange: number;
        green: number;
    };
    progressDistribution: {
        lessThan5: number;
        lessThan20: number;
        moreThan60: number;
        moreThan80: number;
    };
    totalActive: number;
}

const Dashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/dashboard/stats');
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div className="text-center mt-10">Loading Dashboard...</div>;
    if (!stats) return <div className="text-center mt-10 text-red-500">Failed to load stats.</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Project Overview</h1>

            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                    <h3 className="text-gray-500 text-sm font-medium">Total Active Projects</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalActive}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                    <h3 className="text-gray-500 text-sm font-medium">On Track (Green)</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.statusCounts.green}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
                    <h3 className="text-gray-500 text-sm font-medium">Nearing Expiry (Orange)</h3>
                    <p className="text-3xl font-bold text-orange-500 mt-2">{stats.statusCounts.orange}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
                    <h3 className="text-gray-500 text-sm font-medium">Critical/Expired (Red)</h3>
                    <p className="text-3xl font-bold text-red-600 mt-2">{stats.statusCounts.red}</p>
                </div>
            </div>

            {/* Progress Distribution */}
            <h2 className="text-xl font-bold mb-4 text-gray-700">Progress Distribution</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-4 rounded shadow">
                    <span className="block text-gray-500 text-xs uppercase font-bold">Progress &lt; 5%</span>
                    <div className="mt-2 flex items-end justify-between">
                        <span className="text-2xl font-bold">{stats.progressDistribution.lessThan5}</span>
                        <div className="h-2 w-full ml-4 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-red-400" style={{ width: `${(stats.progressDistribution.lessThan5 / stats.totalActive) * 100}%` }}></div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                    <span className="block text-gray-500 text-xs uppercase font-bold">Progress &lt; 20%</span>
                    <div className="mt-2 flex items-end justify-between">
                        <span className="text-2xl font-bold">{stats.progressDistribution.lessThan20}</span>
                        <div className="h-2 w-full ml-4 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-400" style={{ width: `${(stats.progressDistribution.lessThan20 / stats.totalActive) * 100}%` }}></div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                    <span className="block text-gray-500 text-xs uppercase font-bold">Progress &gt; 60%</span>
                    <div className="mt-2 flex items-end justify-between">
                        <span className="text-2xl font-bold">{stats.progressDistribution.moreThan60}</span>
                        <div className="h-2 w-full ml-4 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400" style={{ width: `${(stats.progressDistribution.moreThan60 / stats.totalActive) * 100}%` }}></div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                    <span className="block text-gray-500 text-xs uppercase font-bold">Progress &gt; 80%</span>
                    <div className="mt-2 flex items-end justify-between">
                        <span className="text-2xl font-bold">{stats.progressDistribution.moreThan80}</span>
                        <div className="h-2 w-full ml-4 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${(stats.progressDistribution.moreThan80 / stats.totalActive) * 100}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
