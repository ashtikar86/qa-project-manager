import { useEffect, useState } from 'react';
import api from '../api/axios';
import { format } from 'date-fns';

const Inspections = () => {
    const [inspections, setInspections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');
    const [archiveFilter, setArchiveFilter] = useState<'ongoing' | 'archived'>('ongoing');

    useEffect(() => {
        fetchInspections();
    }, []);

    const fetchInspections = async () => {
        try {
            const res = await api.get('/inspections');
            setInspections(res.data);
        } catch (error) {
            console.error('Failed to fetch inspections', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredInspections = inspections
        .filter(i => (statusFilter === 'All' || i.status === statusFilter))
        .filter(i => (archiveFilter === 'archived' ? i.project?.isClosed : !i.project?.isClosed));

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Inspection Calls</h1>
                    <p className="text-gray-500 mt-1">Track and manage all quality assurance inspection requests.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                        <button
                            onClick={() => setArchiveFilter('ongoing')}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${archiveFilter === 'ongoing' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Ongoing
                        </button>
                        <button
                            onClick={() => setArchiveFilter('archived')}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${archiveFilter === 'archived' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Archived
                        </button>
                    </div>
                    <div className="h-8 w-px bg-gray-200"></div>
                    <div className="flex gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100">
                        {['All', 'Pending', 'Completed'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-1.5 rounded-md text-[10px] uppercase font-bold transition-all ${statusFilter === status
                                    ? 'bg-white text-blue-600 shadow-sm border border-gray-100'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold tracking-wider">
                        <tr>
                            <th className="px-6 py-4 border-b">Call No.</th>
                            <th className="px-6 py-4 border-b">Project (PO)</th>
                            <th className="px-6 py-4 border-b">Firm Name</th>
                            <th className="px-6 py-4 border-b">Call Date</th>
                            <th className="px-6 py-4 border-b">Insp. Date</th>
                            <th className="px-6 py-4 border-b text-center">Status</th>
                            <th className="px-6 py-4 border-b text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredInspections.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                                    No inspection calls found matching the criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredInspections.map((call) => (
                                <tr key={call.id} className="hover:bg-gray-50/50 transition duration-150">
                                    <td className="px-6 py-4 font-bold text-blue-600">{call.callNumber}</td>
                                    <td className="px-6 py-4 text-gray-900 font-medium">{call.project?.poNumber}</td>
                                    <td className="px-6 py-4 text-gray-600">{call.project?.firmName}</td>
                                    <td className="px-6 py-4 text-gray-600 text-sm">
                                        {format(new Date(call.callDate), 'dd MMM yyyy')}
                                    </td>
                                    <td className="px-6 py-4 text-gray-900 font-semibold text-sm">
                                        {format(new Date(call.inspectionDate), 'dd MMM yyyy')}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${call.status === 'Completed'
                                            ? 'bg-green-50 text-green-700 border-green-200'
                                            : 'bg-orange-50 text-orange-700 border-orange-200'
                                            }`}>
                                            {call.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <a href={`/projects/${call.projectId}?tab=inspections`} className="text-blue-600 hover:text-blue-800 font-bold text-sm">
                                            View Details
                                        </a>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Inspections;
