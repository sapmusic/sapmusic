
import React, { useState, useMemo } from 'react';
import { User, Role, UserStatus, PayPalDetails, BankDetails } from '../types';
import { SearchIcon } from './icons/SearchIcon';
import { SortAscendingIcon } from './icons/SortAscendingIcon';
import { SortDescendingIcon } from './icons/SortDescendingIcon';

const RoleBadge: React.FC<{ role: Role }> = ({ role }) => {
    const styles = {
        admin: 'bg-amber-500/20 text-amber-300',
        user: 'bg-slate-500/20 text-slate-300',
    };
    return <span className={`text-xs font-bold py-1 px-2.5 rounded-full capitalize ${styles[role]}`}>{role}</span>;
};

const StatusBadge: React.FC<{ status: UserStatus }> = ({ status }) => {
    const styles = {
        active: 'bg-green-500/20 text-green-300',
        deactivated: 'bg-red-500/20 text-red-400',
    };
    return <span className={`text-xs font-bold py-1 px-2.5 rounded-full capitalize ${styles[status]}`}>{status}</span>;
};

const PayoutMethodSummary: React.FC<{ details?: PayPalDetails | BankDetails }> = ({ details }) => {
    if (!details) {
        return <p className="text-xs text-slate-500 italic">Not set</p>;
    }
    if (details.method === 'paypal') {
        return <p className="text-sm text-slate-300">PayPal: {details.email}</p>;
    }
    if (details.method === 'bank') {
        return <p className="text-sm text-slate-300">Bank: ...{details.accountNumberIban.slice(-4)}</p>;
    }
    return null;
}

type SortKey = 'name' | 'email' | 'role' | 'status';

const UserManagement: React.FC<{ users: User[] }> = ({ users }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });

    const filteredAndSortedUsers = useMemo(() => {
        let sortedUsers = [...users];

        if (sortConfig !== null) {
            sortedUsers.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        if (!searchTerm) {
            return sortedUsers;
        }

        const lowercasedFilter = searchTerm.toLowerCase();
        return sortedUsers.filter(user =>
            user.name.toLowerCase().includes(lowercasedFilter) ||
            user.email.toLowerCase().includes(lowercasedFilter)
        );
    }, [users, searchTerm, sortConfig]);

    const requestSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortKey) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <SortAscendingIcon className="h-4 w-4 text-slate-500 opacity-0 group-hover:opacity-100" />;
        }
        if (sortConfig.direction === 'desc') {
            return <SortDescendingIcon className="h-4 w-4 text-amber-400" />;
        }
        return <SortAscendingIcon className="h-4 w-4 text-amber-400" />;
    };

    if (!users) {
        return (
            <div className="space-y-6">
                 <h1 className="text-3xl font-bold text-white">User Management</h1>
                 <div className="text-center py-16 bg-slate-800/50 rounded-lg">
                    <p className="text-slate-400">Loading users...</p>
                 </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-white">User Management</h1>
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <SearchIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input 
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg pl-11 pr-4 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none w-full sm:w-80"
                    />
                </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700/50">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-700/50">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    <button onClick={() => requestSort('name')} className="group flex items-center gap-1">
                                        User {getSortIcon('name')}
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                     <button onClick={() => requestSort('role')} className="group flex items-center gap-1">
                                        Role {getSortIcon('role')}
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                     <button onClick={() => requestSort('status')} className="group flex items-center gap-1">
                                        Status {getSortIcon('status')}
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Payout Method
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {filteredAndSortedUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-700/20">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-white">{user.name}</div>
                                        <div className="text-sm text-slate-400">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <RoleBadge role={user.role} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={user.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <PayoutMethodSummary details={user.payoutMethod} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredAndSortedUsers.length === 0 && (
                    <p className="text-center text-slate-400 py-16">No users found.</p>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
