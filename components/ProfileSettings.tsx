import React, { useState, useEffect } from 'react';
import { User, PayPalDetails, BankDetails } from '../types';
import { COUNTRIES } from '../constants';

interface ProfileSettingsProps {
    user: User;
    onUpdateUser: (user: User) => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onUpdateUser }) => {
    const [name, setName] = useState(user.name);
    const [payoutMethod, setPayoutMethod] = useState<'paypal' | 'bank'>(user.payoutMethod?.method || 'paypal');
    const [paypalEmail, setPaypalEmail] = useState(user.payoutMethod?.method === 'paypal' ? user.payoutMethod.email : '');
    const [bankDetails, setBankDetails] = useState<BankDetails>(user.payoutMethod?.method === 'bank' ? user.payoutMethod : {
        method: 'bank',
        accountHolderName: '',
        bankName: '',
        swiftBic: '',
        accountNumberIban: '',
        country: 'United States',
    });
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if(successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const handleBankDetailChange = (field: keyof Omit<BankDetails, 'method'>, value: string) => {
        setBankDetails(prev => ({ ...prev, [field]: value }));
    }

    const handleSaveChanges = () => {
        let finalPayoutMethod: PayPalDetails | BankDetails | undefined;
        if(payoutMethod === 'paypal') {
            finalPayoutMethod = { method: 'paypal', email: paypalEmail };
        } else {
            finalPayoutMethod = bankDetails;
        }

        const updatedUser: User = {
            ...user,
            name,
            payoutMethod: finalPayoutMethod,
        };
        onUpdateUser(updatedUser);
        setSuccessMessage('Profile updated successfully!');
    }
    
    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-white">Profile Settings</h1>

            <div className="bg-slate-800 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-amber-400 mb-4">Your Information</h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-slate-300 block mb-1">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-amber-400 mb-4">Payout Method</h2>
                <div className="flex gap-2 mb-4">
                    <button onClick={() => setPayoutMethod('paypal')} className={`px-4 py-2 text-sm font-semibold rounded-md ${payoutMethod === 'paypal' ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-200'}`}>PayPal</button>
                    <button onClick={() => setPayoutMethod('bank')} className={`px-4 py-2 text-sm font-semibold rounded-md ${payoutMethod === 'bank' ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-200'}`}>Bank Transfer</button>
                </div>
                <div className="space-y-4">
                    {payoutMethod === 'paypal' && (
                         <div>
                            <label className="text-sm text-slate-300 block mb-1">PayPal Email</label>
                            <input
                                type="email"
                                value={paypalEmail}
                                onChange={e => setPaypalEmail(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                placeholder="your.email@example.com"
                            />
                        </div>
                    )}
                     {payoutMethod === 'bank' && (
                         <div className="space-y-4 pt-4 border-t border-slate-700/50">
                            <h3 className="text-md font-semibold text-slate-200">Bank Account Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-slate-300 block mb-1">Account Holder Name</label>
                                    <input type="text" value={bankDetails.accountHolderName} onChange={e => handleBankDetailChange('accountHolderName', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2" />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-300 block mb-1">Bank Name</label>
                                    <input type="text" value={bankDetails.bankName} onChange={e => handleBankDetailChange('bankName', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-slate-300 block mb-1">SWIFT / BIC Code</label>
                                    <input type="text" value={bankDetails.swiftBic} onChange={e => handleBankDetailChange('swiftBic', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2" />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-300 block mb-1">Account Number / IBAN</label>
                                    <input type="text" value={bankDetails.accountNumberIban} onChange={e => handleBankDetailChange('accountNumberIban', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-slate-300 block mb-1">Country</label>
                                <select value={bankDetails.country} onChange={e => handleBankDetailChange('country', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2">
                                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                         </div>
                    )}
                </div>
            </div>
            
            <div className="flex justify-end items-center gap-4">
                {successMessage && <p className="text-green-400 text-sm">{successMessage}</p>}
                <button
                    onClick={handleSaveChanges}
                    className="bg-amber-500 text-slate-900 font-bold py-2 px-6 rounded-lg hover:bg-amber-400 transition-colors"
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
};

export default ProfileSettings;