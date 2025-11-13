


import React, { useState, useMemo } from 'react';
import { RegisteredSong, Earning } from '../types';
import { SearchIcon } from './icons/SearchIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import AddEarningModal from './AddEarningModal';

interface ManageEarningsProps {
  songs: RegisteredSong[];
  earnings: Earning[];
  onAddEarning: (earning: Omit<Earning, 'id'>) => Promise<{ success: boolean; error?: any }>;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

const ManageEarnings: React.FC<ManageEarningsProps> = ({ songs, earnings, onAddEarning }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSong, setSelectedSong] = useState<RegisteredSong | null>(null);

    const songEarningsMap = useMemo(() => {
        const map = new Map<string, number>();
        earnings.forEach(earning => {
            map.set(earning.songId, (map.get(earning.songId) || 0) + earning.amount);
        });
        return map;
    }, [earnings]);
    
    const recentTransactions = useMemo(() => {
        return [...earnings]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
    }, [earnings]);

    const filteredSongs = useMemo(() => {
        return songs.filter(song => 
            song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            song.artist.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [songs, searchTerm]);

    const handleAddRevenueClick = (song: RegisteredSong) => {
        setSelectedSong(song);
        setIsModalOpen(true);
    }
    
    const handleAddEarning = async (earning: Omit<Earning, 'id'>) => {
        const result = await onAddEarning(earning);
        if (result.success) {
            setIsModalOpen(false);
        }
        return result;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Manage Earnings</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <SearchIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <input 
                            type="text"
                            placeholder="Search for a song..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-11 pr-4 py-3 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                        />
                    </div>
                    <div className="bg-slate-800/50 rounded-lg max-h-[65vh] overflow-y-auto">
                        <div className="divide-y divide-slate-700/50">
                        {filteredSongs.length > 0 ? filteredSongs.map(song => (
                            <div key={song.id} className="p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <img src={song.artworkUrl} alt={song.title} className="w-12 h-12 rounded-md object-cover"/>
                                    <div>
                                        <p className="font-semibold text-white">{song.title}</p>
                                        <p className="text-sm text-slate-400">{song.artist}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">Total Earnings</p>
                                        <p className="font-bold text-lg text-green-400">{formatCurrency(songEarningsMap.get(song.id) || 0)}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleAddRevenueClick(song)}
                                        className="flex items-center gap-2 bg-amber-500 text-slate-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors"
                                    >
                                        <DollarSignIcon className="h-5 w-5" />
                                        Add Revenue
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-slate-400 py-10">No songs found.</p>
                        )}
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold text-white mb-4">Recent Transactions</h2>
                    <div className="space-y-3">
                        {recentTransactions.length > 0 ? recentTransactions.map(earning => {
                            const song = songs.find(s => s.id === earning.songId);
                            return (
                                <div key={earning.id} className="bg-slate-700/50 p-3 rounded-md text-sm">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-white">{formatCurrency(earning.amount)}</p>
                                        <p className="text-slate-400">{new Date(earning.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <p className="text-xs text-slate-300">
                                        {song ? `${song.title} - ${song.artist}` : 'Unknown Song'}
                                    </p>
                                    <p className="text-xs text-slate-400 capitalize">{earning.platform.replace('_', ' ')} • {earning.source.replace('_', ' ')}</p>
                                </div>
                            )
                        }) : (
                            <p className="text-sm text-slate-400 text-center py-8">No earnings have been recorded yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {isModalOpen && selectedSong && (
                <AddEarningModal
                    song={selectedSong}
                    onClose={() => setIsModalOpen(false)}
                    onAddEarning={handleAddEarning}
                />
            )}
        </div>
    );
};

export default ManageEarnings;
