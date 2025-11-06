import React, { useState } from 'react';
import { XIcon } from './icons/XIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';

interface RequestPayoutModalProps {
  availableBalance: number;
  payoutThreshold: number;
  onClose: () => void;
  onRequest: (amount: number) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

const RequestPayoutModal: React.FC<RequestPayoutModalProps> = ({ availableBalance, payoutThreshold, onClose, onRequest }) => {
    const [amount, setAmount] = useState<number | ''>('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (amount === '' || amount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }
        if (amount < payoutThreshold) {
            setError(`The minimum payout amount is ${formatCurrency(payoutThreshold)}.`);
            return;
        }
        if (amount > availableBalance) {
            setError('Requested amount cannot exceed your available balance.');
            return;
        }
        onRequest(Number(amount));
    };

    return (
        <div
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full flex flex-col shadow-2xl shadow-slate-950/50"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">Request a Payout</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                <main className="p-6 space-y-4">
                    <p className="text-sm text-slate-400">
                        Your available balance is <span className="font-bold text-amber-400">{formatCurrency(availableBalance)}</span>.
                    </p>
                    <div>
                        <label className="text-sm text-slate-300 block mb-1">Amount to withdraw (USD) *</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <DollarSignIcon className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => {
                                    setAmount(e.target.value === '' ? '' : parseFloat(e.target.value));
                                    setError('');
                                }}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md pl-10 pr-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                placeholder={`e.g. ${payoutThreshold}`}
                                max={availableBalance}
                                min={payoutThreshold}
                            />
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                </main>
                <footer className="flex-shrink-0 flex items-center justify-end gap-4 p-4 border-t border-slate-700 bg-slate-800/50">
                    <button
                        onClick={onClose}
                        className="bg-slate-700 text-slate-200 font-bold py-2 px-4 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="bg-amber-500 text-slate-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors"
                    >
                        Submit Request
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default RequestPayoutModal;