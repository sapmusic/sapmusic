import React, { useState, useMemo } from 'react';
import { RegisteredSong, User, AgreementStatus } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { ArchiveBoxXMarkIcon } from './icons/ArchiveBoxXMarkIcon';

interface AdminApprovalProps {
  songs: RegisteredSong[];
  users: User[];
  onUpdateStatus: (songId: string, status: AgreementStatus) => void;
}

type StatusFilter = AgreementStatus | 'all';

const FilterButton: React.FC<{
    label: string, 
    value: StatusFilter, 
    count: number,
    activeFilter: StatusFilter, 
    setFilter: (value: StatusFilter) => void
}> = ({ label, value, count, activeFilter, setFilter }) => {
    const isActive = value === activeFilter;
    return (
        <button
            onClick={() => setFilter(value)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                isActive ? 'bg-amber-400 text-slate-900' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
        >
            {label}
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-slate-900/20' : 'bg-slate-700'}`}>{count}</span>
        </button>
    )
}

const SongApprovalCard: React.FC<{
    song: RegisteredSong;
    user: User | undefined;
    onUpdateStatus: (songId: string, status: AgreementStatus) => void;
}> = ({ song, user, onUpdateStatus }) => {
    return (
        <div className="bg-slate-800 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between transition-shadow hover:shadow-md hover:shadow-slate-900/50">
            <div className="flex items-center gap-4">
                <img src={song.artworkUrl} alt={song.title} className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                <div>
                    <p className="font-bold text-lg text-white">{song.title}</p>
                    <p className="text-slate-400">{song.artist}</p>
                    <p className="text-xs text-slate-500 mt-1">
                        Registered by {user?.name || 'Unknown User'} on {song.registrationDate}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                {song.status === 'pending' && (
                    <>
                        <button onClick={() => onUpdateStatus(song.id, 'rejected')} className="flex items-center gap-2 bg-red-500/10 text-red-400 font-bold py-2 px-4 rounded-lg hover:bg-red-500/20 transition-colors">
                           <XCircleIcon className="h-5 w-5" /> Reject
                        </button>
                        <button onClick={() => onUpdateStatus(song.id, 'active')} className="flex items-center gap-2 bg-green-500/10 text-green-300 font-bold py-2 px-4 rounded-lg hover:bg-green-500/20 transition-colors">
                           <CheckCircleIcon className="h-5 w-5" /> Approve
                        </button>
                    </>
                )}
                {song.status === 'active' && (
                     <button onClick={() => onUpdateStatus(song.id, 'expired')} className="flex items-center gap-2 bg-slate-600 text-slate-300 font-bold py-2 px-4 rounded-lg hover:bg-slate-500 transition-colors">
                       <ArchiveBoxXMarkIcon className="h-5 w-5" /> Expire Contract
                    </button>
                )}
            </div>
        </div>
    )
};

const AdminApproval: React.FC<AdminApprovalProps> = ({ songs, users, onUpdateStatus }) => {
    const [filter, setFilter] = useState<StatusFilter>('pending');

    const filteredSongs = useMemo(() => {
        if (filter === 'all') return songs;
        return songs.filter(song => song.status === filter);
    }, [songs, filter]);
    
    const statusCounts = useMemo(() => ({
        all: songs.length,
        pending: songs.filter(s => s.status === 'pending').length,
        active: songs.filter(s => s.status === 'active').length,
        rejected: songs.filter(s => s.status === 'rejected').length,
        expired: songs.filter(s => s.status === 'expired').length,
    }), [songs]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Song Approval Queue</h1>

            <div className="p-2 bg-slate-900/50 rounded-lg flex items-center gap-2 flex-wrap">
                <FilterButton label="Pending Review" value="pending" count={statusCounts.pending} activeFilter={filter} setFilter={setFilter} />
                <FilterButton label="Active" value="active" count={statusCounts.active} activeFilter={filter} setFilter={setFilter} />
                <FilterButton label="Rejected" value="rejected" count={statusCounts.rejected} activeFilter={filter} setFilter={setFilter} />
                <FilterButton label="Expired" value="expired" count={statusCounts.expired} activeFilter={filter} setFilter={setFilter} />
            </div>
            
            <div className="space-y-4">
                {filteredSongs.length > 0 ? (
                    filteredSongs.map(song => (
                        <SongApprovalCard
                            key={song.id}
                            song={song}
                            user={users.find(u => u.id === song.userId)}
                            onUpdateStatus={onUpdateStatus}
                        />
                    ))
                ) : (
                    <div className="text-center py-16 bg-slate-800/50 rounded-lg">
                        <p className="text-slate-400">No songs found in the "{filter}" category.</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default AdminApproval;