import React, { useState, useMemo } from 'react';
import { RegisteredSong, SyncDeal, SyncStatus, DealStatus } from '../types';
import { SearchIcon } from './icons/SearchIcon';
import CreateDealModal from './CreateDealModal';
import { AddIcon } from './icons/AddIcon';
import { ChevronUpIcon } from './icons/ChevronUpIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

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

type SortKey = 'songTitle' | 'licensee' | 'fee' | 'status' | 'offerDate' | 'expiryDate';
type DealStatusFilter = DealStatus | 'all';

const SyncLicensing: React.FC<SyncLicensingProps> = ({ songs, deals, onUpdateSongSyncStatus, onCreateDeal }) => {
    const [activeTab, setActiveTab] = useState<'pending' | 'catalog'>('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [isDealModalOpen, setIsDealModalOpen] = useState(false);
    
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'offerDate', direction: 'desc' });
    const [statusFilter, setStatusFilter] = useState<DealStatusFilter>('all');
    
    const { pendingSongs, catalogSongs } = useMemo(() => ({
        pendingSongs: songs.filter(s => s.syncStatus === 'pending'),
        catalogSongs: songs.filter(s => s.syncStatus === 'active')
    }), [songs]);

    const processedDeals = useMemo(() => {
        // FIX: Explicitly type songMap to ensure TypeScript correctly infers song types.
        const songMap = new Map<string, RegisteredSong>(songs.map(song => [song.id, song]));
        let filterableDeals = [...deals];

        if (statusFilter !== 'all') {
            filterableDeals = filterableDeals.filter(deal => deal.status === statusFilter);
        }

        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            filterableDeals = filterableDeals.filter(deal => {
                const song = songMap.get(deal.songId);
                return (
                    deal.licensee.toLowerCase().includes(lowercasedFilter) ||
                    // FIX: Guard against song being undefined to prevent runtime error and fix type errors.
                    (song && song.title.toLowerCase().includes(lowercasedFilter)) ||
                    (song && song.artist.toLowerCase().includes(lowercasedFilter))
                );
            });
        }
        
        filterableDeals.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            if (sortConfig.key === 'songTitle') {
                // FIX: Explicitly get song objects to resolve type errors.
                const songA = songMap.get(a.songId);
                const songB = songMap.get(b.songId);
                aValue = songA?.title || '';
                bValue = songB?.title || '';
            } else {
                aValue = a[sortConfig.key as keyof SyncDeal];
                bValue = b[sortConfig.key as keyof SyncDeal];
            }
            
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return filterableDeals;
    }, [deals, songs, searchTerm, statusFilter, sortConfig]);

    const requestSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };
    
    const getSortIcon = (key: SortKey) => {
        if (sortConfig.key !== key) {
            return <ChevronDownIcon className="h-4 w-4 text-slate-500 opacity-0 group-hover:opacity-100" />;
        }
        if (sortConfig.direction === 'asc') {
            return <ChevronUpIcon className="h-4 w-4 text-amber-400" />;
        }
        return <ChevronDownIcon className="h-4 w-4 text-amber-400" />;
    };

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
    
    const SortableHeader: React.FC<{ sortKey: SortKey, children: React.ReactNode, className?: string }> = ({ sortKey, children, className = '' }) => (
        <th scope="col" className={`px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider ${className}`}>
            <button onClick={() => requestSort(sortKey)} className="group flex items-center gap-1">
                {children}
                {getSortIcon(sortKey)}
            </button>
        </th>
    );

    const DealStatusFilterButton: React.FC<{ value: DealStatusFilter, label: string }> = ({ value, label }) => (
        <button
            onClick={() => setStatusFilter(value)}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                statusFilter === value ? 'bg-amber-400 text-slate-900' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Sync Licensing</h1>
            
            <div className="p-2 bg-slate-900/50 rounded-lg flex items-center gap-2 flex-wrap">
                <TabButton tab="pending" label="Pending Review" count={pendingSongs.length} />
                <TabButton tab="catalog" label="Sync Deals" count={deals.length} />
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
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                        <div className="relative flex-grow">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                <SearchIcon className="h-5 w-5 text-slate-400" />
                            </div>
                            <input 
                                type="text"
                                placeholder="Search deals by song, artist, or licensee..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-11 pr-4 py-3 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                            />
                        </div>
                        <button
                            onClick={() => setIsDealModalOpen(true)}
                            className="flex items-center justify-center gap-2 bg-amber-500 text-slate-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400"
                        >
                            <AddIcon className="h-5 w-5" />
                            Create New Deal
                        </button>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-400 mr-2">Status:</span>
                        <DealStatusFilterButton value="all" label="All" />
                        <DealStatusFilterButton value="offered" label="Offered" />
                        <DealStatusFilterButton value="accepted" label="Accepted" />
                        <DealStatusFilterButton value="rejected" label="Rejected" />
                        <DealStatusFilterButton value="expired" label="Expired" />
                    </div>
                    
                    <div className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700/50">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-700/50">
                                <thead className="bg-slate-900/50">
                                    <tr>
                                        <SortableHeader sortKey="songTitle">Song</SortableHeader>
                                        <SortableHeader sortKey="licensee">Licensee</SortableHeader>
                                        <SortableHeader sortKey="fee" className="text-right">Fee</SortableHeader>
                                        <SortableHeader sortKey="status">Status</SortableHeader>
                                        <SortableHeader sortKey="offerDate">Offer Date</SortableHeader>
                                        <SortableHeader sortKey="expiryDate">Expiry Date</SortableHeader>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {processedDeals.map(deal => {
                                        const song = songs.find(s => s.id === deal.songId);
                                        return (
                                            <tr key={deal.id} className="hover:bg-slate-700/20">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="font-semibold text-white">{song?.title || 'Unknown Song'}</div>
                                                    <div className="text-slate-400">{song?.artist || 'Unknown Artist'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{deal.licensee}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-400 text-right">{formatCurrency(deal.fee)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap"><DealStatusBadge status={deal.status} /></td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{new Date(deal.offerDate).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{new Date(deal.expiryDate).toLocaleDateString()}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                         {processedDeals.length === 0 && (
                            <p className="text-center text-slate-400 py-16">No deals found matching your criteria.</p>
                        )}
                    </div>
                 </div>
            )}
            
            {isDealModalOpen && (
                <CreateDealModal
                    catalogSongs={catalogSongs}
                    onClose={() => setIsDealModalOpen(false)}
                    onCreateDeal={handleCreateDeal}
                />
            )}
        </div>
    );
};

export default SyncLicensing;