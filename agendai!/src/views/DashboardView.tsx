import React, { useState, useMemo } from 'react';
import { 
  ArrowRight, Plus, Scissors, CheckCircle, Clock, 
  X, Phone, Calendar, User, DollarSign
} from 'lucide-react';
import { Appointment, Service, Barber, Organization } from '../types';

interface DashboardViewProps {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  services: Service[];
  barbers: Barber[];
  org: Organization;
  onNavigateToAgenda: () => void;
  onNavigateToServices: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  appointments, 
  setAppointments,
  services,
  barbers,
  org,
  onNavigateToAgenda,
  onNavigateToServices,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || '');
  const [selectedBarberId, setSelectedBarberId] = useState(barbers[0]?.id || '');
  const [startTime, setStartTime] = useState('14:00');

  // Saudação de acordo com o horário atual
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  // Data formatada em português
  const formattedDate = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    };
    const str = new Date().toLocaleDateString('pt-BR', options);
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, []);

  // Cálculos das métricas
  const concluidos = appointments.filter(a => a.status === 'completed');
  const agendados = appointments.filter(a => a.status === 'scheduled');
  const totalEmCaixa = concluidos.reduce((acc, curr) => acc + curr.price, 0);

  // Próximo cliente agendado
  const proximoCliente = agendados[0];

  const updateStatus = (id: string, status: 'completed' | 'canceled') => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    const srv = services.find(s => s.id === selectedServiceId) || services[0];
    const brb = barbers.find(b => b.id === selectedBarberId) || barbers[0];

    if (!srv || !brb) {
      alert('Cadastre ao menos um serviço e um profissional nos ajustes.');
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
      date: new Date().toISOString().split('T')[0],
    };

    setAppointments(prev => [created, ...prev]);
    setClientName('');
    setClientPhone('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* BANNER SUPERIOR DE BOAS-VINDAS */}
      <div className="bg-[#121B2E] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>🌤️</span> {greeting}, {org.owner_name || org.name}!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              {formattedDate} · Aqui Está O Resumo Da Sua Barbearia Hoje.
            </p>
            <p className="text-xs text-slate-400">
              Acompanhe seus próximos atendimentos de forma rápida.
            </p>
          </div>

          <button
            onClick={onNavigateToAgenda}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-emerald-500/40 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-900/30 text-xs font-semibold transition-all shrink-0 self-start"
          >
            Ver agenda completa <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* SUB-CARDS DENTRO DO BANNER */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          <div className="bg-[#0B1120]/90 border border-slate-800 rounded-2xl p-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              PRÓXIMAS 5H
            </p>
            <p className="text-base font-bold text-emerald-400 mt-1">
              {agendados.length} atendimentos
            </p>
          </div>

          <div className="bg-[#0B1120]/90 border border-slate-800 rounded-2xl p-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              PRÓXIMO CLIENTE
            </p>
            {proximoCliente ? (
              <p className="text-sm font-semibold text-white mt-1 truncate">
                {proximoCliente.client_name} <span className="text-emerald-400 font-mono">({proximoCliente.start_time})</span>
                <span className="block text-[11px] text-slate-400">{proximoCliente.service_name} • {proximoCliente.barber_name}</span>
              </p>
            ) : (
              <div>
                <p className="text-sm font-semibold text-white mt-1">Nenhum agendamento</p>
                <p className="text-xs text-slate-500">—</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CARDS DE MÉTRICAS PRINCIPAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* TOTAL EM CAIXA (HOJE) */}
        <div className="bg-[#121B2E] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            TOTAL EM CAIXA (HOJE)
          </p>
          <p className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono mt-2 tracking-tight">
            R$ {totalEmCaixa.toFixed(2)}
          </p>
        </div>

        {/* ATENDIMENTOS DO DIA */}
        <div className="bg-[#121B2E] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            ATENDIMENTOS DO DIA
          </p>
          <p className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono mt-2 tracking-tight">
            {appointments.length}
          </p>
        </div>

        {/* ABERTOS */}
        <div className="bg-[#121B2E] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            ABERTOS
          </p>
          <p className="text-3xl sm:text-4xl font-black text-amber-400 font-mono mt-2 tracking-tight">
            {agendados.length}
          </p>
        </div>
      </div>

      {/* SEÇÃO: ATENDIMENTOS DO DIA */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Atendimentos do dia
          </h3>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                if (services.length === 0 || barbers.length === 0) {
                  alert('Cadastre serviços e profissionais nos ajustes antes de iniciar um atendimento.');
                } else {
                  setSelectedServiceId(services[0]?.id || '');
                  setSelectedBarberId(barbers[0]?.id || '');
                  setShowModal(true);
                }
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/10"
            >
              <Plus className="w-4 h-4" />
              Novo Atendimento
            </button>

            <button
              onClick={onNavigateToServices}
              className="px-4 py-2 bg-transparent hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all"
            >
              <Scissors className="w-3.5 h-3.5 text-slate-400" />
              Gerenciar Serviços
            </button>
          </div>
        </div>

        {/* LISTA / TABELA DE ATENDIMENTOS */}
        <div className="bg-[#121B2E] border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
          {appointments.length === 0 ? (
            <div className="p-12 text-center max-w-sm mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto border border-slate-700/60">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white text-base">Nenhum atendimento hoje</h4>
              <p className="text-xs text-slate-400">
                Clique em "Novo Atendimento" para lançar um cliente ou compartilhe seu link público.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 overflow-x-auto">
              {appointments.map((app) => (
                <div 
                  key={app.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-16 text-center shrink-0">
                      <span className="text-xl font-bold text-emerald-400 font-mono">{app.start_time}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base leading-snug">{app.client_name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {app.service_name} • <span className="text-emerald-400 font-bold font-mono">R$ {app.price.toFixed(2)}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Barbeiro: <span className="text-slate-300">{app.barber_name}</span>
                        {app.client_phone && (
                          <span className="ml-2 text-slate-500">| {app.client_phone}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      app.status === 'completed' 
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : app.status === 'canceled'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}>
                      {app.status === 'completed' ? 'Concluído' : app.status === 'canceled' ? 'Cancelado' : 'Agendado'}
                    </span>

                    {app.status === 'scheduled' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateStatus(app.id, 'completed')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Concluir
                        </button>
                        <button
                          onClick={() => updateStatus(app.id, 'canceled')}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 rounded-xl text-xs font-medium transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL NOVO ATENDIMENTO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                Novo Atendimento
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Serviço *
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
                >
                  Confirmar Atendimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
