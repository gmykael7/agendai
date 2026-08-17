import React from 'react';
import { Menu } from 'lucide-react';
import { Organization } from '../../types';

interface HeaderProps {
  org: Organization | null;
  onOpenSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ org, onOpenSidebar }) => {
  return (
    <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 text-slate-300 hover:text-white rounded-lg bg-slate-800"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-bold text-white tracking-tight">
          {org ? org.name : 'AgendAI'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-mono text-emerald-400">Live</span>
      </div>
    </header>
  );
};
