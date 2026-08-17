import React, { useState } from 'react';
import { 
  SlidersHorizontal, Users, Scissors, Building2, 
  Sparkles, Settings as SettingsIcon 
} from 'lucide-react';
import { Organization, Service, Barber, Appointment } from '../types';
import { TeamView } from './TeamView';
import { ServicesView } from './ServicesView';
import { SettingsView } from './SettingsView';
import { INITIAL_ORG, INITIAL_SERVICES, INITIAL_BARBERS, INITIAL_APPOINTMENTS } from '../data/mockData';

interface AjustesViewProps {
  org: Organization;
  setOrg: React.Dispatch<React.SetStateAction<Organization>>;
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  barbers: Barber[];
  setBarbers: React.Dispatch<React.SetStateAction<Barber[]>>;
  appointments: Appointment[];
  onLoadDemo: (demoData: {
    org: Organization;
    services: Service[];
    barbers: Barber[];
    appointments: Appointment[];
  }) => void;
  onResetAll: () => void;
}

export const AjustesView: React.FC<AjustesViewProps> = ({
  org,
  setOrg,
  services,
  setServices,
  barbers,
  setBarbers,
  appointments,
  onLoadDemo,
  onResetAll,
}) => {
  const [subTab, setSubTab] = useState<'team' | 'services' | 'general'>('team');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* CABEÇALHO GERAL DE AJUSTES */}
      <div className="bg-[#121B2E] p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <SlidersHorizontal className="w-6 h-6 text-emerald-400" />
            Painel de Ajustes & Configurações
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Gerencie sua equipe de barbeiros, catálogo de serviços, comissões e dados do salão.
          </p>
        </div>
      </div>

      {/* NAVEGAÇÃO POR SUB-ABAS */}
      <div className="flex items-center gap-2 bg-[#121B2E] p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
        <button
          onClick={() => setSubTab('team')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            subTab === 'team'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Barbeiros & Comissões ({barbers.length})
        </button>

        <button
          onClick={() => setSubTab('services')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            subTab === 'services'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Scissors className="w-4 h-4" />
          Catálogo de Serviços ({services.length})
        </button>

        <button
          onClick={() => setSubTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            subTab === 'general'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Perfil do Salão & Horários
        </button>
      </div>

      {/* CONTEÚDO DA SUB-ABA */}
      <div className="pt-2">
        {subTab === 'team' && (
          <TeamView
            barbers={barbers}
            setBarbers={setBarbers}
            appointments={appointments}
          />
        )}

        {subTab === 'services' && (
          <ServicesView
            services={services}
            setServices={setServices}
          />
        )}

        {subTab === 'general' && (
          <SettingsView
            org={org}
            setOrg={setOrg}
            onLoadDemo={onLoadDemo}
            onResetAll={onResetAll}
          />
        )}
      </div>
    </div>
  );
};
