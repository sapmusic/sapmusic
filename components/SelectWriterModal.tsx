import React, { useState } from 'react';
import { ManagedWriter } from '../types';
import { XIcon } from './icons/XIcon';
import { SearchIcon } from './icons/SearchIcon';

interface SelectWriterModalProps {
  writers: ManagedWriter[];
  onSelect: (writer: ManagedWriter) => void;
  onClose: () => void;
}

const SelectWriterModal: React.FC<SelectWriterModalProps> = ({ writers, onSelect, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredWriters = writers.filter(writer => 
        writer.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full max-h-[70vh] flex flex-col shadow-2xl shadow-slate-950/50"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">Select a Writer</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                <div className="p-4 flex-shrink-0">
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <SearchIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search for a writer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                        />
                    </div>
                </div>
                <main className="flex-1 overflow-y-auto p-4 pt-0">
                    {filteredWriters.length > 0 ? (
                        <div className="space-y-2">
                            {filteredWriters.map(writer => (
                                <button
                                    key={writer.id}
                                    onClick={() => onSelect(writer)}
                                    className="w-full text-left bg-slate-700/50 hover:bg-slate-700 p-3 rounded-lg transition-colors"
                                >
                                    <p className="font-semibold text-white">{writer.name}</p>
                                    <p className="text-sm text-slate-400">
                                        {writer.society} &bull; Born {new Date(writer.dob).toLocaleDateString()}
                                        {writer.ipi && ` • IPI: ${writer.ipi}`}
                                    </p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-slate-400 py-8">No matching writers found.</p>
                    )}
                </main>
            </div>
        </div>
    );
};

export default SelectWriterModal;