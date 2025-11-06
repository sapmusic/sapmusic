import React, { useState } from 'react';
import { ManagedWriter } from '../types';
import { PRO_SOCIETIES } from '../constants';
import { XIcon } from './icons/XIcon';
import { UserPlusIcon } from './icons/UserPlusIcon';

interface WriterFormModalProps {
  onClose: () => void;
  onAddWriter: (writer: Omit<ManagedWriter, 'id' | 'userId'>) => Promise<any>;
}

const WriterFormModal: React.FC<WriterFormModalProps> = ({ onClose, onAddWriter }) => {
    const [name, setName] = useState('');
    const [dob, setDob] = useState('');
    const [society, setSociety] = useState('');
    const [customSociety, setCustomSociety] = useState('');
    const [ipi, setIpi] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        const finalSociety = society === 'Other' ? customSociety.trim() : society;
        
        if (!name.trim()) {
            setError('Full Name is required.');
            return;
        }
        if (!dob) {
            setError('Date of Birth is required.');
            return;
        }
        if (!ipi.trim()) {
            setError('IPI Number is required.');
            return;
        }

        const ipiRegex = /^\d{9}$/;
        if (!ipiRegex.test(ipi)) {
            setError('IPI number must be 9 digits.');
            return;
        }
        
        if (!society) {
            setError('Please select a society from the dropdown.');
            return;
        }
        
        if (society === 'Other' && !finalSociety) {
            setError('Please enter the custom society name.');
            return;
        }

        setError('');
        await onAddWriter({ name: name.trim(), dob, society: finalSociety, ipi: ipi.trim() });
    };

    return (
        <div
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full flex flex-col shadow-2xl shadow-slate-950/50"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">Add New Writer</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                <main className="p-6 space-y-4">
                    <div>
                        <label className="text-sm text-slate-300 block mb-1">Full Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                            placeholder="e.g. John Doe"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-slate-300 block mb-1">Date of Birth *</label>
                        <input
                            type="date"
                            value={dob}
                            onChange={e => setDob(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-slate-300 block mb-1">Society (PRO) *</label>
                        <select
                            value={society}
                            onChange={e => setSociety(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                        >
                            <option value="" disabled>Select a society</option>
                            {PRO_SOCIETIES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {society === 'Other' && (
                             <input
                                type="text"
                                value={customSociety}
                                onChange={e => setCustomSociety(e.target.value)}
                                className="mt-2 w-full bg-slate-900 border border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                placeholder="Enter custom society name"
                            />
                        )}
                    </div>
                     <div>
                        <label className="text-sm text-slate-300 block mb-1">IPI Number *</label>
                        <input
                            type="text"
                            value={ipi}
                            onChange={e => setIpi(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                            placeholder="e.g. 123456789"
                            title="Enter a 9-digit IPI number."
                        />
                    </div>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                </main>
                <footer className="flex-shrink-0 flex items-center justify-end gap-4 p-4 border-t border-slate-700 bg-slate-800/50">
                    <button
                        onClick={onClose}
                        className="bg-slate-700 text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex items-center gap-2 bg-amber-500 text-slate-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors"
                    >
                        <UserPlusIcon className="w-5 h-5" />
                        Save Writer
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default WriterFormModal;