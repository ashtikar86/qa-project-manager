import { useEffect, useState } from 'react';
import api from '../api/axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

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
    engineerLoad: Array<{ name: string; value: number }>;
    opaStatusStats: Array<{ name: string; red: number; orange: number; green: number }>;
    engineerStatusStats: Array<{ name: string; red: number; orange: number; green: number }>;
    totalActive: number;
}

const Dashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedOpa, setSelectedOpa] = useState<string | null>(null);
    const [selectedEng, setSelectedEng] = useState<string | null>(null);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role !== 'ENGINEER';

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/dashboard/stats');
                setStats(response.data);
                if (response.data.opaStatusStats?.length > 0) {
                    setSelectedOpa(response.data.opaStatusStats[0].name);
                }
                if (response.data.engineerStatusStats?.length > 0) {
                    setSelectedEng(response.data.engineerStatusStats[0].name);
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    );
    if (!stats) return <div className="text-center mt-10 text-red-500">Failed to load stats.</div>;

    const statusData = [
        { name: 'Red (Expired)', value: stats.statusCounts.red, color: '#EF4444' },
        { name: 'Orange (Critical)', value: stats.statusCounts.orange, color: '#F59E0B' },
        { name: 'Green (On Track)', value: stats.statusCounts.green, color: '#10B981' },
    ];

    const getROGData = (item: any) => [
        { name: 'Red', value: item.red, color: '#EF4444' },
        { name: 'Orange', value: item.orange, color: '#F59E0B' },
        { name: 'Green', value: item.green, color: '#10B981' },
    ];

    const progressData = [
        { name: '< 5%', value: stats.progressDistribution.lessThan5, color: '#94A3B8' },
        { name: '5% - 20%', value: stats.progressDistribution.lessThan20 - stats.progressDistribution.lessThan5, color: '#CBD5E1' },
        { name: '60% - 80%', value: stats.progressDistribution.moreThan60 - stats.progressDistribution.moreThan80, color: '#3B82F6' },
        { name: '> 80%', value: stats.progressDistribution.moreThan80, color: '#1E40AF' },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Executive Dashboard</h1>

            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ring-1 ring-gray-200/5">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Projects</span>
                    <p className="text-4xl font-extrabold text-gray-900 mt-2">{stats.totalActive}</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Project Status Chart */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Global Status Categorization</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Progress Buckets Chart */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Execution Progress</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={progressData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {progressData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status by OPA */}
                {isAdmin && stats.opaStatusStats?.length > 0 && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Health by OPA</h3>
                            <select
                                className="text-sm border-gray-200 rounded-lg p-1 font-medium bg-gray-50 outline-none"
                                value={selectedOpa || ''}
                                onChange={(e) => setSelectedOpa(e.target.value)}
                            >
                                {stats.opaStatusStats.map(o => <option key={o.name} value={o.name}>{o.name}</option>)}
                            </select>
                        </div>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={getROGData(stats.opaStatusStats.find(o => o.name === selectedOpa) || { red: 0, orange: 0, green: 0 })}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {getROGData({}).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Status by Engineer */}
                {isAdmin && stats.engineerStatusStats?.length > 0 && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Health by Engineer</h3>
                            <select
                                className="text-sm border-gray-200 rounded-lg p-1 font-medium bg-gray-50 outline-none"
                                value={selectedEng || ''}
                                onChange={(e) => setSelectedEng(e.target.value)}
                            >
                                {stats.engineerStatusStats.map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
                            </select>
                        </div>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={getROGData(stats.engineerStatusStats.find(e => e.name === selectedEng) || { red: 0, orange: 0, green: 0 })}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {getROGData({}).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
