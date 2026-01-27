import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { format } from 'date-fns';
import DocumentUploadModal from '../components/DocumentUploadModal';
import JIRCompletionModal from '../components/JIRCompletionModal';

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState<any>(null);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'DDG';
    const isEngineer = user.role === 'ENGINEER' && project?.engineerId === user.id;
    const canEdit = isAdmin || isEngineer;

    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>({});

    const [newSerial, setNewSerial] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [qapLoading, setQapLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [newLineItem, setNewLineItem] = useState({ description: '', quantity: 1 });

    // New inspection states
    const [isAddingInspection, setIsAddingInspection] = useState(false);
    const [newInspection, setNewInspection] = useState({
        callNumber: '',
        callDate: format(new Date(), 'yyyy-MM-dd'),
        inspectionDate: format(new Date(), 'yyyy-MM-dd'),
        location: ''
    });

    const [selectedInspectionId, setSelectedInspectionId] = useState<number | null>(null);
    const [isJIRModalOpen, setIsJIRModalOpen] = useState(false);

    useEffect(() => {
        fetchProject();
        if (isAdmin) fetchUsers();
    }, [id]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching users', error);
        }
    };

    const fetchProject = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/projects/${id}`);
            setProject(res.data);
        } catch (error) {
            console.error('Error fetching project', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditToggle = () => {
        if (!isEditing) {
            setEditData({ ...project });
        }
        setIsEditing(!isEditing);
    };

    const handleSave = async () => {
        try {
            await api.put(`/projects/${id}`, editData);
            fetchProject();
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving project', error);
        }
    };

    const handleCloseProject = async () => {
        if (!window.confirm('Approve this project for closure? This will allow the Engineer to generate the final report.')) return;
        try {
            await api.put(`/projects/${id}/close`);
            fetchProject();
        } catch (error) {
            console.error('Error approving closure', error);
        }
    };

    const handleRequestClosure = async () => {
        const remarks = window.prompt('Enter closure request remarks:');
        if (remarks === null) return;
        try {
            await api.put(`/projects/${id}/request-closure`, { remarks });
            alert('Closure request sent to Admin.');
            fetchProject();
        } catch (error) {
            console.error('Error requesting closure', error);
        }
    };

    const handleReopenProject = async () => {
        if (!window.confirm('Are you sure you want to reopen this project?')) return;
        try {
            await api.put(`/projects/${id}/reopen`);
            fetchProject();
        } catch (error) {
            console.error('Error reopening project', error);
        }
    };

    const handleGenerateReport = async () => {
        if (!window.confirm('Generating the final report will ARCHIVE this project and remove it from your active list. Proceed?')) return;
        try {
            const res = await api.post(`/reports/project/${id}`);
            alert('Closure report generated successfully and project archived.');
            // Try to open the report
            window.open(`/${res.data.path}`, '_blank');
            navigate('/projects');
        } catch (error: any) {
            console.error('Error generating report', error);
            const msg = error.response?.data?.message || error.message || 'Unknown error';
            alert(`Failed to generate closure report: ${msg}`);
        }
    };

    const handleAddSerial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSerial || !newDescription) return;
        setQapLoading(true);
        try {
            await api.post('/qap', {
                projectId: Number(id),
                serialNumber: newSerial,
                description: newDescription
            });
            setNewSerial('');
            setNewDescription('');
            fetchProject();
        } catch (error) {
            console.error('Error adding QAP serial', error);
        } finally {
            setQapLoading(false);
        }
    };

    const handleAddLineItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLineItem.description || !newLineItem.quantity) return;
        try {
            await api.post(`/projects/${id}/line-items`, newLineItem);
            setNewLineItem({ description: '', quantity: 1 });
            fetchProject();
        } catch (error) {
            console.error('Error adding line item', error);
        }
    };

    const handleDeleteLineItem = async (lineItemId: number) => {
        if (!window.confirm('Delete this line item?')) return;
        try {
            await api.delete(`/projects/line-items/${lineItemId}`);
            fetchProject();
        } catch (error) {
            console.error('Error deleting line item', error);
        }
    };

    const handleDeleteSerial = async (serialId: number) => {
        if (!window.confirm('Are you sure you want to delete this QAP section?')) return;
        try {
            await api.delete(`/qap/${serialId}`);
            fetchProject();
        } catch (error) {
            console.error('Error deleting QAP serial', error);
        }
    };

    const handleToggleSerial = async (serialId: number, currentStatus: boolean) => {
        try {
            await api.put(`/qap/${serialId}`, {
                isCompleted: !currentStatus
            });
            fetchProject();
        } catch (error) {
            console.error('Error toggling QAP serial', error);
        }
    };

    const handleAddInspection = async (e: React.FormEvent) => {
        e.preventDefault();
        const callFileInput = document.getElementById('new-call-doc') as HTMLInputElement;
        const file = callFileInput?.files?.[0];

        if (!file && !window.confirm('No Inspection Call letter attached. Do you want to proceed without it?')) {
            return;
        }

        const formData = new FormData();
        formData.append('projectId', id!);
        formData.append('callNumber', newInspection.callNumber);
        formData.append('callDate', newInspection.callDate);
        formData.append('inspectionDate', newInspection.inspectionDate);
        formData.append('location', newInspection.location);
        if (file) formData.append('callDocument', file);

        try {
            await api.post('/inspections', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setIsAddingInspection(false);
            setNewInspection({
                callNumber: '',
                callDate: format(new Date(), 'yyyy-MM-dd'),
                inspectionDate: format(new Date(), 'yyyy-MM-dd'),
                location: ''
            });
            fetchProject();
        } catch (error: any) {
            console.error('Error adding inspection call', error);
            alert(error.response?.data?.message || 'Failed to add inspection call. Please check for scheduling conflicts.');
        }
    };

    const handleUpdateInspectionStatus = (inspectionId: number) => {
        setSelectedInspectionId(inspectionId);
        setIsJIRModalOpen(true);
    };

    const DocumentCard = ({ doc }: { doc: any }) => (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between">
                <div className="flex gap-3">
                    <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                        <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                        <h5 className="text-sm font-bold text-gray-900 truncate max-w-[140px]" title={doc.originalName}>{doc.originalName}</h5>
                        <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-tighter mt-1">{doc.type.replace('_', ' ')} • {format(new Date(doc.uploadedAt), 'dd MMM')}</p>
                    </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => window.open(`/${doc.path}`, '_blank')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100" title="View">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                    <a href={`/${doc.path}`} download={doc.originalName} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100" title="Download">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </a>
                </div>
            </div>
        </div>
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    );
    if (!project) return <div className="p-8 text-center text-red-500 font-bold">Project not found</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-start">
                <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${project.isClosed ? 'bg-slate-400 text-white' :
                        project.statusCategory === 'Red' ? 'bg-red-500 text-white' :
                            project.statusCategory === 'Orange' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
                        }`}>
                        {project.isClosed ? (
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                        ) : (
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                            {project.poNumber}
                            {project.isClosed ? (
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-tighter border border-slate-200">Archived</span>
                            ) : project.isClosureApproved ? (
                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-tighter border border-green-200 animate-pulse">Ready for Closure</span>
                            ) : project.isClosureRequested ? (
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-tighter border border-blue-200">Closure Requested</span>
                            ) : (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-tighter border ${project.statusCategory === 'Red' ? 'bg-red-50 text-red-600 border-red-100' :
                                    project.statusCategory === 'Orange' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                        'bg-green-50 text-green-600 border-green-100'
                                    }`}>{project.statusCategory} Status</span>
                            )}
                        </h1>
                        <p className="text-gray-500 font-medium">{project.firmName} — {project.mainEquipment}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {canEdit && (
                        <button
                            onClick={isEditing ? handleSave : handleEditToggle}
                            className={`px-4 py-2 rounded-lg font-bold transition-all shadow-md active:scale-95 ${isEditing ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            {isEditing ? 'Save Changes' : 'Edit Project'}
                        </button>
                    )}
                    {isEditing && (
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200">Cancel</button>
                    )}
                    {isAdmin && !project.isClosed && (
                        <button
                            onClick={handleCloseProject}
                            className={`px-4 py-2 rounded-lg font-bold transition-all border flex items-center gap-2 ${project.isClosureRequested ? 'bg-orange-600 text-white hover:bg-orange-700' :
                                project.isClosureApproved ? 'bg-green-50 text-green-700 border-green-200' :
                                    'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            {project.isClosureApproved ? 'Approved for Closure' : project.isClosureRequested ? 'Approve Closure' : 'Close Project'}
                        </button>
                    )}
                    {((isEngineer && project.isClosureApproved && !project.isClosed) || isAdmin) && (
                        <button
                            onClick={handleGenerateReport}
                            className={`px-4 py-2 rounded-lg font-bold transition-all shadow-lg flex items-center gap-2 ${project.isClosed ? 'bg-slate-600 text-white hover:bg-slate-700' : 'bg-indigo-600 text-white hover:bg-indigo-700 animate-bounce'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            {project.isClosed ? 'Regenerate Report' : 'Generate Closure Report'}
                        </button>
                    )}
                    {isEngineer && !project.isClosed && !project.isClosureRequested && (
                        <button
                            onClick={handleRequestClosure}
                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100 transition-all border border-blue-100 flex items-center gap-2"
                        >
                            Request Closure
                        </button>
                    )}
                    {isAdmin && project.isClosed && (
                        <button
                            onClick={handleReopenProject}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all shadow-md flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            Reopen Project
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-200/50 p-1 rounded-xl w-fit">
                {['overview', 'documents', 'qap', 'inspections'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`
                            px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all
                            ${activeTab === tab
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'}
                        `}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content Container */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Unified High-Density Tabular View (Fields a-v) */}
                        <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-sm">
                            <table className="w-full text-sm border-collapse">
                                <thead className="bg-[#1e293b] text-white">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-bold uppercase tracking-wider w-1/3">Project Attribute</th>
                                        <th className="px-6 py-4 text-left font-bold uppercase tracking-wider">Current Information / Edit</th>
                                        <th className="px-6 py-4 text-center font-bold uppercase tracking-wider w-32">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 font-medium">
                                    {/* a-c: Fixed Info */}
                                    <tr className="bg-gray-50/30">
                                        <td className="px-6 py-4 text-gray-400 font-bold uppercase text-[10px]">QA Field Unit</td>
                                        <td className="px-6 py-4 text-gray-900">{project.qaFieldUnit}</td>
                                        <td></td>
                                    </tr>
                                    <tr className="bg-white">
                                        <td className="px-6 py-4 text-gray-400 font-bold uppercase text-[10px]">Name of OPA</td>
                                        <td className="px-6 py-4 text-gray-900">{project.opaName}</td>
                                        <td></td>
                                    </tr>
                                    <tr className="bg-gray-50/30">
                                        <td className="px-6 py-4 text-gray-400 font-bold uppercase text-[10px]">Project Classification (Manual)</td>
                                        <td className="px-6 py-4">
                                            {isEditing && isAdmin ? (
                                                <input
                                                    value={editData.projectClassification || ''}
                                                    onChange={(e) => setEditData({ ...editData, projectClassification: e.target.value })}
                                                    className="w-full border rounded p-1.5 focus:ring-1"
                                                    placeholder="e.g. A, B, C or Special"
                                                />
                                            ) : <span className="text-gray-900">{project.projectClassification}</span>}
                                        </td>
                                        <td></td>
                                    </tr>

                                    {/* Assignment Fields (Crucial for Admin) */}
                                    <tr className="bg-white">
                                        <td className="px-6 py-4 text-gray-400 font-bold uppercase text-[10px]">Assigned JCQAO</td>
                                        <td className="px-6 py-4">
                                            {isEditing && isAdmin ? (
                                                <select
                                                    value={editData.jcqaoId || ''}
                                                    onChange={(e) => setEditData({ ...editData, jcqaoId: e.target.value ? Number(e.target.value) : null })}
                                                    className="w-full border rounded p-1.5 text-sm bg-blue-50/50"
                                                >
                                                    <option value="">Select JCQAO</option>
                                                    {users.filter(u => u.role === 'JCQAO').map(u => (
                                                        <option key={u.id} value={u.id}>{u.name}</option>
                                                    ))}
                                                </select>
                                            ) : <span className="text-gray-900">{project.jcqao?.name || 'Unassigned'}</span>}
                                        </td>
                                        <td></td>
                                    </tr>
                                    <tr className="bg-gray-50/30">
                                        <td className="px-6 py-4 text-gray-400 font-bold uppercase text-[10px]">Assigned Engineer</td>
                                        <td className="px-6 py-4">
                                            {isEditing && isAdmin ? (
                                                <select
                                                    value={editData.engineerId || ''}
                                                    onChange={(e) => setEditData({ ...editData, engineerId: e.target.value ? Number(e.target.value) : null })}
                                                    className="w-full border rounded p-1.5 text-sm bg-blue-50/50"
                                                >
                                                    <option value="">Select Engineer</option>
                                                    {users.filter(u => u.role === 'ENGINEER').map(u => (
                                                        <option key={u.id} value={u.id}>{u.name}</option>
                                                    ))}
                                                </select>
                                            ) : <span className="text-gray-900">{project.engineer?.name || 'Unassigned'}</span>}
                                        </td>
                                        <td></td>
                                    </tr>

                                    {/* d-e: Editable PO Info */}
                                    <tr className="bg-white">
                                        <td className="px-6 py-4 text-gray-400 font-bold uppercase text-[10px]">Firm Name (Editable)</td>
                                        <td className="px-6 py-4">
                                            {isEditing && isAdmin ? (
                                                <input value={editData.firmName || ''} onChange={(e) => setEditData({ ...editData, firmName: e.target.value })} className="w-full border rounded p-1.5 focus:ring-1" />
                                            ) : <span className="text-gray-900">{project.firmName}</span>}
                                        </td>
                                        <td></td>
                                    </tr>
                                    <tr className="bg-gray-50/30">
                                        <td className="px-6 py-4 text-gray-400 font-bold uppercase text-[10px]">PO Number (Editable)</td>
                                        <td className="px-6 py-4">
                                            {isEditing && isAdmin ? (
                                                <input value={editData.poNumber || ''} onChange={(e) => setEditData({ ...editData, poNumber: e.target.value })} className="w-full border rounded p-1.5 focus:ring-1" />
                                            ) : <span className="text-blue-600 font-bold">{project.poNumber}</span>}
                                        </td>
                                        <td className="text-center">
                                            {project.documents?.find((d: any) => d.type === 'PO') && (
                                                <button onClick={() => window.open(`/${project.documents.find((d: any) => d.type === 'PO').path}`, '_blank')} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded" title="View PO">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                </button>
                                            )}
                                        </td>
                                    </tr>

                                    {/* f-h: PO Dates */}
                                    <tr className="bg-white">
                                        <td className="px-6 py-4 text-gray-400 font-bold uppercase text-[10px]">PO Date</td>
                                        <td className="px-6 py-4 text-gray-900">{format(new Date(project.poDate), 'dd MMM yyyy')}</td>
                                        <td></td>
                                    </tr>
                                    <tr className="bg-gray-50/30">
                                        <td className="px-6 py-4 text-gray-400 font-bold uppercase text-[10px]">PO Receipt Date</td>
                                        <td className="px-6 py-4 text-gray-900">{format(new Date(project.poReceiptDate), 'dd MMM yyyy')}</td>
                                        <td></td>
                                    </tr>
                                    <tr className="bg-white">
                                        <td className="px-6 py-4 text-gray-400 font-bold uppercase text-[10px]">PO Expiry Date</td>
                                        <td className="px-6 py-4 text-gray-900">{format(new Date(project.poExpiryDate), 'dd MMM yyyy')}</td>
                                        <td></td>
                                    </tr>

                                    {/* i-m: Execution Basics */}
                                    <tr className="bg-gray-50/30">
                                        <td className="px-6 py-4 text-gray-400 font-bold uppercase text-[10px]">Main Equipment (Editable)</td>
                                        <td className="px-6 py-4">
                                            {isEditing && canEdit ? (
                                                <input value={editData.mainEquipment || ''} onChange={(e) => setEditData({ ...editData, mainEquipment: e.target.value })} className="w-full border rounded p-1.5" />
                                            ) : <span className="text-gray-900 font-bold">{project.mainEquipment}</span>}
                                        </td>
                                        <td></td>
                                    </tr>
                                    <tr className="bg-white">
                                        <td className="px-6 py-4 text-gray-400 font-bold uppercase text-[10px]">Line Items (Editable)</td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                {project.lineItems?.map((li: any) => (
                                                    <div key={li.id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-xs border border-gray-100">
                                                        <span><span className="font-bold text-gray-400 mr-2">{li.quantity}x</span> {li.description}</span>
                                                        {isEditing && canEdit && (
                                                            <button onClick={() => handleDeleteLineItem(li.id)} className="text-red-400 hover:text-red-600">×</button>
                                                        )}
                                                    </div>
                                                ))}
                                                {isEditing && canEdit && (
                                                    <div className="flex gap-2 items-center pt-2">
                                                        <input type="text" placeholder="Desc" value={newLineItem.description} onChange={e => setNewLineItem({ ...newLineItem, description: e.target.value })} className="flex-1 border rounded p-1 text-xs" />
                                                        <input type="number" value={newLineItem.quantity} onChange={e => setNewLineItem({ ...newLineItem, quantity: Number(e.target.value) })} className="w-12 border rounded p-1 text-xs" />
                                                        <button onClick={handleAddLineItem} className="p-1 bg-blue-600 text-white rounded">+</button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td></td>
                                    </tr>
                                    <tr className="bg-gray-50/30">
                                        <td className="px-6 py-4 text-gray-400 font-bold uppercase text-[10px]">Order Value (Editable)</td>
                                        <td className="px-6 py-4">
                                            {isEditing && canEdit ? (
                                                <input type="number" value={editData.orderValue || ''} onChange={(e) => setEditData({ ...editData, orderValue: Number(e.target.value) })} className="w-full border rounded p-1.5" />
                                            ) : <span className="text-gray-900 font-bold">₹ {project.orderValue?.toLocaleString()}</span>}
                                        </td>
                                        <td></td>
                                    </tr>

                                    {/* n-q: Milestones */}
                                    <tr className="bg-white">
                                        <td className="px-6 py-4 text-gray-400 font-bold uppercase text-[10px]">FCL Date</td>
                                        <td className="px-6 py-4">
                                            {isEditing && canEdit ? (
                                                <input type="date" value={editData.fclDate ? format(new Date(editData.fclDate), 'yyyy-MM-dd') : ''} onChange={(e) => setEditData({ ...editData, fclDate: e.target.value })} className="border rounded p-1" />
                                            ) : <span className="text-gray-900">{project.fclDate ? format(new Date(project.fclDate), 'dd MMM yyyy') : '--'}</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => setIsUploadModalOpen(true)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Upload FCL">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                </button>
                                                {project.documents?.find((d: any) => d.type === 'FCL') && (
                                                    <button onClick={() => window.open(`/${project.documents.find((d: any) => d.type === 'FCL').path}`, '_blank')} className="p-1.5 text-gray-500 hover:bg-gray-50 rounded">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    <tr className="bg-gray-50/30">
                                        <td className="px-6 py-4 text-gray-400 font-bold uppercase text-[10px]">FCM Date</td>
                                        <td className="px-6 py-4">
                                            {isEditing && canEdit ? (
                                                <input type="date" value={editData.fcmDate ? format(new Date(editData.fcmDate), 'yyyy-MM-dd') : ''} onChange={(e) => setEditData({ ...editData, fcmDate: e.target.value })} className="border rounded p-1" />
                                            ) : <span className="text-gray-900">{project.fcmDate ? format(new Date(project.fcmDate), 'dd MMM yyyy') : '--'}</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => setIsUploadModalOpen(true)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Upload FCM">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr className="bg-white">
                                        <td className="px-6 py-4 text-gray-400 font-bold uppercase text-[10px]">Drawing Approval</td>
                                        <td className="px-6 py-4">
                                            {isEditing && canEdit ? (
                                                <input type="date" value={editData.drawingApprovalDate ? format(new Date(editData.drawingApprovalDate), 'yyyy-MM-dd') : ''} onChange={(e) => setEditData({ ...editData, drawingApprovalDate: e.target.value })} className="border rounded p-1" />
                                            ) : <span className="text-gray-900">{project.drawingApprovalDate ? format(new Date(project.drawingApprovalDate), 'dd MMM yyyy') : '--'}</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => setIsUploadModalOpen(true)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Upload Drawings">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                    <tr className="bg-gray-50/30">
                                        <td className="px-6 py-4 text-gray-400 font-bold uppercase text-[10px]">QAP Approval Date</td>
                                        <td className="px-6 py-4">
                                            {isEditing && canEdit ? (
                                                <input type="date" value={editData.qapApprovalDate ? format(new Date(editData.qapApprovalDate), 'yyyy-MM-dd') : ''} onChange={(e) => setEditData({ ...editData, qapApprovalDate: e.target.value })} className="border rounded p-1" />
                                            ) : <span className="text-gray-900">{project.qapApprovalDate ? format(new Date(project.qapApprovalDate), 'dd MMM yyyy') : '--'}</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => setIsUploadModalOpen(true)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Upload QAP">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                            </button>
                                        </td>
                                    </tr>

                                    <tr className="bg-white">
                                        <td className="px-6 py-4 text-gray-400 font-bold uppercase text-[10px]">DP Extension Date</td>
                                        <td className="px-6 py-4">
                                            {isEditing && canEdit ? (
                                                <input type="date" value={editData.dpExtensionDate ? format(new Date(editData.dpExtensionDate), 'yyyy-MM-dd') : ''} onChange={(e) => setEditData({ ...editData, dpExtensionDate: e.target.value })} className="border rounded p-1" />
                                            ) : <div className="text-gray-900">
                                                {project.dpExtensionDate ? format(new Date(project.dpExtensionDate), 'dd MMM yyyy') : 'No Extension'}
                                                {project.history?.some((h: any) => h.fieldName === 'dpExtensionDate') && (
                                                    <span className="text-[10px] text-orange-500 font-bold ml-2">(Date Revised)</span>
                                                )}
                                            </div>}
                                        </td>
                                        <td></td>
                                    </tr>
                                    <tr className="bg-gray-50/30">
                                        <td className="px-6 py-4 text-gray-400 font-bold uppercase text-[10px]">Inspection Calls</td>
                                        <td className="px-6 py-4 text-gray-900">
                                            {project.inspectionCalls?.length || 0} Calls Recorded
                                        </td>
                                        <td className="text-center">
                                            <button onClick={() => setActiveTab('inspections')} className="text-xs font-bold text-blue-600 hover:underline">Manage</button>
                                        </td>
                                    </tr>
                                    <tr className="bg-white">
                                        <td className="px-6 py-4 text-gray-400 font-bold uppercase text-[10px]">Present Status (Retention)</td>
                                        <td className="px-6 py-4">
                                            {isEditing && canEdit ? (
                                                <textarea value={editData.presentStatus || ''} onChange={(e) => setEditData({ ...editData, presentStatus: e.target.value })} className="w-full border rounded p-2 text-xs" rows={2} />
                                            ) : <div className="text-gray-900 border-l-4 border-blue-500 pl-3 leading-relaxed whitespace-pre-wrap">{project.presentStatus || '--'}</div>}
                                        </td>
                                        <td></td>
                                    </tr>
                                    <tr className="bg-gray-50/30">
                                        <td className="px-6 py-4 text-gray-400 font-bold uppercase text-[10px]">Remarks (Retention)</td>
                                        <td className="px-6 py-4">
                                            {isEditing && canEdit ? (
                                                <textarea value={editData.remarks || ''} onChange={(e) => setEditData({ ...editData, remarks: e.target.value })} className="w-full border rounded p-2 text-xs" rows={2} />
                                            ) : <div className="text-gray-600 italic whitespace-pre-wrap text-sm">{project.remarks || '--'}</div>}
                                        </td>
                                        <td></td>
                                    </tr>
                                    <tr className="bg-white">
                                        <td className="px-6 py-4 text-gray-400 font-bold uppercase text-[10px]">Form IV Date</td>
                                        <td className="px-6 py-4">
                                            {isEditing && canEdit ? (
                                                <input type="date" value={editData.formIVIssuanceDate ? format(new Date(editData.formIVIssuanceDate), 'yyyy-MM-dd') : ''} onChange={(e) => setEditData({ ...editData, formIVIssuanceDate: e.target.value })} className="border rounded p-1" />
                                            ) : <span className="text-gray-900">{project.formIVIssuanceDate ? format(new Date(project.formIVIssuanceDate), 'dd MMM yyyy') : '--'}</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => setIsUploadModalOpen(true)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Upload Form IV">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Recent History Subsection */}
                        {project.history?.length > 0 && (
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
                                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-4">Retention Audit Log</h4>
                                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                                    {project.history.map((h: any) => (
                                        <div key={h.id} className="flex gap-4 items-start text-xs border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                                            <span className="font-mono text-slate-400 shrink-0">{format(new Date(h.changedAt), 'dd-MM HH:mm')}</span>
                                            <div className="flex-1">
                                                <span className="font-bold text-slate-600 capitalize mr-2">{h.fieldName.replace(/([A-Z])/g, ' $1')}:</span>
                                                <span className="text-slate-500">{h.value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                            <div>
                                <h3 className="text-xl font-extrabold text-gray-800 tracking-tight">Project Documentation</h3>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Managed Repository</p>
                            </div>
                            <button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Upload Document
                            </button>
                        </div>

                        {project.documents?.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <svg className="h-8 w-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                </div>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No documents uploaded yet</p>
                            </div>
                        ) : (
                            <div className="grid gap-8">
                                {/* Drawings Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </div>
                                        <h4 className="text-sm font-extrabold text-gray-700 uppercase tracking-widest">Drawings Folder</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {project.documents.filter((d: any) => d.type === 'DRAWING').map((doc: any) => (
                                            <DocumentCard key={doc.id} doc={doc} />
                                        ))}
                                        {project.documents.filter((d: any) => d.type === 'DRAWING').length === 0 && (
                                            <p className="text-xs text-gray-400 italic">No drawings in this section.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Test Reports Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                        </div>
                                        <h4 className="text-sm font-extrabold text-gray-700 uppercase tracking-widest">Test Reports Folder</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {project.documents.filter((d: any) => d.type === 'TEST_REPORT' || d.type === 'FAT_TRIAL').map((doc: any) => (
                                            <DocumentCard key={doc.id} doc={doc} />
                                        ))}
                                        {project.documents.filter((d: any) => d.type === 'TEST_REPORT' || d.type === 'FAT_TRIAL').length === 0 && (
                                            <p className="text-xs text-gray-400 italic">No test reports in this section.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Others Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9l-2-2H5a2 2 0 01-2 2v10a2 2 0 012 2z" /></svg>
                                        </div>
                                        <h4 className="text-sm font-extrabold text-gray-700 uppercase tracking-widest">General Project Documents</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {project.documents.filter((d: any) => d.type !== 'DRAWING' && d.type !== 'TEST_REPORT' && d.type !== 'FAT_TRIAL').map((doc: any) => (
                                            <DocumentCard key={doc.id} doc={doc} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'qap' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">Quality Assurance Plan (QAP)</h3>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Progress</span>
                                <div className="w-48 bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200 shadow-inner">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500"
                                        style={{ width: `${project.progressPercentage}%` }}
                                    ></div>
                                </div>
                                <span className="text-sm font-extrabold text-blue-600 min-w-[3rem]">{project.progressPercentage.toFixed(1)}%</span>
                            </div>
                        </div>

                        {/* Add Section Form (Admin only) */}
                        {isAdmin && (
                            <form onSubmit={handleAddSerial} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex gap-4 items-end">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Serial No</label>
                                    <input
                                        type="text"
                                        value={newSerial}
                                        onChange={(e) => setNewSerial(e.target.value)}
                                        placeholder="e.g. 1.1"
                                        className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="flex-[3]">
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Description</label>
                                    <input
                                        type="text"
                                        value={newDescription}
                                        onChange={(e) => setNewDescription(e.target.value)}
                                        placeholder="Enter activity description..."
                                        className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={qapLoading || !newSerial || !newDescription}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md active:scale-95 whitespace-nowrap"
                                >
                                    {qapLoading ? 'Adding...' : 'Add Section'}
                                </button>
                            </form>
                        )}

                        {project.qapSerials?.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <p className="text-gray-400 font-medium mb-4">No sections defined yet for this QAP.</p>
                                <p className="text-xs text-gray-400">Add sections manually using the form above or upload a QAP PDF in the documents tab.</p>
                            </div>
                        ) : (
                            <div className="overflow-hidden border border-gray-100 rounded-xl shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-[#1e293b] text-white">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Serial</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Description</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider bg-blue-900/40">Status (Tick)</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider bg-slate-700/40">Comments / Remarks</th>
                                            {isAdmin && <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Action</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {project.qapSerials.map((serial: any) => (
                                            <tr key={serial.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-600">{serial.serialNumber}</td>
                                                <td className="px-6 py-4 text-sm text-gray-700 font-medium">{serial.description}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center bg-blue-50/20">
                                                    <div className="flex justify-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={serial.isCompleted}
                                                            onChange={() => canEdit && handleToggleSerial(serial.id, serial.isCompleted)}
                                                            disabled={!canEdit}
                                                            className="w-6 h-6 text-blue-600 border-gray-300 rounded-lg focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed shadow-inner transition-transform active:scale-90"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium bg-slate-50/20">
                                                    <textarea
                                                        defaultValue={serial.remarks || ''}
                                                        onBlur={async (e) => {
                                                            if (canEdit && e.target.value !== (serial.remarks || '')) {
                                                                try {
                                                                    await api.put(`/qap/${serial.id}`, { remarks: e.target.value });
                                                                    fetchProject();
                                                                } catch (error) {
                                                                    console.error('Error updating remarks', error);
                                                                }
                                                            }
                                                        }}
                                                        disabled={!canEdit}
                                                        placeholder="Add inspection notes..."
                                                        className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-400 rounded p-2 text-xs h-10 transition-all disabled:text-gray-400"
                                                    />
                                                </td>
                                                {isAdmin && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <button
                                                            onClick={() => handleDeleteSerial(serial.id)}
                                                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                            title="Delete Section"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'inspections' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">Inspection Calls</h3>
                            {!isAddingInspection && canEdit && (
                                <button
                                    onClick={() => setIsAddingInspection(true)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md transition-all active:scale-95"
                                >
                                    + New Call
                                </button>
                            )}
                        </div>

                        {isAddingInspection && (
                            <form onSubmit={handleAddInspection} className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Call Number</label>
                                        <input
                                            type="text"
                                            required
                                            value={newInspection.callNumber}
                                            onChange={(e) => setNewInspection({ ...newInspection, callNumber: e.target.value })}
                                            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="e.g. IC/2024/001"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Location</label>
                                        <input
                                            type="text"
                                            required
                                            value={newInspection.location}
                                            onChange={(e) => setNewInspection({ ...newInspection, location: e.target.value })}
                                            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Factory, Site, etc."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Call Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={newInspection.callDate}
                                            onChange={(e) => setNewInspection({ ...newInspection, callDate: e.target.value })}
                                            className="w-full border rounded-lg p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Inspection Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={newInspection.inspectionDate}
                                            onChange={(e) => setNewInspection({ ...newInspection, inspectionDate: e.target.value })}
                                            className="w-full border rounded-lg p-2 text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Call Letter / Document</label>
                                        <input type="file" id="new-call-doc" className="w-full text-xs" accept=".pdf" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsAddingInspection(false)} className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-800">Cancel</button>
                                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md">Create Call</button>
                                </div>
                            </form>
                        )}

                        {(project.inspectionCalls || []).length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <p className="text-gray-400 font-medium">No inspection calls recorded for this project.</p>
                            </div>
                        ) : (
                            <div className="overflow-hidden border border-gray-100 rounded-xl shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-[#1e293b] text-white">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Call No.</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Insp. Date</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Location</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Docs</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Remarks</th>
                                            {canEdit && <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Action</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {project.inspectionCalls.map((call: any) => (
                                            <tr key={call.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">{call.callNumber}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                                    {format(new Date(call.callDate), 'dd MMM yyyy')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-bold">
                                                    {format(new Date(call.inspectionDate), 'dd MMM yyyy')}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{call.location}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-3">
                                                        {call.callDocumentPath ? (
                                                            <a href={`/${call.callDocumentPath}`} target="_blank" rel="noreferrer" title="View Call Letter" className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                            </a>
                                                        ) : (
                                                            <button
                                                                onClick={() => setIsUploadModalOpen(true)}
                                                                title="MISSING IC LETTER - Click to Upload"
                                                                className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-200 animate-pulse flex items-center gap-1"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                                <span className="text-[8px] font-extrabold uppercase">Req.</span>
                                                            </button>
                                                        )}
                                                        {call.jirDocumentPath && (
                                                            <a href={`/${call.jirDocumentPath}`} target="_blank" rel="noreferrer" title="View JIR" className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors border border-green-100">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${call.status === 'Completed'
                                                        ? 'bg-green-100 text-green-700 border-green-200'
                                                        : 'bg-orange-100 text-orange-700 border-orange-200'
                                                        }`}>
                                                        {call.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <textarea
                                                        defaultValue={call.remarks || ''}
                                                        onBlur={async (e) => {
                                                            if (canEdit && e.target.value !== (call.remarks || '')) {
                                                                try {
                                                                    await api.put(`/inspections/${call.id}`, { remarks: e.target.value });
                                                                    fetchProject();
                                                                } catch (error) {
                                                                    console.error('Error updating inspection remarks', error);
                                                                }
                                                            }
                                                        }}
                                                        disabled={!canEdit}
                                                        placeholder="Add inspection remarks..."
                                                        className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-400 rounded p-2 text-xs h-12 transition-all disabled:text-gray-400 resize-none"
                                                    />
                                                </td>
                                                {canEdit && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        {call.status === 'Pending' && (
                                                            <button
                                                                onClick={() => handleUpdateInspectionStatus(call.id)}
                                                                className="text-xs font-extrabold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-all"
                                                            >
                                                                Submit JIR
                                                            </button>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <DocumentUploadModal
                projectId={Number(id)}
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUploadSuccess={fetchProject}
            />

            <JIRCompletionModal
                inspectionId={selectedInspectionId!}
                isOpen={isJIRModalOpen}
                onClose={() => setIsJIRModalOpen(false)}
                onSuccess={fetchProject}
            />
        </div>
    );
};

export default ProjectDetails;
