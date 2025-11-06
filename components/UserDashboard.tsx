

import React, { useMemo } from 'react';
import { RegisteredSong, Earning, User, SyncDeal, DealStatus } from '../types';
import { SongIcon } from './icons/SongIcon';
import { AgreementIcon } from './icons/AgreementIcon';
import { AddIcon } from './icons/AddIcon';
import { EarningsIcon } from './icons/EarningsIcon';
import { SyncIcon } from './icons/SyncIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';

interface UserDashboardProps {
  songs: RegisteredSong[];
  earnings: Earning[];
  currentUser: User;
  onRegisterNew: () => void;
  syncDeals: SyncDeal[];
  onUpdateDealStatus: (dealId: string, status: DealStatus) => void;
  onViewSongDetails: (song: RegisteredSong) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
    <div className="bg-slate-800 p-6 rounded-lg flex items-center gap-4">
        <div className="bg-slate-700 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-slate-400 text-sm">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const SongListItem: React.FC<{ song: RegisteredSong, onClick: () => void }> = ({ song, onClick }) => {
    return (
    <button onClick={onClick} className="w-full text-left flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors">
        <div className="flex items-center gap-4">
            <img src={song.artworkUrl} alt={song.title} className="h-12 w-12 rounded-md object-cover" />
            <div>
                <p className="font-semibold text-white">{song.title}</p>
                <p className="text-sm text-slate-400">{song.artist}</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right">
                <p className="text-sm text-slate-300">Registered on {song.registrationDate}</p>
                <span className={`text-xs font-bold py-1 px-2 rounded-full capitalize ${
                    song.status === 'active' ? 'bg-green-500/20 text-green-300' :
                    song.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                    song.status === 'expired' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-300'
                }`}>{song.status}</span>
            </div>
            <InformationCircleIcon className="h-6 w-6 text-slate-500 flex-shrink-0" />
        </div>
    </button>
)};

const UserDashboard: React.FC<UserDashboardProps> = ({ songs, earnings, currentUser, onRegisterNew, syncDeals, onUpdateDealStatus, onViewSongDetails }) => {
    const activeAgreements = songs.filter(s => s.status === 'active').length;
    
    const userLifetimeEarnings = useMemo(() => {
        let total = 0;
        const userSongIds = new Set(songs.map(s => s.id));
        
        earnings.forEach(earning => {
            if (userSongIds.has(earning.songId)) {
                const song = songs.find(s => s.id === earning.songId);
                const writer = song?.writers.find(w => w.writerId === currentUser.id || w.name === currentUser.name);
                if (writer) {
                    total += earning.amount * (writer.split / 100);
                }
            }
        });
        return total;
    }, [songs, earnings, currentUser]);

    const userOfferedDeals = useMemo(() => {
        const userSongIds = new Set(songs.map(s => s.id));
        return syncDeals.filter(deal => userSongIds.has(deal.songId) && deal.status === 'offered');
    }, [songs, syncDeals]);


    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Your Dashboard</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={<SongIcon className="h-6 w-6 text-amber-400" />} label="Your Registered Songs" value={songs.length} />
                <StatCard icon={<AgreementIcon className="h-6 w-6 text-green-400" />} label="Your Active Agreements" value={activeAgreements} />
                <StatCard icon={<EarningsIcon className="h-6 w-6 text-teal-400" />} label="Your Lifetime Earnings" value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(userLifetimeEarnings)} />
            </div>

            {userOfferedDeals.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <SyncIcon className="h-6 w-6 text-amber-400" />
                        Sync Licensing Opportunities
                    </h2>
                    <div className="space-y-3">
                       {userOfferedDeals.map(deal => {
                           const song = songs.find(s => s.id === deal.songId);
                           if (!song) return null;
                           return (
                               <div key={deal.id} className="bg-slate-800 p-4 rounded-lg border-l-4 border-amber-400">
                                   <div className="flex justify-between items-start gap-4">
                                       <div>
                                           <p className="text-xs text-amber-400 font-bold uppercase">{deal.dealType} Offer</p>
                                           <p className="font-semibold text-white">"{song.title}" for {deal.licensee}</p>
                                           <p className="text-sm text-slate-400 mt-2">{deal.terms}</p>
                                       </div>
                                       <div className="text-right flex-shrink-0">
                                            <p className="text-2xl font-bold text-green-400">{formatCurrency(deal.fee)}</p>
                                            <p className="text-xs text-slate-500">Expires {new Date(deal.expiryDate).toLocaleDateString()}</p>
                                       </div>
                                   </div>
                                   <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-end gap-3">
                                       <button onClick={() => onUpdateDealStatus(deal.id, 'rejected')} className="flex items-center gap-2 bg-red-500/10 text-red-400 font-bold py-2 px-4 rounded-lg hover:bg-red-500/20 transition-colors">
                                           <XCircleIcon className="h-5 w-5" /> Reject
                                       </button>
                                       <button onClick={() => onUpdateDealStatus(deal.id, 'accepted')} className="flex items-center gap-2 bg-green-500/10 text-green-300 font-bold py-2 px-4 rounded-lg hover:bg-green-500/20 transition-colors">
                                            <CheckCircleIcon className="h-5 w-5" /> Accept
                                       </button>
                                   </div>
                               </div>
                           )
                       })}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-white">Your Songs</h2>
                     <button onClick={onRegisterNew} className="flex items-center gap-2 bg-amber-500 text-slate-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors duration-200">
                        <AddIcon className="h-5 w-5" />
                        Register New Song
                    </button>
                </div>
                <div className="space-y-3">
                    {songs.length > 0 ? (
                        songs.map(song => <SongListItem key={song.id} song={song} onClick={() => onViewSongDetails(song)} />)
                    ) : (
                        <div className="text-center py-10 bg-slate-800/50 rounded-lg">
                            <p className="text-slate-400">You haven't registered any songs yet.</p>
                            <button onClick={onRegisterNew} className="mt-4 text-amber-400 font-semibold hover:underline">
                                Register your first song
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;