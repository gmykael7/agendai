import React, { useState, useMemo } from 'react';
import { 
  ArrowRight, Plus, Scissors, CheckCircle, Clock, 
  X, Phone, Calendar, User, DollarSign, Share2, Copy, Check, MessageSquare, QrCode, CreditCard, Banknote
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
  const [completingApp, setCompletingApp] = useState<Appointment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit' | 'debit' | 'cash'>('pix');
  const [copiedLink, setCopiedLink] = useState(false);

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || '');
  const [selectedBarberId, setSelectedBarberId] = useState(barbers[0]?.id || '');
  const [startTime, setStartTime] = useState('14:00');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

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

  // Cálculos das métricas do dia
  const todayAppointments = useMemo(() => {
    return appointments.filter(a => (a.date || todayStr) === todayStr);
  }, [appointments, todayStr]);

  const todayCompleted = todayAppointments.filter(a => a.status === 'completed');
  const todayScheduled = todayAppointments.filter(a => a.status === 'scheduled');
  const totalEmCaixaHoje = todayCompleted.reduce((acc, curr) => acc + curr.price, 0);

  const allScheduled = appointments.filter(a => a.status === 'scheduled');
  const proximoCliente = allScheduled[0];

  const publicLink = `${window.location.origin}/#/agendar/${org.slug}`;

  const handleCopyPublicLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleFinishAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingApp) return;

    setAppointments(prev => prev.map(a => 
      a.id === completingApp.id ? { ...a, status: 'completed', payment_method: paymentMethod } : a
    ));
    setCompletingApp(null);
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
      org_id: org.id,
      client_name: clientName.trim(),
      client_phone: clientPhone.trim() || 'Não informado',
      service_id: srv.id,
      service_name: srv.name,
      barber_id: brb.id,
      barber_name: brb.full_name,
      start_time: startTime,
      price: srv.price,
      status: 'scheduled',
      date: todayStr,
      created_at: new Date().toISOString(),
    };

    setAppointments(prev => [created, ...prev]);
    setClientName('');
    setClientPhone('');
    setShowModal(false);
  };

  const getWhatsAppDirect = (phone: string, clientName: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${clientName}, tudo bem? Aqui é da barbearia ${org.name}!`);
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    return `https://wa.me/${fullPhone}?text=${message}`;
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
              {formattedDate} · Aqui está o resumo da sua barbearia hoje.
            </p>
            <p className="text-xs text-slate-400">
              Acompanhe seus agendamentos e clientes em tempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyPublicLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-emerald-500/40 text-emerald-400 bg-emerald-950/30 hover:bg-emerald-900/40 text-xs font-semibold transition-all shrink-0"
              title="Copiar link de agendamento do cliente"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              {copiedLink ? 'Link Copiado!' : 'Link de Agendamento'}
            </button>

            <button
              onClick={onNavigateToAgenda}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-700 text-slate-300 bg-slate-900 hover:bg-slate-800 text-xs font-semibold transition-all shrink-0"
            >
              Ver agenda completa <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* SUB-CARDS DENTRO DO BANNER */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          <div className="bg-[#0B1120]/90 border border-slate-800 rounded-2xl p-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              AGENDADOS PARA HOJE
            </p>
            <p className="text-base font-bold text-emerald-400 mt-1">
              {todayScheduled.length} clientes aguardando
            </p>
          </div>

          <div className="bg-[#0B1120]/90 border border-slate-800 rounded-2xl p-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              PRÓXIMO CLIENTE
            </p>
            {proximoCliente ? (
              <div className="mt-1">
                <p className="text-sm font-semibold text-white truncate">
                  {proximoCliente.client_name} <span className="text-emerald-400 font-mono">({proximoCliente.start_time})</span>
                </p>
                <span className="block text-[11px] text-slate-400">
                  {proximoCliente.service_name} • Profissional: {proximoCliente.barber_name}
                </span>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-white mt-1">Nenhum agendamento pendente</p>
                <p className="text-xs text-slate-500">Tudo em dia por enquanto</p>
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
            R$ {totalEmCaixaHoje.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{todayCompleted.length} serviços concluídos</p>
        </div>

        {/* ATENDIMENTOS DO DIA */}
        <div className="bg-[#121B2E] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            ATENDIMENTOS DO DIA
          </p>
          <p className="text-3xl sm:text-4xl font-black text-white font-mono mt-2 tracking-tight">
            {todayAppointments.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{todayScheduled.length} agendados / {todayCompleted.length} finalizados</p>
        </div>

        {/* TOTAL AGENDAMENTOS PENDENTES */}
        <div className="bg-[#121B2E] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            AGENDAMENTOS ABERTOS
          </p>
          <p className="text-3xl sm:text-4xl font-black text-amber-400 font-mono mt-2 tracking-tight">
            {allScheduled.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Geral em todas as datas</p>
        </div>
      </div>

      {/* SEÇÃO: ATENDIMENTOS DA BARBEARIA */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Atendimentos Recentes & Agendamentos
            </h3>
            <p className="text-xs text-slate-400">
              Gerencie os agendamentos feitos pelos clientes e lançamentos manuais.
            </p>
          </div>

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

        {/* LISTA DE ATENDIMENTOS */}
        <div className="bg-[#121B2E] border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
          {appointments.length === 0 ? (
            <div className="p-12 text-center max-w-sm mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto border border-slate-700/60">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white text-base">Nenhum atendimento registrado</h4>
              <p className="text-xs text-slate-400">
                Compartilhe o seu link público com os clientes ou clique em "Novo Atendimento".
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 overflow-x-auto">
              {appointments.map((app) => {
                const isToday = (app.date || todayStr) === todayStr;
                const formattedDateBadge = isToday ? 'Hoje' : new Date(app.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

                return (
                  <div 
                    key={app.id}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="w-20 text-center shrink-0 space-y-0.5">
                        <span className="text-xl font-bold text-emerald-400 font-mono block">{app.start_time}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block ${
                          isToday ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {formattedDateBadge}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base leading-snug">{app.client_name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {app.service_name} • <span className="text-emerald-400 font-bold font-mono">R$ {app.price.toFixed(2)}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
                          <span>Barbeiro: <strong className="text-slate-300">{app.barber_name}</strong></span>
                          {app.client_phone && app.client_phone !== 'Não informado' && (
                            <a
                              href={getWhatsAppDirect(app.client_phone, app.client_name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:underline flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md text-[11px]"
                            >
                              <MessageSquare className="w-3 h-3" />
                              {app.client_phone}
                            </a>
                          )}
                        </div>
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
                            onClick={() => setCompletingApp(app)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Finalizar
                          </button>
                          <button
                            onClick={() => setAppointments(prev => prev.map(a => a.id === app.id ? { ...a, status: 'canceled' } : a))}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 rounded-xl text-xs font-medium transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL CONCLUIR ATENDIMENTO (PAGAMENTO) */}
      {completingApp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Concluir Atendimento
              </h3>
              <button onClick={() => setCompletingApp(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-1.5">
              <p><span className="text-slate-400">Cliente:</span> <strong className="text-white">{completingApp.client_name}</strong></p>
              <p><span className="text-slate-400">Serviço:</span> <strong className="text-white">{completingApp.service_name}</strong></p>
              <p><span className="text-slate-400">Profissional:</span> <strong className="text-white">{completingApp.barber_name}</strong></p>
              <p className="text-base font-bold text-emerald-400 font-mono pt-1">Total: R$ {completingApp.price.toFixed(2)}</p>
            </div>

            <form onSubmit={handleFinishAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'pix', label: 'Pix', icon: QrCode },
                    { id: 'credit', label: 'Cartão Crédito', icon: CreditCard },
                    { id: 'debit', label: 'Cartão Débito', icon: CreditCard },
                    { id: 'cash', label: 'Dinheiro', icon: Banknote },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-3 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
                          paymentMethod === m.id
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/10"
              >
                Confirmar Recebimento e Concluir
              </button>
            </form>
          </div>
        </div>
      )}

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
