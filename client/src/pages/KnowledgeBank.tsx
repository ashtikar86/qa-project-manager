import { useEffect, useState } from 'react';
import api from '../api/axios';
import { format } from 'date-fns';

const CATEGORIES = [
    { id: 'QAD_DOCS', label: 'QAD Documents', color: 'bg-blue-600' },
    { id: 'SQAP_QAPS', label: 'SQAP & QAPs', color: 'bg-indigo-600' },
    { id: 'REPORTS', label: 'Reports', color: 'bg-emerald-600' },
    { id: 'MISC', label: 'Miscellaneous', color: 'bg-slate-600' }
];

const KnowledgeBank = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'DDG';
    const [activeTab, setActiveTab] = useState('QAD_DOCS');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadData, setUploadData] = useState({ title: '', file: null as File | null });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchItems();
    }, [activeTab]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/knowledge-bank?category=${activeTab}`);
            setItems(res.data);
        } catch (error) {
            console.error('Failed to fetch items', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadData.file || !uploadData.title) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', uploadData.file);
        formData.append('title', uploadData.title);
        formData.append('category', activeTab);

        try {
            await api.post('/knowledge-bank/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setIsUploadModalOpen(false);
            setUploadData({ title: '', file: null });
            fetchItems();
        } catch (error: any) {
            console.error('Upload failed', error);
            const msg = error.response?.data?.message || error.message || 'Unknown error';
            alert(`Failed to upload document: ${msg}`);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;
        try {
            await api.delete(`/knowledge-bank/${id}`);
            fetchItems();
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Knowledge Bank</h1>
                    <p className="text-gray-500 mt-1">Central repository for QA documents, reports, and references.</p>
                </div>
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Document
                </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-fit">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveTab(cat.id)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-200 ${activeTab === cat.id
                            ? `${cat.color} text-white shadow-md shadow-inner`
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Content List */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden ring-1 ring-gray-900/5">
                {loading ? (
                    <div className="p-20 flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-bold tracking-widest border-b border-gray-100">
                                <tr>
                                    <th className="px-8 py-5">Title / Filename</th>
                                    <th className="px-8 py-5">Uploaded By</th>
                                    <th className="px-8 py-5">Date</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                                                    <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                </div>
                                                <p className="text-gray-400 font-medium">No documents found in this section.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    items.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 transition duration-150">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${CATEGORIES.find(c => c.id === item.category)?.color}`}>
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-extrabold text-gray-900">{item.title}</div>
                                                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter mt-0.5">{item.originalName}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                        {item.uploader?.name?.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-600">{item.uploader?.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm text-gray-500 font-medium">{format(new Date(item.createdAt), 'dd MMM yyyy')}</span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <a
                                                        href={`/${item.path}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
                                                        title="View Document"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    </a>
                                                    <a
                                                        href={`/${item.path}`}
                                                        download={item.originalName}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-emerald-100 hover:shadow-sm"
                                                        title="Download File"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                    </a>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                                                            title="Delete"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-gray-900/10">
                        <div className={`${CATEGORIES.find(c => c.id === activeTab)?.color} px-8 py-6 text-white`}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-extrabold uppercase tracking-tight">Add to Bank</h3>
                                    <p className="text-white/70 text-xs font-bold mt-1 uppercase tracking-widest">{CATEGORIES.find(c => c.id === activeTab)?.label}</p>
                                </div>
                                <button onClick={() => setIsUploadModalOpen(false)} className="hover:rotate-90 transition-transform duration-200">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleUpload} className="p-8 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Document Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. QAD Standard Operating Procedure v2"
                                    className="w-full border border-gray-200 rounded-2xl p-4 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm"
                                    value={uploadData.title}
                                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">File Upload</label>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        required
                                        onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
                                        className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-6 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-slate-100 file:text-slate-600 hover:file:bg-slate-200 transition-all cursor-pointer bg-white group-hover:border-blue-300"
                                    />
                                    {!uploadData.file && <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-gray-300 font-bold uppercase tracking-tighter text-[10px] pb-1 shadow-inner rounded-2xl">Drop file here or click to browse</div>}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className="flex-1 px-6 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-2xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className={`flex-1 px-6 py-3 text-sm font-bold text-white rounded-2xl shadow-lg transition-all active:scale-95 ${uploading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                                        }`}
                                >
                                    {uploading ? 'Uploading...' : 'Save Document'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KnowledgeBank;
