import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { format } from 'date-fns';

const ProjectDetails = () => {
    const { id } = useParams();
    const [project, setProject] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProject();
    }, [id]);

    const fetchProject = async () => {
        try {
            const res = await api.get(`/projects/${id}`);
            setProject(res.data);
        } catch (error) {
            console.error('Error fetching project', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!project) return <div>Project not found</div>;

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">{project.poNumber}</h1>
                    <p className="text-gray-500 text-lg">{project.firmName} - {project.mainEquipment}</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {project.projectClassification} Class
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        {project.statusCategory}
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    {['overview', 'documents', 'qap', 'inspections'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize
                                ${activeTab === tab
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                            `}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Project Details</h3>
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Field Unit</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{project.qaFieldUnit}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">OPA Name</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{project.opaName}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">JCQAO</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{project.jcqao?.name || 'Unassigned'}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">Engineer</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{project.engineer?.name || 'Unassigned'}</dd>
                                </div>
                            </dl>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Critical Dates</h3>
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">PO Date</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{format(new Date(project.poDate), 'dd MMM yyyy')}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">PO Expiry</dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-bold text-red-600">{format(new Date(project.poExpiryDate), 'dd MMM yyyy')}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Project Documents</h3>
                            {/* Upload Button Placeholder - Implement Modal later */}
                            <button className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700">Upload New</button>
                        </div>
                        {project.documents?.length === 0 ? (
                            <p className="text-gray-500">No documents uploaded.</p>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {project.documents.map((doc: any) => (
                                    <li key={doc.id} className="py-3 flex justify-between items-center">
                                        <div className="flex items-center">
                                            <svg className="h-5 w-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                                            </svg>
                                            <span className="text-sm font-medium text-gray-900">{doc.originalName}</span>
                                            <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                {doc.type}
                                            </span>
                                        </div>
                                        <a href="#" className="text-indigo-600 hover:text-indigo-900 text-sm">Download</a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {activeTab === 'qap' && (
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Quality Assurance Plan (QAP)</h3>
                        <div className="flex items-center mb-4">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${project.progressPercentage}%` }}></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700">{project.progressPercentage.toFixed(1)}%</span>
                        </div>

                        {project.qapSerials?.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded border border-dashed text-gray-500">
                                No QAP Uploaded yet. Go to Documents to upload a QAP Excel file.
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {project.qapSerials.map((serial: any) => (
                                        <tr key={serial.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{serial.serialNumber}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{serial.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${serial.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {serial.isCompleted ? 'Completed' : 'Pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'inspections' && (
                    <div className="text-center py-10 text-gray-500">
                        Inspection workflow coming soon...
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectDetails;
