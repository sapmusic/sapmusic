
import React from 'react';
// FIX: Updated imports to fetch ROLES from constants and RoleDefinition from types.
import { ROLES } from '../constants';
import { RoleDefinition } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { AddIcon } from './icons/AddIcon';

const PermissionItem: React.FC<{ text: string, enabled: boolean }> = ({ text, enabled }) => (
    <li className={`flex items-center gap-2 ${enabled ? 'text-slate-300' : 'text-slate-500'}`}>
        <CheckCircleIcon className={`w-5 h-5 ${enabled ? 'text-green-400' : 'text-slate-600'}`} />
        <span>{text}</span>
    </li>
);

const RoleCard: React.FC<{ role: RoleDefinition }> = ({ role }) => (
    <div className="bg-slate-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold text-amber-400 capitalize">{role.name}</h2>
        <p className="text-sm text-slate-400 mt-1 mb-4">{role.description}</p>
        <ul className="space-y-2 text-sm">
            <PermissionItem text="View Agreements" enabled={role.permissions.canViewAgreements} />
            <PermissionItem text="Register New Songs" enabled={role.permissions.canRegisterSongs} />
            <PermissionItem text="Manage All Users" enabled={role.permissions.canManageUsers} />
            <PermissionItem text="Approve Songs" enabled={role.permissions.canApproveSongs} />
            <PermissionItem text="Manage Earnings" enabled={role.permissions.canManageEarnings} />
            <PermissionItem text="Manage Payouts" enabled={role.permissions.canManagePayouts} />
        </ul>
    </div>
)

const ManageRoles: React.FC = () => {
  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Manage Roles & Permissions</h1>
            <button className="flex items-center gap-2 bg-slate-700 text-slate-400 font-bold py-2 px-4 rounded-lg cursor-not-allowed" disabled>
                <AddIcon className="h-5 w-5" />
                Add New Role
            </button>
        </div>
        <p className="text-slate-400 max-w-2xl">
            This section provides an overview of the user roles in the application. In a future update, you'll be able to create new roles and customize their permissions.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ROLES.map(role => (
                <RoleCard key={role.id} role={role} />
            ))}
        </div>
    </div>
  );
};

export default ManageRoles;
