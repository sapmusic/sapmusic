

import React from 'react';
import { RegisteredSong } from '../types';
import { SongIcon } from './icons/SongIcon';
import { AgreementIcon } from './icons/AgreementIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { AddIcon } from './icons/AddIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';


interface AdminDashboardProps {
  songs: RegisteredSong[];
  onRegisterNew: () => void;
  onViewSongDetails: (song: RegisteredSong) => void;
}

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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ songs, onRegisterNew, onViewSongDetails }) => {
    const activeAgreements = songs.filter(s => s.status === 'active').length;
    const pendingApprovals = songs.filter(s => s.status === 'pending').length;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={<SongIcon className="h-6 w-6 text-amber-400" />} label="Total Registered Songs" value={songs.length} />
                <StatCard icon={<AgreementIcon className="h-6 w-6 text-green-400" />} label="Active Agreements" value={activeAgreements} />
                <StatCard icon={<CheckCircleIcon className="h-6 w-6 text-yellow-400" />} label="Pending Approval" value={pendingApprovals} />
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Recently Registered</h2>
                <div className="space-y-3">
                    {songs.length > 0 ? (
                        songs.slice(0, 5).map(song => <SongListItem key={song.id} song={song} onClick={() => onViewSongDetails(song)} />)
                    ) : (
                        <div className="text-center py-10 bg-slate-800/50 rounded-lg">
                            <p className="text-slate-400">No songs registered yet.</p>
                            <button onClick={onRegisterNew} className="mt-4 text-amber-400 font-semibold hover:underline">
                                Register the first song
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;