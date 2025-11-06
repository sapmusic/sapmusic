import React from 'react';
import { PayoutRequest, User, PayoutStatus, BankDetails, PayPalDetails } from '../types';

interface ManagePayoutsProps {
    requests: PayoutRequest[];
    users: User[];
    onUpdateStatus: (payoutId: string, status: PayoutStatus) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const PayoutMethodDetails: React.FC<{ details?: PayPalDetails | BankDetails }> = ({ details }) => {
    if (!details) {
        return <p className="text-xs text-slate-400 italic">No payout method set</p>;
    }
    if (details.method === 'paypal') {
        return <p className="text-xs text-slate-300 font-mono">PayPal: {details.email}</p>;
    }
    if (details.method === 'bank') {
        return (
            <div className="text-xs text-slate-300 font-mono">
                <p>Bank: {details.bankName}, {details.country}</p>
                <p>Holder: {details.accountHolderName}</p>
                <p>Acct/IBAN: ...{details.accountNumberIban.slice(-4)} | SWIFT: {details.swiftBic}</p>
            </div>
        );
    }
    return null;
}

const ManagePayouts: React.FC<ManagePayoutsProps> = ({ requests, users, onUpdateStatus }) => {
    
    const sortedRequests = [...requests].sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
    
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
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Manage Payouts</h1>
            
            <div className="bg-slate-800/50 rounded-lg overflow-hidden">
                <div className="divide-y divide-slate-700/50">
                     <div className="p-4 grid grid-cols-4 gap-4 text-xs font-semibold text-slate-400 uppercase bg-slate-900/50">
                       <span>User & Payout Details</span>
                       <span className="text-center">Date Requested</span>
                       <span className="text-center">Amount</span>
                       <span className="text-right">Actions</span>
                    </div>
                    {sortedRequests.length > 0 ? sortedRequests.map(request => {
                        const user = users.find(u => u.id === request.userId);
                        return (
                             <div key={request.id} className="p-4 grid grid-cols-4 gap-4 items-center text-sm">
                                <div>
                                    <p className="font-semibold text-white">{user?.name || 'Unknown User'}</p>
                                    <PayoutMethodDetails details={user?.payoutMethod} />
                                </div>
                                <div className="text-center text-slate-300">{new Date(request.requestDate).toLocaleDateString()}</div>
                                <div className="text-center font-semibold text-lg text-amber-400">{formatCurrency(request.amount)}</div>
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <StatusBadge status={request.status} />
                                        {request.status === 'pending' && (
                                            <button onClick={() => onUpdateStatus(request.id, 'approved')} className="bg-blue-500/20 text-blue-300 font-semibold text-xs py-1 px-3 rounded-full hover:bg-blue-500/40">Approve</button>
                                        )}
                                         {request.status === 'approved' && (
                                            <button onClick={() => onUpdateStatus(request.id, 'paid')} className="bg-green-500/20 text-green-300 font-semibold text-xs py-1 px-3 rounded-full hover:bg-green-500/40">Mark as Paid</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    }) : (
                        <p className="text-center text-slate-400 py-16">No payout requests have been made.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManagePayouts;
