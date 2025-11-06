import React from 'react';
import { DashboardIcon } from './icons/DashboardIcon';
import { AgreementIcon } from './icons/AgreementIcon';
import { WritersIcon } from './icons/WritersIcon';
import { AddIcon } from './icons/AddIcon';
import { Role } from '../types';
import { UsersIcon } from './icons/UsersIcon';
import { EarningsIcon } from './icons/EarningsIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { KeyIcon } from './icons/KeyIcon';
import { CreditCardIcon } from './icons/CreditCardIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { CheckBadgeIcon } from './icons/CheckBadgeIcon';
import { InboxIcon } from './icons/InboxIcon';
import { SyncIcon } from './icons/SyncIcon';
import { EditIcon } from './icons/EditIcon';

type View = 'dashboard' | 'new-song' | 'agreements' | 'writers' | 'user-management' | 'earnings' | 'profile' | 'manager-roles' | 'payouts' | 'approval' | 'live-support' | 'sync-licensing' | 'agreement-template';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  userRole: Role;
  onLogout: () => void;
  isAgreementEditorEnabled: boolean;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
  return (
    <li
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors duration-200 ${
        isActive
          ? 'bg-amber-400/10 text-amber-400 font-semibold'
          : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
      }`}
    >
      {icon}
      <span>{label}</span>
    </li>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, userRole, onLogout, isAgreementEditorEnabled }) => {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-700/50 p-6 flex-shrink-0 flex flex-col">
      <nav className="flex-1">
        <ul className="space-y-2">
          <NavItem
            icon={<DashboardIcon className="h-5 w-5" />}
            label="Dashboard"
            isActive={currentView === 'dashboard'}
            onClick={() => setCurrentView('dashboard')}
          />
          <NavItem
            icon={<AgreementIcon className="h-5 w-5" />}
            label="Agreements"
            isActive={currentView === 'agreements'}
            onClick={() => setCurrentView('agreements')}
          />
          <NavItem
              icon={<WritersIcon className="h-5 w-5" />}
              label={userRole === 'admin' ? "Writers Library" : "My Writers"}
              isActive={currentView === 'writers'}
              onClick={() => setCurrentView('writers')}
            />
          
          {userRole === 'user' && (
             <NavItem
                icon={<EarningsIcon className="h-5 w-5" />}
                label="Earnings"
                isActive={currentView === 'earnings'}
                onClick={() => setCurrentView('earnings')}
              />
           )}
          
          {userRole === 'admin' && (
            <>
               <div className="my-4 border-t border-slate-700/50" />
               <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Admin</h3>
               <NavItem
                icon={<CheckBadgeIcon className="h-5 w-5" />}
                label="Song Approvals"
                isActive={currentView === 'approval'}
                onClick={() => setCurrentView('approval')}
              />
               <NavItem
                icon={<SyncIcon className="h-5 w-5" />}
                label="Sync Licensing"
                isActive={currentView === 'sync-licensing'}
                onClick={() => setCurrentView('sync-licensing')}
              />
              <NavItem
                icon={<InboxIcon className="h-5 w-5" />}
                label="Live Support"
                isActive={currentView === 'live-support'}
                onClick={() => setCurrentView('live-support')}
              />
               <NavItem
                icon={<UsersIcon className="h-5 w-5" />}
                label="User Management"
                isActive={currentView === 'user-management'}
                onClick={() => setCurrentView('user-management')}
              />
               <NavItem
                icon={<EarningsIcon className="h-5 w-5" />}
                label="Manage Earnings"
                isActive={currentView === 'earnings'}
                onClick={() => setCurrentView('earnings')}
              />
               <NavItem
                icon={<CreditCardIcon className="h-5 w-5" />}
                label="Payouts"
                isActive={currentView === 'payouts'}
                onClick={() => setCurrentView('payouts')}
              />
              <NavItem
                icon={<KeyIcon className="h-5 w-5" />}
                label="Manager Roles"
                isActive={currentView === 'manager-roles'}
                onClick={() => setCurrentView('manager-roles')}
              />
              {isAgreementEditorEnabled && (
                <NavItem
                  icon={<EditIcon className="h-5 w-5" />}
                  label="Agreement Template"
                  isActive={currentView === 'agreement-template'}
                  onClick={() => setCurrentView('agreement-template')}
                />
              )}
            </>
          )}

          <div className="my-4 border-t border-slate-700/50" />
          
          <NavItem
            icon={<UserCircleIcon className="h-5 w-5" />}
            label="Profile"
            isActive={currentView === 'profile'}
            onClick={() => setCurrentView('profile')}
          />
          <NavItem
            icon={<LogoutIcon className="h-5 w-5" />}
            label="Logout"
            isActive={false}
            onClick={onLogout}
          />
        </ul>
      </nav>
      <div className="mt-auto">
        {userRole === 'user' && (
            <button 
              onClick={() => setCurrentView('new-song')}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 text-slate-900 font-bold py-3 px-4 rounded-lg hover:bg-amber-400 transition-colors duration-200"
            >
              <AddIcon className="h-5 w-5" />
              Register New Song
            </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;