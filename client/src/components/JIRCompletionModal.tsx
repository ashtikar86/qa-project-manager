import React, { useState } from 'react';
import api from '../api/axios';

interface JIRCompletionModalProps {
    inspectionId: number;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const JIRCompletionModal: React.FC<JIRCompletionModalProps> = ({ inspectionId, isOpen, onClose, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [remarks, setRemarks] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a JIR file.');
            return;
        }

        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('jir', file);
        formData.append('remarks', remarks);

        try {
            await api.post(`/inspections/${inspectionId}/complete`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to complete inspection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-800">Complete Inspection</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium">{error}</div>}

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Upload JIR (PDF/Image)</label>
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-400 transition-colors bg-gray-50/30">
                            <input
                                type="file"
                                required
                                accept=".pdf,image/*"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="hidden"
                                id="jir-upload"
                            />
                            <label htmlFor="jir-upload" className="cursor-pointer">
                                <div className="flex flex-col items-center">
                                    <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                    <span className="text-sm font-semibold text-gray-600">{file ? file.name : 'Click to browse or drag file'}</span>
                                    <span className="text-xs text-gray-400 mt-1">PDF or Images only</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Remarks</label>
                        <textarea
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                            placeholder="Add inspection summary or discrepancies..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Complete Now'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JIRCompletionModal;
