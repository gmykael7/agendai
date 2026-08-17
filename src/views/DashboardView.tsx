import React from 'react';
import { DollarSign, Calendar, CheckCircle, Clock } from 'lucide-react';
import { Appointment } from '../types';

interface DashboardViewProps {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  realtimeActive: boolean;
  setRealtimeActive: (val: boolean) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  appointments, 
  setAppointments, 
  realtimeActive, 
  setRealtimeActive 
}) => {
  const faturamentoHoje = appointments
    .filter(a => a.status !== 'canceled')
    .reduce((acc, curr) => acc + curr.price, 0);

  const concluidos = appointments.filter(a => a.status === 'completed').length;
  const agendados = appointments.filter(a => a.status === 'scheduled').length;

  const updateStatus = (id: string, status: 'completed' | 'canceled') => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* BARRA SUPERIOR E STATUS REALTIME */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Painel de Agendamentos</h2>
          <p className="text-sm text-slate-400 mt-1">Visão geral em tempo real dos serviços marcados para hoje.</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-950/80 p-2.5 px-4 rounded-xl border border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${realtimeActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-xs font-mono font-medium text-slate-300">
              Supabase Realtime: {realtimeActive ? 'Conectado' : 'Pausado'}
            </span>
          </div>
          <button 
            onClick={() => setRealtimeActive(!realtimeActive)}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors font-medium ml-2"
          >
            {realtimeActive ? 'Pausar' : 'Reconectar'}
          </button>
        </div>
      </div>

      {/* MÉTRICAS CHAVE DO DIA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Faturamento Previsto</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">R$ {faturamentoHoje.toFixed(2)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Agendamentos Hoje</p>
            <p className="text-2xl font-bold text-white mt-1">{appointments.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Concluídos</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{concluidos}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Pendentes</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">{agendados}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* TABELA / GRADE DE AGENDAMENTOS */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Horários Agendados
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Mostrando {appointments.length} registos
          </span>
        </div>

        <div className="divide-y divide-slate-800/60 overflow-x-auto">
          {appointments.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              Nenhum agendamento registado para hoje.
            </div>
          ) : (
            appointments.map((app) => (
              <div 
                key={app.id} 
                className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-start md:items-center gap-4">
                  <div className="w-14 text-center shrink-0">
                    <span className="text-lg font-bold text-amber-400 font-mono">{app.start_time}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-base">{app.client_name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {app.service_name} • <span className="text-amber-400 font-medium">R$ {app.price.toFixed(2)}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Profissional: <span className="text-slate-300">{app.barber_name}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/60">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    app.status === 'completed' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : app.status === 'canceled'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {app.status === 'completed' ? 'Concluído' : app.status === 'canceled' ? 'Cancelado' : 'Confirmado'}
                  </span>

                  {app.status === 'scheduled' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateStatus(app.id, 'completed')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Concluir
                      </button>
                      <button
                        onClick={() => updateStatus(app.id, 'canceled')}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 rounded-lg text-xs font-medium transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
