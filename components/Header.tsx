

import React from 'react';
import { LogoIcon } from './icons/LogoIcon';
import { AddIcon } from './icons/AddIcon';
import { MenuIcon } from './icons/MenuIcon';

interface HeaderProps {
  onRegisterNew: () => void;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onRegisterNew, onToggleSidebar }) => {
  return (
    <header className="flex-shrink-0 bg-slate-900 border-b border-slate-700/50 px-4 md:px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="md:hidden p-1 -ml-1 text-slate-400 hover:text-white">
            <MenuIcon className="h-6 w-6" />
        </button>
        <LogoIcon className="h-8 w-8 text-amber-400" />
        <div className="hidden sm:block">
          <h1 className="text-lg font-bold text-slate-100">Sap Music Group</h1>
          <p className="text-xs text-slate-400">Powered by Sap Media Publishing LLC</p>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-6">
        <button 
          onClick={onRegisterNew}
          className="flex items-center gap-2 bg-amber-500 text-slate-900 font-bold py-2 px-3 md:px-4 rounded-lg hover:bg-amber-400 transition-colors duration-200"
        >
          <AddIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Register Song</span>
        </button>
        <div className="hidden lg:block text-right text-xs text-slate-500">
          <p>5830 E 2nd St, Ste 7000</p>
          <p>29084 Casper, WY 82609 United States</p>
        </div>
      </div>
    </header>
  );
};

export default Header;