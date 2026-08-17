import React, { useState } from 'react';
import { 
  DollarSign, Calendar, CheckCircle, Clock, Plus, 
  UserCheck, Smartphone, X, Filter, Sparkles, Phone, Scissors
} from 'lucide-react';
import { Appointment, Service, Barber, Organization } from '../types';

interface DashboardViewProps {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  services: Service[];
  barbers: Barber[];
  org: Organization;
  onNavigateToBooking: () => void;
  onNavigateToServices: () => void;
  onNavigateToTeam: () => void;
  realtimeActive: boolean;
  setRealtimeActive: (val: boolean) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  appointments, 
  setAppointments,
  services,
  barbers,
  org,
  onNavigateToBooking,
  onNavigateToServices,
  onNavigateToTeam,
  realtimeActive, 
  setRealtimeActive 
}) => {
  const [showManualModal, setShowManualModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'completed' | 'canceled'>('all');

  // Form State para agendamento manual
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || '');
  const [selectedBarberId, setSelectedBarberId] = useState(barbers[0]?.id || '');
  const [startTime, setStartTime] = useState('10:00');

  const faturamentoHoje = appointments
    .filter(a => a.status !== 'canceled')
    .reduce((acc, curr) => acc + curr.price, 0);

  const concluidos = appointments.filter(a => a.status === 'completed').length;
  const agendados = appointments.filter(a => a.status === 'scheduled').length;

  const filteredAppointments = appointments.filter(a => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  const updateStatus = (id: string, status: 'completed' | 'canceled') => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const handleCreateManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    const srv = services.find(s => s.id === selectedServiceId) || services[0];
    const brb = barbers.find(b => b.id === selectedBarberId) || barbers[0];

    if (!srv || !brb) {
      alert('Cadastre ao menos um serviço e um barbeiro antes de criar agendamentos.');
      return;
    }

    const created: Appointment = {
      id: 'app-' + Date.now(),
      client_name: clientName.trim(),
      client_phone: clientPhone.trim() || 'Não informado',
      service_id: srv.id,
      service_name: srv.name,
      barber_id: brb.id,
      barber_name: brb.full_name,
      start_time: startTime,
      price: srv.price,
      status: 'scheduled',
    };

    setAppointments(prev => [created, ...prev]);
    setClientName('');
    setClientPhone('');
    setShowManualModal(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* BARRA SUPERIOR E STATUS REALTIME */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Painel de Agendamentos</h2>
          <p className="text-sm text-slate-400 mt-1">Visão geral em tempo real dos atendimentos de hoje.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              if (services.length === 0 || barbers.length === 0) {
                alert('Configure seus serviços e barbeiros antes de agendar.');
              } else {
                setSelectedServiceId(services[0]?.id || '');
                setSelectedBarberId(barbers[0]?.id || '');
                setShowManualModal(true);
              }
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            Novo Agendamento
          </button>

          <div className="flex items-center gap-2 bg-slate-950/80 p-2 px-3 rounded-xl border border-slate-800">
            <span className={`w-2.5 h-2.5 rounded-full ${realtimeActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-xs font-mono text-slate-300">
              {realtimeActive ? 'Realtime Conectado' : 'Pausado'}
            </span>
          </div>
        </div>
      </div>

      {/* AVISOS DE CONFIGURAÇÃO INICIAL (SE FALTAR SERVIÇOS OU BARBEIROS) */}
      {(services.length === 0 || barbers.length === 0) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
          <div>
            <h4 className="font-bold text-amber-400 text-sm">Configure seu estabelecimento para começar</h4>
            <p className="text-xs text-slate-300 mt-0.5">
              {services.length === 0 && barbers.length === 0
                ? 'Cadastre seus primeiros serviços e os profissionais da sua equipe.'
                : services.length === 0
                ? 'Cadastre os serviços oferecidos (cortes, barba, etc.) no catálogo.'
                : 'Cadastre os barbeiros da sua equipe para liberar a agenda.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {services.length === 0 && (
              <button
                onClick={onNavigateToServices}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors"
              >
                Cadastrar Serviços
              </button>
            )}
            {barbers.length === 0 && (
              <button
                onClick={onNavigateToTeam}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
              >
                Cadastrar Barbeiro
              </button>
            )}
          </div>
        </div>
      )}

      {/* MÉTRICAS CHAVE DO DIA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">Faturamento Previsto</p>
            <p className="text-2xl font-bold text-amber-400 mt-1 font-mono">R$ {faturamentoHoje.toFixed(2)}</p>
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

      {/* TABELA / GRADE DE AGENDAMENTOS COM FILTROS */}
      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-white flex items-center gap-2 text-base">
            <Clock className="w-5 h-5 text-amber-500" />
            Horários Agendados
          </h3>

          {/* Filtros de status */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['all', 'scheduled', 'completed', 'canceled'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === st
                    ? 'bg-slate-800 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'all' ? 'Todos' : st === 'scheduled' ? 'Confirmados' : st === 'completed' ? 'Concluídos' : 'Cancelados'}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-800/60 overflow-x-auto">
          {appointments.length === 0 ? (
            <div className="p-12 text-center max-w-sm mx-auto space-y-4">
              <div className="w-14 h-14 bg-slate-800/80 text-slate-400 rounded-2xl flex items-center justify-center mx-auto border border-slate-700/50">
                <Calendar className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Nenhum agendamento para hoje</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Os agendamentos feitos pelos seus clientes na página pública aparecerão aqui em tempo real.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={onNavigateToBooking}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Abrir Página do Cliente
                </button>
              </div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Nenhum agendamento encontrado para o filtro selecionado.
            </div>
          ) : (
            filteredAppointments.map((app) => (
              <div 
                key={app.id} 
                className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-start md:items-center gap-4">
                  <div className="w-16 text-center shrink-0">
                    <span className="text-xl font-bold text-amber-400 font-mono">{app.start_time}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-base leading-snug">{app.client_name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {app.service_name} • <span className="text-amber-400 font-medium font-mono">R$ {app.price.toFixed(2)}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Profissional: <span className="text-slate-300">{app.barber_name}</span>
                      {app.client_phone && (
                        <span className="ml-2 text-slate-500">| Tel: {app.client_phone}</span>
                      )}
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

      {/* MODAL DE AGENDAMENTO MANUAL PELO ADMINISTRADOR */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                Novo Agendamento Manual
              </h3>
              <button 
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManual} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Matheus Costa"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  WhatsApp do Cliente
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(84) 99999-0000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Serviço *
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - R$ {s.price.toFixed(2)} ({s.duration_minutes} min)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Barbeiro *
                </label>
                <select
                  value={selectedBarberId}
                  onChange={(e) => setSelectedBarberId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                >
                  {barbers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.full_name} ({b.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Horário *
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-colors"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
