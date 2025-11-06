import React, { useState, useMemo } from 'react';
import { RegisteredSong, Earning, User, PayoutRequest } from '../types';
import { EarningsIcon } from './icons/EarningsIcon';
import RequestPayoutModal from './RequestPayoutModal';
import { PAYOUT_THRESHOLD } from '../constants';

interface UserEarningsProps {
  songs: RegisteredSong[];
  earnings: Earning[];
  currentUser: User;
  payoutRequests: PayoutRequest[];
  onPayoutRequest: (request: Omit<PayoutRequest, 'id' | 'status'>) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const UserEarnings: React.FC<UserEarningsProps> = ({ songs, earnings, currentUser, payoutRequests, onPayoutRequest }) => {
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

    const { userLifetimeEarnings, songEarningsBreakdown } = useMemo(() => {
        let total = 0;
        const breakdown: { song: RegisteredSong, userShare: number, totalEarnings: number }[] = [];
        
        songs.forEach(song => {
            const writer = song.writers.find(w => w.writerId === currentUser.id || w.name === currentUser.name);
            if (writer) {
                const songTotalEarnings = earnings.filter(e => e.songId === song.id).reduce((sum, e) => sum + e.amount, 0);
                const userShare = songTotalEarnings * (writer.split / 100);
                total += userShare;
                breakdown.push({ song, userShare, totalEarnings: songTotalEarnings });
            }
        });

        return { userLifetimeEarnings: total, songEarningsBreakdown: breakdown };
    }, [songs, earnings, currentUser]);

    const totalWithdrawnOrPending = useMemo(() => {
        // A request locks the funds, so we deduct all statuses from the available balance.
        return payoutRequests.reduce((sum, p) => sum + p.amount, 0);
    }, [payoutRequests]);
    
    const totalPaidOut = useMemo(() => {
        // For display purposes, "paid out" means actually paid or approved for payment.
         return payoutRequests
            .filter(p => p.status === 'paid' || p.status === 'approved')
            .reduce((sum, p) => sum + p.amount, 0);
    }, [payoutRequests]);

    const availableBalance = userLifetimeEarnings - totalWithdrawnOrPending;

    const recentTransactions = useMemo(() => {
        const userSongIds = new Set(songs.map(s => s.id));
        return earnings
            .filter(e => userSongIds.has(e.songId))
            .sort((a, b) => new Date(b.earningDate).getTime() - new Date(a.earningDate).getTime())
            .slice(0, 10);
    }, [songs, earnings]);

    const handlePayoutRequest = (amount: number) => {
        onPayoutRequest({
            userId: currentUser.id,
            amount,
            requestDate: new Date().toISOString().split('T')[0],
        });
        setIsPayoutModalOpen(false);
    };

    const StatusBadge: React.FC<{ status: PayoutRequest['status'] }> = ({ status }) => {
        const baseClasses = 'text-xs font-bold py-1 px-2.5 rounded-full capitalize';
        const styles = {
            pending: 'bg-yellow-500/20 text-yellow-300',
            approved: 'bg-blue-500/20 text-blue-300',
            paid: 'bg-green-500/20 text-green-300',
        };
        return <span className={`${baseClasses} ${styles[status]}`}>{status}</span>
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">Your Earnings & Payouts</h1>
            
            <div className="p-6 bg-slate-800 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
                    <div>
                        <p className="text-sm text-slate-400">Total Lifetime Earnings</p>
                        <p className="text-3xl font-bold text-green-400">{formatCurrency(userLifetimeEarnings)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Total Paid Out</p>
                        <p className="text-3xl font-bold text-slate-300">{formatCurrency(totalPaidOut)}</p>
                    </div>
                    <div className="bg-slate-700/50 p-4 rounded-md">
                        <p className="text-sm text-amber-300">Available Balance</p>
                        <p className="text-3xl font-bold text-amber-400">{formatCurrency(availableBalance)}</p>
                    </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-700 flex flex-col items-end">
                    <button
                        onClick={() => setIsPayoutModalOpen(true)}
                        disabled={availableBalance < PAYOUT_THRESHOLD}
                        className="bg-amber-500 text-slate-900 font-bold py-2 px-6 rounded-lg hover:bg-amber-400 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                        Request Payout
                    </button>
                    <p className="text-xs text-slate-500 mt-2">
                        A minimum of {formatCurrency(PAYOUT_THRESHOLD)} is required for withdrawal.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 space-y-4">
                     <h2 className="text-xl font-semibold text-white">Earnings by Song</h2>
                     <div className="space-y-3">
                         {songEarningsBreakdown.map(({ song, userShare, totalEarnings }) => (
                            <div key={song.id} className="p-4 flex items-center justify-between bg-slate-800/50 hover:bg-slate-700/50 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <img src={song.artworkUrl} alt={song.title} className="w-12 h-12 rounded-md object-cover"/>
                                    <div>
                                        <p className="font-semibold text-white">{song.title}</p>
                                        <p className="text-sm text-slate-400">{song.artist}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg text-green-400">{formatCurrency(userShare)}</p>
                                    <p className="text-xs text-slate-400">from {formatCurrency(totalEarnings)} total</p>
                                </div>
                            </div>
                         ))}
                     </div>
                 </div>
                 <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-white">Recent Transactions</h2>
                     <div className="space-y-3">
                        {recentTransactions.length > 0 ? recentTransactions.map(earning => {
                            const song = songs.find(s => s.id === earning.songId);
                            const writer = song?.writers.find(w => w.writerId === currentUser.id || w.name === currentUser.name);
                            const userShare = writer ? earning.amount * (writer.split / 100) : 0;
                            return (
                                <div key={earning.id} className="bg-slate-800/50 p-3 rounded-md text-sm">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-white">{formatCurrency(userShare)}</p>
                                        <p className="text-slate-400">{new Date(earning.earningDate).toLocaleDateString()}</p>
                                    </div>
                                    <p className="text-xs text-slate-300">
                                        {song ? `${song.title}` : 'Unknown Song'}
                                    </p>
                                </div>
                            )
                        }) : (
                            <p className="text-sm text-slate-400 text-center py-8">No earnings have been recorded yet.</p>
                        )}
                    </div>
                 </div>
            </div>

            <div>
                <h2 className="text-xl font-semibold text-white mb-4">Payout History</h2>
                <div className="bg-slate-800/50 rounded-lg overflow-hidden">
                    <div className="divide-y divide-slate-700/50">
                        <div className="p-4 grid grid-cols-3 gap-4 text-xs font-semibold text-slate-400 uppercase">
                           <span>Date Requested</span>
                           <span className="text-right">Amount</span>
                           <span className="text-right">Status</span>
                        </div>
                        {payoutRequests.length > 0 ? payoutRequests.map(payout => (
                            <div key={payout.id} className="p-4 grid grid-cols-3 gap-4 items-center text-sm">
                                <span className="text-slate-300">{new Date(payout.requestDate).toLocaleDateString()}</span>
                                <span className="text-right font-semibold text-white">{formatCurrency(payout.amount)}</span>
                                <div className="text-right">
                                    <StatusBadge status={payout.status} />
                                </div>
                            </div>
                        )) : (
                             <p className="text-center text-slate-400 py-10">You have not made any payout requests.</p>
                        )}
                    </div>
                </div>
            </div>
            
            {isPayoutModalOpen && (
                <RequestPayoutModal
                    availableBalance={availableBalance}
                    payoutThreshold={PAYOUT_THRESHOLD}
                    onClose={() => setIsPayoutModalOpen(false)}
                    onRequest={handlePayoutRequest}
                />
            )}
        </div>
    );
};

export default UserEarnings;