import React, { useState, useMemo } from 'react';
import { 
  ArrowRight, Plus, Scissors, CheckCircle, Clock, 
  X, Phone, Calendar, User, DollarSign, Share2, Copy, Check, MessageSquare, QrCode, CreditCard, Banknote, AlertCircle
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

const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const isTimeSlotOccupied = (
  slotTime: string,
  candidateDurationMinutes: number,
  barberId: string,
  dateStr: string,
  allAppointments: Appointment[],
  excludeAppointmentId?: string
): boolean => {
  const candidateStart = timeToMinutes(slotTime);
  const candidateEnd = candidateStart + (candidateDurationMinutes || 30);

  return allAppointments.some(app => {
    if (excludeAppointmentId && app.id === excludeAppointmentId) return false;
    if (app.status === 'canceled') return false;
    if (app.barber_id !== barberId) return false;

    const appDate = app.date || dateStr;
    if (appDate !== dateStr) return false;

    const appStart = timeToMinutes(app.start_time);
    const appDuration = app.duration_minutes || (app.services?.reduce((sum, s) => sum + (s.duration_minutes || 30), 0)) || 30;
    const appEnd = appStart + appDuration;

    return candidateStart < appEnd && appStart < candidateEnd;
  });
};

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
  const [modalError, setModalError] = useState('');

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
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

  // Totais dos serviços selecionados no modal de criação
  const modalSelectedServices = useMemo(() => {
    return services.filter(s => selectedServiceIds.includes(s.id));
  }, [services, selectedServiceIds]);

  const modalTotalPrice = useMemo(() => {
    return modalSelectedServices.reduce((sum, s) => sum + s.price, 0);
  }, [modalSelectedServices]);

  const modalTotalDuration = useMemo(() => {
    return modalSelectedServices.reduce((sum, s) => sum + (s.duration_minutes || 30), 0);
  }, [modalSelectedServices]);

  const handleCopyPublicLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const toggleServiceSelection = (id: string) => {
    setSelectedServiceIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
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
    setModalError('');

    if (!clientName.trim() || selectedServiceIds.length === 0) return;

    const brb = barbers.find(b => b.id === selectedBarberId) || barbers[0];
    if (!brb) {
      alert('Cadastre ao menos um profissional nos ajustes.');
      return;
    }

    // VERIFICAÇÃO DE HORÁRIO OCUPADO
    const occupied = isTimeSlotOccupied(
      startTime,
      modalTotalDuration,
      brb.id,
      todayStr,
      appointments
    );

    if (occupied) {
      setModalError(`O horário das ${startTime} hoje já está ocupado ou colide com outro agendamento para ${brb.full_name}.`);
      return;
    }

    const joinedNames = modalSelectedServices.map(s => s.name).join(' + ');

    const created: Appointment = {
      id: 'app-' + Date.now(),
      org_id: org.id,
      client_name: clientName.trim(),
      client_phone: clientPhone.trim() || 'Não informado',
      service_id: modalSelectedServices[0]?.id || '',
      service_name: joinedNames,
      services: modalSelectedServices.map(s => ({
        id: s.id,
        name: s.name,
        price: s.price,
        duration_minutes: s.duration_minutes || 30,
        category: s.category,
      })),
      duration_minutes: modalTotalDuration,
      barber_id: brb.id,
      barber_name: brb.full_name,
      start_time: startTime,
      price: modalTotalPrice,
      status: 'scheduled',
      date: todayStr,
      created_at: new Date().toISOString(),
    };

    setAppointments(prev => [created, ...prev]);
    setClientName('');
    setClientPhone('');
    setSelectedServiceIds([]);
    setShowModal(false);
  };

  const getWhatsAppDirect = (phone: string, clientName: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${clientName}, tudo bem? Aqui é da barbearia ${org.name}!`);
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    return `https://wa.me/${fullPhone}?text=${message}`;
  };

  return (
    <div className="space-y-5 sm:space-y-6 animate-fadeIn">
      {/* BANNER SUPERIOR DE BOAS-VINDAS */}
      <div className="bg-[#121B2E] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>🌤️</span> {greeting}, {org.owner_name || org.name}!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              {formattedDate} · Resumo da sua barbearia hoje.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyPublicLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/40 text-emerald-400 bg-emerald-950/30 hover:bg-emerald-900/40 text-xs font-semibold transition-all shrink-0 active:scale-95"
              title="Copiar link de agendamento do cliente"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              {copiedLink ? 'Link Copiado!' : 'Link Cliente'}
            </button>

            <button
              onClick={onNavigateToAgenda}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300 bg-slate-900 hover:bg-slate-800 text-xs font-semibold transition-all shrink-0"
            >
              Ver agenda <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* SUB-CARDS DENTRO DO BANNER */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-4 sm:mt-6">
          <div className="bg-[#0B1120]/90 border border-slate-800 rounded-2xl p-3 sm:p-4">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              AGENDADOS HOJE
            </p>
            <p className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5">
              {todayScheduled.length} aguardando
            </p>
          </div>

          <div className="bg-[#0B1120]/90 border border-slate-800 rounded-2xl p-3 sm:p-4">
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              PRÓXIMO CLIENTE
            </p>
            {proximoCliente ? (
              <div className="mt-0.5">
                <p className="text-xs sm:text-sm font-semibold text-white truncate">
                  {proximoCliente.client_name} <span className="text-emerald-400 font-mono text-xs">({proximoCliente.start_time})</span>
                </p>
                <span className="block text-[10px] sm:text-[11px] text-slate-400 truncate">
                  {proximoCliente.barber_name}
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5">Nenhum pendente</p>
            )}
          </div>
        </div>
      </div>

      {/* CARDS DE MÉTRICAS PRINCIPAIS (RESPONSIVOS NO CELULAR) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* TOTAL EM CAIXA (HOJE) */}
        <div className="bg-[#121B2E] border border-slate-800 rounded-2xl p-3.5 sm:p-6 shadow-md">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
            FATURAMENTO
          </p>
          <p className="text-lg sm:text-3xl md:text-4xl font-black text-emerald-400 font-mono mt-1 sm:mt-2 tracking-tight">
            R$ {totalEmCaixaHoje.toFixed(0)}
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 hidden sm:block">{todayCompleted.length} concluídos</p>
        </div>

        {/* ATENDIMENTOS DO DIA */}
        <div className="bg-[#121B2E] border border-slate-800 rounded-2xl p-3.5 sm:p-6 shadow-md">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
            DO DIA
          </p>
          <p className="text-lg sm:text-3xl md:text-4xl font-black text-white font-mono mt-1 sm:mt-2 tracking-tight">
            {todayAppointments.length}
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 hidden sm:block">{todayScheduled.length} agendados</p>
        </div>

        {/* TOTAL AGENDAMENTOS PENDENTES */}
        <div className="bg-[#121B2E] border border-slate-800 rounded-2xl p-3.5 sm:p-6 shadow-md">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
            ABERTOS
          </p>
          <p className="text-lg sm:text-3xl md:text-4xl font-black text-amber-400 font-mono mt-1 sm:mt-2 tracking-tight">
            {allScheduled.length}
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 hidden sm:block">geral</p>
        </div>
      </div>

      {/* SEÇÃO: ATENDIMENTOS DA BARBEARIA */}
      <div className="space-y-3.5 pt-1">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-xl font-bold text-white tracking-tight">
              Atendimentos Recentes
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (services.length === 0 || barbers.length === 0) {
                  alert('Cadastre serviços e profissionais nos ajustes antes de iniciar um atendimento.');
                } else {
                  setSelectedServiceIds(services[0] ? [services[0].id] : []);
                  setSelectedBarberId(barbers[0]?.id || '');
                  setModalError('');
                  setShowModal(true);
                }
              }}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Novo</span>
            </button>
          </div>
        </div>

        {/* LISTA DE ATENDIMENTOS */}
        <div className="bg-[#121B2E] border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
          {appointments.length === 0 ? (
            <div className="p-8 sm:p-12 text-center max-w-sm mx-auto space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto border border-slate-700/60">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm sm:text-base">Nenhum atendimento registrado</h4>
              <p className="text-xs text-slate-400">
                Compartilhe o seu link público com os clientes ou lance um novo atendimento.
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
                    className="p-3.5 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-16 text-center shrink-0 space-y-0.5">
                        <span className="text-base sm:text-xl font-bold text-emerald-400 font-mono block leading-tight">{app.start_time}</span>
                        <span className={`text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.2 rounded-full inline-block ${
                          isToday ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {formattedDateBadge}
                        </span>
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <h4 className="font-bold text-white text-sm sm:text-base leading-snug truncate">{app.client_name}</h4>

                        {/* LISTA DE SERVIÇOS DO ATENDIMENTO */}
                        <div className="flex flex-wrap items-center gap-1">
                          {app.services && app.services.length > 0 ? (
                            app.services.map((srv, idx) => (
                              <span key={idx} className="text-[11px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20 font-medium">
                                {srv.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20 font-medium">
                              {app.service_name}
                            </span>
                          )}
                          <span className="text-xs text-white font-bold font-mono ml-1">
                            R$ {app.price.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span>Barbeiro: <strong className="text-slate-300">{app.barber_name}</strong></span>
                          {app.client_phone && app.client_phone !== 'Não informado' && (
                            <a
                              href={getWhatsAppDirect(app.client_phone, app.client_name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:underline flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md text-[10px]"
                            >
                              <MessageSquare className="w-3 h-3" />
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${
                        app.status === 'completed' 
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : app.status === 'canceled'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {app.status === 'completed' ? 'Concluído' : app.status === 'canceled' ? 'Cancelado' : 'Agendado'}
                      </span>

                      {app.status === 'scheduled' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setCompletingApp(app)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 active:scale-95"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Finalizar
                          </button>
                          <button
                            onClick={() => setAppointments(prev => prev.map(a => a.id === app.id ? { ...a, status: 'canceled' } : a))}
                            className="px-2 py-1 bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 rounded-lg text-xs font-medium transition-colors"
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

      {/* MODAL CONCLUIR ATENDIMENTO (BOTTOM SHEET NO CELULAR) */}
      {completingApp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-fadeIn max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Concluir Atendimento
              </h3>
              <button onClick={() => setCompletingApp(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-2">
              <p><span className="text-slate-400">Cliente:</span> <strong className="text-white">{completingApp.client_name}</strong></p>
              <p><span className="text-slate-400">Profissional:</span> <strong className="text-white">{completingApp.barber_name}</strong></p>
              
              <div className="border-t border-slate-800/80 pt-1.5">
                <span className="text-slate-400 block mb-1">Serviços:</span>
                {completingApp.services && completingApp.services.length > 0 ? (
                  completingApp.services.map((s, idx) => (
                    <div key={idx} className="flex justify-between text-slate-300 py-0.5">
                      <span>• {s.name}</span>
                      <span className="font-mono">R$ {s.price.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between text-slate-300">
                    <span>• {completingApp.service_name}</span>
                    <span className="font-mono">R$ {completingApp.price.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between border-t border-slate-800/80 pt-2 font-bold">
                <span className="text-slate-300">Total a Receber:</span>
                <span className="text-base font-bold text-emerald-400 font-mono">R$ {completingApp.price.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleFinishAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-2">
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
                        className={`p-2.5 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
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
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/10 active:scale-98"
              >
                Confirmar e Concluir
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO ATENDIMENTO (BOTTOM SHEET NO CELULAR) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-fadeIn max-h-[88vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
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

            {modalError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

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

              {/* SELEÇÃO DE MÚLTIPLOS SERVIÇOS */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Serviços * ({selectedServiceIds.length} selecionado(s))
                  </label>
                  {modalTotalPrice > 0 && (
                    <span className="text-xs text-emerald-400 font-bold font-mono">
                      R$ {modalTotalPrice.toFixed(2)} ({modalTotalDuration} min)
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {services.map((s) => {
                    const isChecked = selectedServiceIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => toggleServiceSelection(s.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                          isChecked
                            ? 'bg-emerald-950/30 border-emerald-500/60 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isChecked ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700 bg-slate-900 text-transparent'
                          }`}>
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                          <span className="font-semibold">{s.name}</span>
                          <span className="text-[10px] text-slate-500">({s.duration_minutes}m)</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">R$ {s.price.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Barbeiro *
                  </label>
                  <select
                    value={selectedBarberId}
                    onChange={(e) => setSelectedBarberId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.full_name}
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={selectedServiceIds.length === 0}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
                >
                  Confirmar (R$ {modalTotalPrice.toFixed(2)})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
