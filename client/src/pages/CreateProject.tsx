import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const CreateProject = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [users, setUsers] = useState<any[]>([]);

    // Initial State
    const [formData, setFormData] = useState({
        qaFieldUnit: 'Mumbai',
        opaName: '',
        projectClassification: 'A',
        firmName: '',
        poNumber: '',
        poDate: '',
        poReceiptDate: '',
        poExpiryDate: '',
        mainEquipment: '',
        jcqaoId: '',
        engineerId: '',
    });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/users');
                setUsers(res.data);
            } catch (err) {
                console.error('Failed to fetch users', err);
            }
        };
        fetchUsers();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const dataToSend = {
                ...formData,
                jcqaoId: formData.jcqaoId ? Number(formData.jcqaoId) : undefined,
                engineerId: formData.engineerId ? Number(formData.engineerId) : undefined,
            };
            await api.post('/projects', dataToSend);
            navigate('/projects');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-slate-800 px-8 py-4">
                <h2 className="text-xl font-bold text-white">Create New Project</h2>
                <p className="text-slate-300 text-sm">Enter the initial PO details to register a project.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">QA Field Unit</label>
                        <select name="qaFieldUnit" value={formData.qaFieldUnit} onChange={handleChange} className="w-full border rounded-md p-2">
                            <option value="Mumbai">Mumbai</option>
                            <option value="Delhi">Delhi</option>
                            {/* Add more */}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">OPA Name</label>
                        <input type="text" name="opaName" required value={formData.opaName} onChange={handleChange} className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. NTPC" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Firm Name (Vendor)</label>
                        <input type="text" name="firmName" required value={formData.firmName} onChange={handleChange} className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. BHEL" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
                        <input type="text" name="poNumber" required value={formData.poNumber} onChange={handleChange} className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project Classification</label>
                        <select name="projectClassification" value={formData.projectClassification} onChange={handleChange} className="w-full border rounded-md p-2">
                            <option value="A">Class A</option>
                            <option value="B">Class B</option>
                            <option value="C">Class C</option>
                        </select>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Main Equipment</label>
                        <input type="text" name="mainEquipment" value={formData.mainEquipment} onChange={handleChange} className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Transformer" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PO Date</label>
                        <input type="date" name="poDate" required value={formData.poDate} onChange={handleChange} className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PO Receipt Date</label>
                        <input type="date" name="poReceiptDate" required value={formData.poReceiptDate} onChange={handleChange} className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PO Expiry Date</label>
                        <input type="date" name="poExpiryDate" required value={formData.poExpiryDate} onChange={handleChange} className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">Assign JCQAO</label>
                        <select name="jcqaoId" value={formData.jcqaoId} onChange={handleChange} className="w-full border rounded-md p-2 bg-blue-50/50">
                            <option value="">Select JCQAO</option>
                            {users.filter(u => u.role === 'JCQAO').map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">Assign Engineer</label>
                        <select name="engineerId" value={formData.engineerId} onChange={handleChange} className="w-full border rounded-md p-2 bg-blue-50/50">
                            <option value="">Select Engineer</option>
                            {users.filter(u => u.role === 'ENGINEER').map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="md:col-span-2 mt-4 pt-4 border-t flex justify-end gap-3">
                    <button type="button" onClick={() => navigate('/projects')} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">Cancel</button>
                    <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium shadow-sm disabled:opacity-50">
                        {loading ? 'Creating...' : 'Create Project'}
                    </button>
                </div>
                {error && <p className="md:col-span-2 text-red-500 text-center">{error}</p>}
            </form>
        </div>
    );
};

export default CreateProject;
