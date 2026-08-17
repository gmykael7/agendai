import React from 'react';
import { 
  Scissors, Building2, Calendar, Smartphone, 
  ArrowUpRight, Users, Settings, Wallet, 
  CheckSquare, LayoutDashboard, X, SlidersHorizontal, LogOut
} from 'lucide-react';
import { Organization, TabType } from '../../types';

interface SidebarProps {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  org: Organization | null;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  org,
  isSidebarOpen,
  setIsSidebarOpen,
  onLogout,
}) => {
  const menuItems: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'atendimentos', label: 'Atendimentos', icon: CheckSquare },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'caixa', label: 'Caixa', icon: Wallet },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'ajustes', label: 'Ajustes', icon: SlidersHorizontal },
  ];

  return (
    <>
      {/* Overlay Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#0B1120] border-r border-slate-800/80 flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div>
          {/* Logo e Nome do SaaS */}
          <div className="p-5 border-b border-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shadow-lg shadow-emerald-500/10">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-base tracking-tight text-white">AgendAI</h1>
                <p className="text-[11px] text-emerald-400 font-medium">Gestão de Barbearia</p>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Organização Atual */}
          {org && (
            <div className="px-4 py-3 mx-3 my-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-semibold text-white truncate">{org.name}</p>
                  <p className="text-[10px] text-slate-400 truncate font-mono">agend.ai/{org.slug}</p>
                </div>
              </div>
            </div>
          )}

          {/* Menu Lateral Principal */}
          <nav className="px-3 space-y-1 mt-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Rodapé da Sidebar */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <button
            onClick={() => { setCurrentTab('booking'); setIsSidebarOpen(false); }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
          >
            <span className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Página do Cliente
            </span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (window.confirm('Deseja realmente sair do sistema?')) {
                onLogout();
              }
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair do Sistema
          </button>
        </div>
      </aside>
    </>
  );
};
