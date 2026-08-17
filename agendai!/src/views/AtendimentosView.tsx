import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, Plus, Clock, CheckCircle, X, 
  Search, Phone, DollarSign, CreditCard, Banknote, QrCode, MessageSquare, Calendar, Check, AlertCircle
} from 'lucide-react';
import { Appointment, Service, Barber } from '../types';

interface AtendimentosViewProps {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  services: Service[];
  barbers: Barber[];
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

export const AtendimentosView: React.FC<AtendimentosViewProps> = ({
  appointments,
  setAppointments,
  services,
  barbers,
}) => {
  const [filter, setFilter] = useState<'all' | 'today' | 'scheduled' | 'completed' | 'canceled'>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [completingApp, setCompletingApp] = useState<Appointment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit' | 'debit' | 'cash'>('pix');
  const [modalError, setModalError] = useState('');

  // Form State Novo Atendimento
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [barberId, setBarberId] = useState(barbers[0]?.id || '');
  const [time, setTime] = useState('14:00');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

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

  const toggleServiceSelection = (id: string) => {
    setSelectedServiceIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filtered = appointments.filter(a => {
    const isToday = (a.date || todayStr) === todayStr;
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'today' ? isToday :
      a.status === filter;

    const matchesSearch = 
      a.client_name.toLowerCase().includes(search.toLowerCase()) ||
      a.service_name.toLowerCase().includes(search.toLowerCase()) ||
      a.barber_name.toLowerCase().includes(search.toLowerCase()) ||
      (a.client_phone && a.client_phone.includes(search));

    return matchesFilter && matchesSearch;
  });

  const handleFinishAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingApp) return;

    setAppointments(prev => prev.map(a => 
      a.id === completingApp.id ? { ...a, status: 'completed', payment_method: paymentMethod } : a
    ));
    setCompletingApp(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!clientName.trim() || selectedServiceIds.length === 0) return;

    const brb = barbers.find(b => b.id === barberId) || barbers[0];
    if (!brb) return;

    // VERIFICAÇÃO DE HORÁRIO OCUPADO
    const occupied = isTimeSlotOccupied(
      time,
      modalTotalDuration,
      brb.id,
      selectedDate,
      appointments
    );

    if (occupied) {
      setModalError(`O horário das ${time} no dia ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} já está ocupado para ${brb.full_name}.`);
      return;
    }

    const joinedNames = modalSelectedServices.map(s => s.name).join(' + ');

    const created: Appointment = {
      id: 'app-' + Date.now(),
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
      start_time: time,
      price: modalTotalPrice,
      status: 'scheduled',
      date: selectedDate,
      created_at: new Date().toISOString(),
    };

    setAppointments(prev => [created, ...prev]);
    setClientName('');
    setClientPhone('');
    setSelectedServiceIds([]);
    setShowModal(false);
  };

  const getWhatsAppDirect = (phone: string, clientName: string, time: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${clientName}, tudo bem? Confirmando seu horário às ${time} na barbearia!`);
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    return `https://wa.me/${fullPhone}?text=${message}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-[#121B2E] p-4 sm:p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            Gestão de Atendimentos
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Controle de serviços presenciais e agendamentos online.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedServiceIds(services[0] ? [services[0].id] : []);
            setBarberId(barbers[0]?.id || '');
            setSelectedDate(todayStr);
            setModalError('');
            setShowModal(true);
          }}
          className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Atendimento</span>
        </button>
      </div>

      {/* FILTROS E BUSCA RESPONSIVOS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1 bg-[#121B2E] p-1 rounded-2xl border border-slate-800 w-full sm:w-auto overflow-x-auto">
          {([
            { id: 'all', label: 'Todos' },
            { id: 'today', label: 'Hoje' },
            { id: 'scheduled', label: 'Agendados' },
            { id: 'completed', label: 'Concluídos' },
            { id: 'canceled', label: 'Cancelados' },
          ] as const).map((st) => (
            <button
              key={st.id}
              onClick={() => setFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                filter === st.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente ou serviço..."
            className="w-full bg-[#121B2E] border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* TABELA DE ATENDIMENTOS */}
      <div className="bg-[#121B2E] border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
        {filtered.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-slate-400 text-xs sm:text-sm">
            Nenhum atendimento encontrado para os filtros selecionados.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 overflow-x-auto">
            {filtered.map((app) => {
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
                            <span key={idx} className="text-[10px] sm:text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20 font-medium">
                              {srv.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] sm:text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20 font-medium">
                            {app.service_name}
                          </span>
                        )}
                        <span className="text-xs text-white font-bold font-mono ml-1">
                          R$ {app.price.toFixed(2)}
                        </span>
                        {app.payment_method && (
                          <span className="text-[9px] sm:text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-full uppercase font-mono">
                            {app.payment_method}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs text-slate-500">
                        <span>Barbeiro: <strong className="text-slate-300">{app.barber_name}</strong></span>
                        {app.client_phone && app.client_phone !== 'Não informado' && (
                          <a
                            href={getWhatsAppDirect(app.client_phone, app.client_name, app.start_time)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:underline flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.2 rounded text-[10px]"
                          >
                            <MessageSquare className="w-2.5 h-2.5" />
                            {app.client_phone}
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
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 active:scale-95"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Finalizar
                        </button>
                        <button
                          onClick={() => setAppointments(prev => prev.map(a => a.id === app.id ? { ...a, status: 'canceled' } : a))}
                          className="px-2 py-1 bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 rounded-xl text-xs font-medium transition-colors"
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
                Confirmar Recebimento
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
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Cliente *</label>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp</label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(84) 99999-0000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Data *</label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none font-mono"
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
                      Total: R$ {modalTotalPrice.toFixed(2)} ({modalTotalDuration} min)
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Barbeiro *</label>
                  <select
                    value={barberId}
                    onChange={(e) => setBarberId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>{b.full_name} ({b.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Horário *</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
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
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs disabled:opacity-50"
                >
                  Salvar (R$ {modalTotalPrice.toFixed(2)})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
