import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const Projects = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data);
        } catch (error) {
            console.error('Failed to fetch projects', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Red': return 'bg-red-100 text-red-800 border-red-200';
            case 'Orange': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'Green': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Projects...</div>;

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Projects</h1>
                    <p className="text-gray-500 mt-1">Manage and track all ongoing quality assurance projects.</p>
                </div>
                <Link to="/projects/create" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition duration-200 flex items-center font-medium">
                    <span className="mr-2">+</span> Create Project
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold tracking-wider">
                        <tr>
                            <th className="px-6 py-4 border-b">PO Number</th>
                            <th className="px-6 py-4 border-b">Firm Name</th>
                            <th className="px-6 py-4 border-b">Main Equipment</th>
                            <th className="px-6 py-4 border-b">Status</th>
                            <th className="px-6 py-4 border-b">Progress</th>
                            <th className="px-6 py-4 border-b">Assigned To</th>
                            <th className="px-6 py-4 border-b text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {projects.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                                    No projects found. Create one to get started.
                                </td>
                            </tr>
                        ) : (
                            projects.map((project) => (
                                <tr key={project.id} className="hover:bg-gray-50 transition duration-150">
                                    <td className="px-6 py-4 font-medium text-gray-900">{project.poNumber}</td>
                                    <td className="px-6 py-4 text-gray-600">{project.firmName}</td>
                                    <td className="px-6 py-4 text-gray-600 truncate max-w-xs">{project.mainEquipment}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.statusCategory)}`}>
                                            {project.statusCategory}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${project.progressPercentage}%` }}></div>
                                        </div>
                                        <span className="text-xs text-gray-500 mt-1 inline-block">{project.progressPercentage.toFixed(0)}%</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div className="flex flex-col">
                                            <span>JCQAO: <span className="font-medium text-gray-800">{project.jcqao?.name || 'Unassigned'}</span></span>
                                            <span>Eng: <span className="font-medium text-gray-800">{project.engineer?.name || 'Unassigned'}</span></span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link to={`/projects/${project.id}`} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                                            View Details
                                        </Link>
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

export default Projects;
