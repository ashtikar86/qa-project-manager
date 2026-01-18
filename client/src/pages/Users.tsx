import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const Users = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // New User State
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        designation: '',
        role: 'ENGINEER',
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/users', formData);
            setShowModal(false);
            setFormData({ username: '', password: '', name: '', designation: '', role: 'ENGINEER' });
            fetchUsers();
        } catch (error) {
            alert('Error creating user');
        }
    };

    if (loading) return <div>Loading Users...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
                <button onClick={() => setShowModal(true)} className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700">
                    Add New User
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Name</th>
                            <th className="p-4 font-semibold text-gray-600">Username</th>
                            <th className="p-4 font-semibold text-gray-600">Designation</th>
                            <th className="p-4 font-semibold text-gray-600">Role</th>
                            <th className="p-4 font-semibold text-gray-600">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="p-4">{user.name}</td>
                                <td className="p-4 text-gray-500">{user.username}</td>
                                <td className="p-4 text-gray-500">{user.designation}</td>
                                <td className="p-4">
                                    <span className="px-2 py-1 text-xs font-bold rounded bg-blue-100 text-blue-800">{user.role}</span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs rounded ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add User</h2>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <input className="w-full border p-2 rounded" placeholder="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            <input className="w-full border p-2 rounded" placeholder="Username" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
                            <input className="w-full border p-2 rounded" type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                            <input className="w-full border p-2 rounded" placeholder="Designation" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} required />
                            <select className="w-full border p-2 rounded" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                <option value="ENGINEER">ENGINEER</option>
                                <option value="JCQAO">JCQAO</option>
                                <option value="DDG">DDG</option>
                                <option value="ADMIN">ADMIN</option>
                                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                            </select>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
