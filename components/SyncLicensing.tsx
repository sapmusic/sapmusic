import React, { useState, useMemo } from 'react';
import { RegisteredSong, SyncDeal, SyncStatus, DealStatus } from '../types';
import { SearchIcon } from './icons/SearchIcon';
import CreateDealModal from './CreateDealModal';

interface SyncLicensingProps {
    songs: RegisteredSong[];
    deals: SyncDeal[];
    onUpdateSongSyncStatus: (songId: string, status: SyncStatus) => void;
    onCreateDeal: (deal: Omit<SyncDeal, 'id'|'status'|'offerDate'>) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const DealStatusBadge: React.FC<{ status: DealStatus }> = ({ status }) => {
    const baseClasses = 'text-xs font-bold py-1 px-2.5 rounded-full capitalize';
    const styles: Record<DealStatus, string> = {
        offered: 'bg-blue-500/20 text-blue-300',
        accepted: 'bg-green-500/20 text-green-300',
        rejected: 'bg-red-500/20 text-red-400',
        expired: 'bg-slate-500/20 text-slate-300',
    };
    return <span className={`${baseClasses} ${styles[status]}`}>{status}</span>;
};


const SyncLicensing: React.FC<SyncLicensingProps> = ({ songs, deals, onUpdateSongSyncStatus, onCreateDeal }) => {
    const [activeTab, setActiveTab] = useState<'pending' | 'catalog'>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [isDealModalOpen, setIsDealModalOpen] = useState(false);
    const [selectedSongForDeal, setSelectedSongForDeal] = useState<RegisteredSong | null>(null);
    
    const { pendingSongs, catalogSongs } = useMemo(() => ({
        pendingSongs: songs.filter(s => s.syncStatus === 'pending'),
        catalogSongs: songs.filter(s => s.syncStatus === 'active')
    }), [songs]);

    const filteredCatalogSongs = useMemo(() => {
        if (!searchTerm) return catalogSongs;
        return catalogSongs.filter(s => 
            s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.artist.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [catalogSongs, searchTerm]);

    const handleCreateDeal = (deal: Omit<SyncDeal, 'id'|'status'|'offerDate'>) => {
        onCreateDeal(deal);
        setIsDealModalOpen(false);
    };
    
    const TabButton: React.FC<{tab: 'pending'|'catalog', label: string, count: number}> = ({tab, label, count}) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === tab ? 'bg-amber-400 text-slate-900' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
        >
            {label}
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab ? 'bg-slate-900/20' : 'bg-slate-700'}`}>{count}</span>
        </button>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Sync Licensing</h1>
            
            <div className="p-2 bg-slate-900/50 rounded-lg flex items-center gap-2 flex-wrap">
                <TabButton tab="pending" label="Pending Review" count={pendingSongs.length} />
                <TabButton tab="catalog" label="Sync Catalog" count={catalogSongs.length} />
            </div>

            {activeTab === 'pending' && (
                <div className="space-y-4">
                    {pendingSongs.length > 0 ? pendingSongs.map(song => (
                        <div key={song.id} className="bg-slate-800 p-4 rounded-lg flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <img src={song.artworkUrl} alt={song.title} className="w-12 h-12 rounded-md object-cover"/>
                                <div>
                                    <p className="font-semibold text-white">{song.title}</p>
                                    <p className="text-sm text-slate-400">{song.artist}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => onUpdateSongSyncStatus(song.id, 'rejected')} className="font-semibold text-red-400 hover:text-red-300 text-sm">Reject</button>
                                <button onClick={() => onUpdateSongSyncStatus(song.id, 'active')} className="bg-green-500/20 text-green-300 font-semibold py-2 px-4 rounded-lg text-sm hover:bg-green-500/30">Approve</button>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-slate-400 py-16">No songs are pending review.</p>
                    )}
                </div>
            )}
            
            {activeTab === 'catalog' && (
                 <div className="space-y-4">
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <SearchIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <input 
                            type="text"
                            placeholder="Search catalog by title or artist..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-11 pr-4 py-3 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                        />
                    </div>
                     {filteredCatalogSongs.length > 0 ? filteredCatalogSongs.map(song => {
                         const songDeals = deals.filter(d => d.songId === song.id);
                         return (
                            <div key={song.id} className="bg-slate-800 p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <img src={song.artworkUrl} alt={song.title} className="w-12 h-12 rounded-md object-cover"/>
                                        <div>
                                            <p className="font-semibold text-white">{song.title}</p>
                                            <p className="text-sm text-slate-400">{song.artist}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedSongForDeal(song); setIsDealModalOpen(true); }}
                                        className="bg-amber-500 text-slate-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400"
                                    >
                                        Create Deal
                                    </button>
                                </div>
                                {songDeals.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
                                        {songDeals.map(deal => (
                                            <div key={deal.id} className="text-sm p-2 bg-slate-700/50 rounded-md flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold text-slate-200">{deal.licensee} ({deal.dealType})</p>
                                                    <p className="text-xs text-slate-400">{deal.terms}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-green-300">{formatCurrency(deal.fee)}</p>
                                                    <DealStatusBadge status={deal.status} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                         );
                     }) : (
                         <p className="text-center text-slate-400 py-16">No songs in the catalog match your search.</p>
                     )}
                 </div>
            )}
            
            {isDealModalOpen && selectedSongForDeal && (
                <CreateDealModal
                    song={selectedSongForDeal}
                    onClose={() => setIsDealModalOpen(false)}
                    onCreateDeal={handleCreateDeal}
                />
            )}
        </div>
    );
};

export default SyncLicensing;