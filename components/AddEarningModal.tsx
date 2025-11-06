import React, { useState } from 'react';
import { RegisteredSong, Earning, Platform, RevenueSource } from '../types';
import { PLATFORMS, REVENUE_SOURCES } from '../constants';
import { XIcon } from './icons/XIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';

interface AddEarningModalProps {
  song: RegisteredSong;
  onClose: () => void;
  onAddEarning: (earning: Omit<Earning, 'id'>) => void;
}

const AddEarningModal: React.FC<AddEarningModalProps> = ({ song, onClose, onAddEarning }) => {
    const [amount, setAmount] = useState<number | ''>('');
    const [platform, setPlatform] = useState<Platform>(PLATFORMS[0]);
    const [source, setSource] = useState<RevenueSource>(REVENUE_SOURCES[0]);
    const [earningDate, setEarningDate] = useState(new Date().toISOString().split('T')[0]);
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!amount || amount <= 0 || !platform || !source || !earningDate) {
            setError('All fields are required and amount must be positive.');
            return;
        }

        onAddEarning({
            songId: song.id,
            amount: Number(amount),
            platform,
            source,
            earningDate,
        });
    };
    
    const formatLabel = (label: string) => {
        return label.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

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
                    <div>
                        <h2 className="text-xl font-bold text-white">Add Earning Record</h2>
                        <p className="text-sm text-slate-400">For: {song.title} - {song.artist}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                <main className="p-6 space-y-4">
                    <div>
                        <label className="text-sm text-slate-300 block mb-1">Amount (USD) *</label>
                        <div className="relative">
                             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <DollarSignIcon className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md pl-10 pr-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-slate-300 block mb-1">Platform *</label>
                            <select
                                value={platform}
                                onChange={e => setPlatform(e.target.value as Platform)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                            >
                                {PLATFORMS.map(p => <option key={p} value={p}>{formatLabel(p)}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="text-sm text-slate-300 block mb-1">Source *</label>
                            <select
                                value={source}
                                onChange={e => setSource(e.target.value as RevenueSource)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                            >
                                {REVENUE_SOURCES.map(s => <option key={s} value={s}>{formatLabel(s)}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-slate-300 block mb-1">Date *</label>
                        <input
                            type="date"
                            value={earningDate}
                            onChange={e => setEarningDate(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
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
                        <DollarSignIcon className="w-5 h-5" />
                        Add Earning
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AddEarningModal;