import React from 'react';
import { 
  Scissors, Building2, Calendar, Smartphone, 
  ArrowUpRight, LogOut, X 
} from 'lucide-react';
import { Organization, TabType } from '../../types';

interface SidebarProps {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  org: Organization;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  org,
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  return (
    <>
      {/* Overlay Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div>
          {/* Logótipo e Nome do SaaS */}
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold shadow-lg shadow-amber-500/10">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-tight text-white">AgendAI</h1>
                <p className="text-xs text-amber-500 font-medium">SaaS Barbearias Premium</p>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="md:hidden text-slate-400 hover:text-white p-1"
              aria-label="Fechar menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Organização Atual */}
          <div className="p-4 mx-4 my-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <Building2 className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="truncate">
                <p className="text-sm font-semibold text-white truncate">{org.name}</p>
                <p className="text-xs text-slate-400 truncate">agend.ai/{org.slug}</p>
              </div>
            </div>
          </div>

          {/* Menu de Navegação */}
          <nav className="px-4 space-y-1.5">
            <button
              onClick={() => { setCurrentTab('dashboard'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-5 h-5" />
              Agenda & Métricas
            </button>

            <button
              onClick={() => { setCurrentTab('services'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                currentTab === 'services'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Scissors className="w-5 h-5" />
              Serviços & Comissões
            </button>

            <button
              onClick={() => { setCurrentTab('booking'); setIsSidebarOpen(false); }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all mt-4"
            >
              <span className="flex items-center gap-3">
                <Smartphone className="w-5 h-5" />
                Página do Cliente
              </span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </nav>
        </div>

        {/* Rodapé da Sidebar */}
        <div className="p-4 border-t border-slate-800/80">
          <button
            onClick={() => { setCurrentTab('onboarding'); setIsSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sair ou Criar Novo Salão
          </button>
        </div>
      </aside>
    </>
  );
};
