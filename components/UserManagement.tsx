
import React, { useState } from 'react';
import { User, Role } from '../types';
import { MailIcon } from './icons/MailIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { UserPlusIcon } from './icons/UserPlusIcon';

interface UserManagementProps {
  users: User[];
  onToggleStatus: (userId: string) => void;
  currentUser: User;
  onUpdateRole: (userId: string, role: Role) => void;
  onCreateUser: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
}

const UserCard: React.FC<{ 
    user: User, 
    onToggleStatus: () => void, 
    onUpdateRole: (role: Role) => void,
    canEdit: boolean 
}> = ({ user, onToggleStatus, onUpdateRole, canEdit }) => {
    const isDeactivated = user.status === 'deactivated';
    return (
        <div className="bg-slate-800 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors hover:bg-slate-700/50">
            <div>
                <p className="font-semibold text-white">{user.name}</p>
                <p className="text-sm text-slate-400">{user.email}</p>
                {user.hasProfile === false && (
                    <p className="text-xs text-yellow-400 mt-1">This user is registered but has no profile record. Management features are disabled until their profile is created.</p>
                )}
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                 <div className="flex-grow sm:flex-grow-0">
                    <label htmlFor={`role-${user.id}`} className="sr-only">Role</label>
                    <select 
                        id={`role-${user.id}`}
                        value={user.role}
                        disabled={!canEdit}
                        onChange={(e) => onUpdateRole(e.target.value as Role)}
                        className="bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-sm font-semibold text-slate-200 focus:ring-2 focus:ring-amber-400 focus:outline-none disabled:bg-slate-800/50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isDeactivated ? 'text-red-400' : 'text-green-400'}`}>
                        {isDeactivated ? 'Deactivated' : 'Active'}
                    </span>
                    <button 
                      onClick={onToggleStatus} 
                      disabled={!canEdit}
                      className={`w-12 h-6 rounded-full relative p-1 transition-colors duration-200 ${isDeactivated ? 'bg-slate-600' : 'bg-green-500'} disabled:bg-slate-700 disabled:cursor-not-allowed`}
                      aria-label={`Set user to ${isDeactivated ? 'active' : 'deactivated'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-200 ${isDeactivated ? 'translate-x-0' : 'translate-x-6'}`} />
                    </button>
                </div>
            </div>
        </div>
    );
}

const CreateUserForm: React.FC<{ onCreateUser: UserManagementProps['onCreateUser'] }> = ({ onCreateUser }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        const result = await onCreateUser(email, password);
        
        if (result.success) {
            setSuccess('User account created successfully! They can now log in directly.');
            setEmail('');
            setPassword('');
        } else {
            setError(result.error?.message || 'An unknown error occurred.');
        }

        setLoading(false);
    };

    return (
        <div className="max-w-xl mx-auto">
            <div className="bg-slate-800 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-amber-400 mb-4">Create New User Account</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                     {error && (
                        <p className="text-sm text-red-400 text-center">{error}</p>
                    )}
                    {success && (
                        <p className="text-sm text-green-400 text-center">{success}</p>
                    )}
                     <div>
                        <label htmlFor="email" className="text-sm font-medium text-slate-300 block mb-1">Email Address *</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <MailIcon className="h-5 w-5 text-slate-400" />
                            </div>
                            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="you@example.com" required />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="password" className="text-sm font-medium text-slate-300 block mb-1">Password *</label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <LockClosedIcon className="h-5 w-5 text-slate-400" />
                            </div>
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none" placeholder="••••••••" required minLength={6} />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Password should be at least 6 characters.</p>
                    </div>
                    <div className="pt-2 flex justify-end">
                        <button type="submit" disabled={loading} className="flex items-center gap-2 w-full sm:w-auto bg-amber-500 text-slate-900 font-bold py-2 px-6 rounded-lg hover:bg-amber-400 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors">
                            <UserPlusIcon className="h-5 w-5" />
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </div>
                </form>
                <p className="text-xs text-slate-500 mt-4 text-center">
                    A confirmation email will <span className="font-bold">not</span> be sent. The user will be automatically confirmed and can log in immediately.
                </p>
            </div>
        </div>
    );
};


const UserManagement: React.FC<UserManagementProps> = ({ users, onToggleStatus, currentUser, onUpdateRole, onCreateUser }) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'create'>('manage');
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">User Management</h1>
      
      <div className="border-b border-slate-700">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button
                onClick={() => setActiveTab('manage')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'manage'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                }`}
            >
                Manage Users
            </button>
            <button
                onClick={() => setActiveTab('create')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'create'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                }`}
            >
                Create New User
            </button>
        </nav>
      </div>

      {activeTab === 'manage' && (
        <div className="max-w-3xl mx-auto space-y-4">
          {users.map(user => {
              // An admin cannot edit their own role/status, another admin, or a user without a database profile.
              const canEdit = currentUser.id !== user.id && user.role !== 'admin' && user.hasProfile !== false;
              return (
                  <UserCard
                      key={user.id}
                      user={user}
                      onToggleStatus={() => onToggleStatus(user.id)}
                      onUpdateRole={(newRole) => onUpdateRole(user.id, newRole)}
                      canEdit={canEdit}
                  />
              )
          })}
        </div>
      )}
      {activeTab === 'create' && (
        <CreateUserForm onCreateUser={onCreateUser} />
      )}
    </div>
  );
};

export default UserManagement;
