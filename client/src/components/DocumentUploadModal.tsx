import React, { useState } from 'react';
import api from '../api/axios';

interface DocumentUploadModalProps {
    projectId: number;
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess: () => void;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ projectId, isOpen, onClose, onUploadSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [type, setType] = useState('PO');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file');
            return;
        }

        if (type === 'QAP' && !file) {
            setError('Please select a file for QAP');
            return;
        }

        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId.toString());
        formData.append('type', type);

        try {
            await api.post('/documents/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            onUploadSuccess();
            onClose();
            setFile(null);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload document');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="bg-slate-800 px-6 py-4 flex justify-between items-center text-white">
                    <h3 className="text-lg font-bold">Upload Document</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleUpload} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full border rounded-lg p-2.5 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        >
                            <option value="PO">Purchase Order (PO)</option>
                            <option value="FCL">FCL (Free Cost List)</option>
                            <option value="FCM">FCM (Free Cost Material)</option>
                            <option value="DRAWING">Drawing</option>
                            <option value="QAP">QAP (Quality Assurance Plan)</option>
                            <option value="JIR">JIR (Joint Inspection Report)</option>
                            <option value="FORM_IV">Form IV</option>
                            <option value="TEST_REPORT">Test Report</option>
                            <option value="FAT_TRIAL">FAT & Trial Reports</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                        <input
                            type="file"
                            accept={
                                type === 'QAP' ? '.xls,.xlsx,.xlsb,.xlsm,.pdf,.docx,.odt,.txt,.csv,.ods,.xps' :
                                    type === 'DRAWING' ? '.pdf,.jpeg,.jpg,.dwg,.dwfx,.dxf' :
                                        (type === 'FCM' || type === 'FORM_IV' || type === 'FAT_TRIAL' || type === 'TEST_REPORT') ? '.pdf,.docx,.odt' :
                                            type === 'JIR' ? '.pdf,.jpg,.jpeg' :
                                                type === 'PO' ? '.pdf' : '*'
                            }
                            onChange={handleFileChange}
                            className="w-full border border-dashed rounded-lg p-4 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer"
                        />
                        {type === 'QAP' && <p className="text-[10px] text-blue-600 mt-1 font-bold uppercase tracking-tight">Excel, PDF, Word, ODT, TXT, CSV, ODS, XPS</p>}
                        {type === 'DRAWING' && <p className="text-[10px] text-blue-600 mt-1 font-bold uppercase tracking-tight">PDF, JPEG, JPG, DWG, DXF</p>}
                        {(type === 'FCM' || type === 'FORM_IV' || type === 'FAT_TRIAL' || type === 'TEST_REPORT') && <p className="text-[10px] text-blue-600 mt-1 font-bold uppercase tracking-tight">PDF, Word (DOCX), ODT</p>}
                        {type === 'JIR' && <p className="text-[10px] text-blue-600 mt-1 font-bold uppercase tracking-tight">PDF, JPEG, JPG</p>}
                    </div>

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg disabled:opacity-50 transition-all"
                        >
                            {loading ? 'Uploading...' : 'Upload Now'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DocumentUploadModal;
