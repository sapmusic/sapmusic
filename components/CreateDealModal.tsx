import React, { useState } from 'react';
import { RegisteredSong, SyncDeal } from '../types';
import { XIcon } from './icons/XIcon';
import { SyncIcon } from './icons/SyncIcon';

interface CreateDealModalProps {
  song?: RegisteredSong;
  catalogSongs: RegisteredSong[];
  onClose: () => void;
  onCreateDeal: (deal: Omit<SyncDeal, 'id' | 'status' | 'offerDate'>) => void;
}

const DEAL_TYPES = ['TV Show', 'Film', 'Advertisement', 'Video Game', 'Web Series', 'Other'];

const CreateDealModal: React.FC<CreateDealModalProps> = ({ song, catalogSongs, onClose, onCreateDeal }) => {
    const [selectedSongId, setSelectedSongId] = useState(song?.id || '');
    const [dealType, setDealType] = useState(DEAL_TYPES[0]);
    const [licensee, setLicensee] = useState('');
    const [fee, setFee] = useState<number | ''>('');
    const [terms, setTerms] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!selectedSongId) {
            setError('You must select a song for the deal.');
            return;
        }
        if (!dealType || !licensee.trim() || !fee || fee <= 0 || !terms.trim() || !expiryDate) {
            setError('All fields are required. Fee must be a positive number.');
            return;
        }

        onCreateDeal({
            songId: selectedSongId,
            dealType,
            licensee,
            fee: Number(fee),
            terms,
            expiryDate,
        });
    };

    return (
        <div
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-slate-800 border border-slate-700 rounded-lg max-w-lg w-full flex flex-col shadow-2xl shadow-slate-950/50"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-700">
                    <div>
                        <h2 className="text-xl font-bold text-white">Create Sync Deal</h2>
                        {song && <p className="text-sm text-slate-400">For: {song.title} - {song.artist}</p>}
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                <main className="p-6 space-y-4">
                     {!song && (
                        <div>
                            <label className="text-sm text-slate-300 block mb-1">Song *</label>
                            <select
                                value={selectedSongId}
                                onChange={e => setSelectedSongId(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2"
                            >
                                <option value="" disabled>Select a song from the catalog...</option>
                                {catalogSongs.map(s => <option key={s.id} value={s.id}>{s.title} - {s.artist}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-slate-300 block mb-1">Licensee *</label>
                            <input
                                type="text"
                                value={licensee}
                                onChange={e => setLicensee(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2"
                                placeholder="e.g. Netflix, Toyota"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-slate-300 block mb-1">Deal Type *</label>
                            <select
                                value={dealType}
                                onChange={e => setDealType(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2"
                            >
                                {DEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <label className="text-sm text-slate-300 block mb-1">Licensing Fee (USD) *</label>
                            <input
                                type="number"
                                value={fee}
                                onChange={e => setFee(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2"
                                placeholder="e.g. 5000"
                            />
                        </div>
                         <div>
                            <label className="text-sm text-slate-300 block mb-1">Offer Expiry Date *</label>
                            <input
                                type="date"
                                value={expiryDate}
                                onChange={e => setExpiryDate(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm text-slate-300 block mb-1">Terms *</label>
                        <textarea
                            value={terms}
                            onChange={e => setTerms(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2"
                            placeholder="e.g. In-show background music for 'Show Name' Season 1, Episode 2. 5-year license, worldwide."
                        />
                    </div>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                </main>
                <footer className="flex-shrink-0 flex items-center justify-end gap-4 p-4 border-t border-slate-700 bg-slate-800/50">
                    <button
                        onClick={onClose}
                        className="bg-slate-700 text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-slate-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex items-center gap-2 bg-amber-500 text-slate-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400"
                    >
                        <SyncIcon className="w-5 h-5" />
                        Create & Send Offer
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default CreateDealModal;
