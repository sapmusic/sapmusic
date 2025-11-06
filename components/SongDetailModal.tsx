

import React from 'react';
import { RegisteredSong, Writer, AgreementStatus, SyncStatus, DealStatus, Earning, SyncDeal } from '../types';
import { XIcon } from './icons/XIcon';

interface SongDetailModalProps {
  song: RegisteredSong;
  earningsForSong: Earning[];
  dealsForSong: SyncDeal[];
  onClose: () => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const StatusBadge: React.FC<{ status: AgreementStatus | SyncStatus | DealStatus, type: 'agreement' | 'sync' | 'deal' }> = ({ status, type }) => {
    const baseClasses = 'text-xs font-bold py-1 px-2.5 rounded-full capitalize';
    
    const agreementStyles: Record<AgreementStatus, string> = {
        active: 'bg-green-500/20 text-green-300',
        pending: 'bg-yellow-500/20 text-yellow-300',
        expired: 'bg-red-500/20 text-red-400',
        rejected: 'bg-slate-500/20 text-slate-300',
    };
     const syncStyles: Record<SyncStatus, string> = {
        active: 'bg-green-500/20 text-green-300',
        pending: 'bg-yellow-500/20 text-yellow-300',
        rejected: 'bg-red-500/20 text-red-400',
        none: 'bg-slate-500/20 text-slate-300',
    };
    const dealStyles: Record<DealStatus, string> = {
        offered: 'bg-blue-500/20 text-blue-300',
        accepted: 'bg-green-500/20 text-green-300',
        rejected: 'bg-red-500/20 text-red-400',
        expired: 'bg-slate-500/20 text-slate-300',
    };

    const styles = { agreement: agreementStyles, sync: syncStyles, deal: dealStyles };
    const styleClass = (styles[type] as Record<string, string>)[status] || agreementStyles.rejected;

    return <span className={`${baseClasses} ${styleClass}`}>{status}</span>
};

const InfoItem: React.FC<{label: string, value?: string | number | null}> = ({ label, value }) => (
    value ? (
        <div className="bg-slate-700/50 p-2 rounded-md">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="text-sm font-semibold text-white">{value}</p>
        </div>
    ) : null
);

const SongDetailModal: React.FC<SongDetailModalProps> = ({ song, earningsForSong, dealsForSong, onClose }) => {
    const totalEarnings = earningsForSong.reduce((sum, e) => sum + e.amount, 0);

    return (
    <div 
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
    >
        <div 
            className="bg-slate-800 border border-slate-700 rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl shadow-slate-950/50"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white">Song Details</h2>
                <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white">
                    <XIcon className="w-6 h-6" />
                </button>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex flex-col sm:flex-row gap-6 p-4 bg-slate-900/50 rounded-lg items-center sm:items-start">
                    <img src={song.artworkUrl} alt={song.title} className="h-32 w-32 rounded-md object-cover flex-shrink-0"/>
                    <div className="flex-grow w-full text-center sm:text-left">
                        <p className="text-3xl font-bold text-white">{song.title}</p>
                        <p className="text-xl text-slate-300">{song.artist}</p>
                        {song.album && <p className="text-md text-slate-400 mt-1">{song.album}</p>}
                        
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-left">
                            <InfoItem label="Registration Date" value={new Date(song.registrationDate).toLocaleDateString()} />
                            <InfoItem label="Duration" value={song.duration} />
                            <InfoItem label="ISRC" value={song.isrc} />
                            <InfoItem label="UPC" value={song.upc} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                        <p className="text-sm text-slate-400">Agreement Status</p>
                        <div className="mt-1"><StatusBadge status={song.status} type="agreement" /></div>
                    </div>
                    <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                        <p className="text-sm text-slate-400">Sync Status</p>
                        <div className="mt-1"><StatusBadge status={song.syncStatus} type="sync" /></div>
                    </div>
                    <div className="p-4 bg-slate-700/50 rounded-lg text-center">
                        <p className="text-sm text-slate-400">Total Earnings</p>
                        <p className="text-xl font-bold text-green-400">{formatCurrency(totalEarnings)}</p>
                    </div>
                </div>

                <div className="p-4 bg-slate-700/50 rounded-lg">
                    <h3 className="font-semibold text-amber-400 mb-2">Writer Splits</h3>
                    <div className="space-y-2">
                        {song.writers.map((writer: Writer) => (
                            <div key={writer.id} className="grid grid-cols-2 gap-4 text-sm bg-slate-800/50 p-2 rounded-md">
                                <div>
                                    <p className="font-semibold text-slate-200">{writer.name}</p>
                                    <p className="text-xs text-slate-400">{writer.role.join(', ')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-white">{writer.split}%</p>
                                    <p className="text-xs text-slate-400">{writer.society} &bull; IPI: {writer.ipi}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {dealsForSong.length > 0 && (
                     <div className="p-4 bg-slate-700/50 rounded-lg">
                        <h3 className="font-semibold text-amber-400 mb-2">Sync Licensing Deals</h3>
                        <div className="space-y-2">
                            {dealsForSong.map(deal => (
                                <div key={deal.id} className="grid grid-cols-2 gap-4 text-sm bg-slate-800/50 p-2 rounded-md">
                                    <div>
                                        <p className="font-semibold text-slate-200">{deal.licensee}</p>
                                        <p className="text-xs text-slate-400">{deal.dealType}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-300">{formatCurrency(deal.fee)}</p>
                                        <StatusBadge status={deal.status} type="deal" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="p-4 bg-slate-700/50 rounded-lg">
                    <h3 className="font-semibold text-amber-400 mb-3">Digital Signature</h3>
                    <div className="w-full flex items-center justify-center p-4 bg-slate-800/50 border border-dashed border-slate-600 rounded-md">
                        {song.signatureType === 'draw' ? (
                            <img src={song.signatureData} alt="Signature" className="h-20" />
                        ) : (
                            <p className="font-signature text-5xl text-amber-400">{song.signatureData}</p>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="flex-shrink-0 flex items-center justify-end gap-4 p-4 border-t border-slate-700 bg-slate-800/50">
                <button
                    onClick={onClose}
                    className="bg-slate-700 text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors"
                >
                    Close
                </button>
            </footer>
        </div>
    </div>
  );
};

export default SongDetailModal;