

import React from 'react';
import { User, Role } from '../types';

interface UserManagementProps {
  users: User[];
  onToggleStatus: (userId: string) => void;
  currentUser: User;
  onUpdateRole: (userId: string, role: Role) => void;
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
                <p className="font-semibold text-white">{user.name !== user.email ? user.name : user.email}</p>
                {user.name !== user.email && <p className="text-sm text-slate-400">{user.email}</p>}
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

const UserManagement: React.FC<UserManagementProps> = ({ users, onToggleStatus, currentUser, onUpdateRole }) => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">User Management</h1>
      
      <p className="text-slate-400 max-w-3xl">
          From here you can manage user roles and activate or deactivate accounts. New users must register through the standard sign-up page.
      </p>

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
    </div>
  );
};

export default UserManagement;