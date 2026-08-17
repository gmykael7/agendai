import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, Plus, Clock, CheckCircle, X, 
  Search, Phone, DollarSign, CreditCard, Banknote, QrCode, MessageSquare, Calendar
} from 'lucide-react';
import { Appointment, Service, Barber } from '../types';

interface AtendimentosViewProps {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  services: Service[];
  barbers: Barber[];
}

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

  // Form State Novo Atendimento
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [barberId, setBarberId] = useState(barbers[0]?.id || '');
  const [time, setTime] = useState('14:00');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

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
    if (!clientName.trim()) return;

    const srv = services.find(s => s.id === serviceId) || services[0];
    const brb = barbers.find(b => b.id === barberId) || barbers[0];
    if (!srv || !brb) return;

    const created: Appointment = {
      id: 'app-' + Date.now(),
      client_name: clientName.trim(),
      client_phone: clientPhone.trim() || 'Não informado',
      service_id: srv.id,
      service_name: srv.name,
      barber_id: brb.id,
      barber_name: brb.full_name,
      start_time: time,
      price: srv.price,
      status: 'scheduled',
      date: selectedDate,
      created_at: new Date().toISOString(),
    };

    setAppointments(prev => [created, ...prev]);
    setClientName('');
    setClientPhone('');
    setShowModal(false);
  };

  const getWhatsAppDirect = (phone: string, clientName: string, time: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${clientName}, tudo bem? Confirmando seu horário às ${time} na barbearia!`);
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    return `https://wa.me/${fullPhone}?text=${message}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121B2E] p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-emerald-400" />
            Gestão de Atendimentos
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Histórico completo de atendimentos presenciais e agendamentos feitos pelos clientes online.
          </p>
        </div>

        <button
          onClick={() => {
            setServiceId(services[0]?.id || '');
            setBarberId(barbers[0]?.id || '');
            setSelectedDate(todayStr);
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/10 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Novo Atendimento
        </button>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[#121B2E] p-1 rounded-2xl border border-slate-800 w-full sm:w-auto overflow-x-auto">
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
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
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
            placeholder="Buscar por cliente, serviço ou barbeiro..."
            className="w-full bg-[#121B2E] border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* TABELA DE ATENDIMENTOS */}
      <div className="bg-[#121B2E] border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
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
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
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
                        {app.payment_method && (
                          <span className="ml-2 text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full uppercase font-mono">
                            {app.payment_method}
                          </span>
                        )}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
                        <span>Barbeiro: <strong className="text-slate-300">{app.barber_name}</strong></span>
                        {app.client_phone && app.client_phone !== 'Não informado' && (
                          <a
                            href={getWhatsAppDirect(app.client_phone, app.client_name, app.start_time)}
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

      {/* MODAL CONCLUIR ATENDIMENTO (FORMA DE PAGAMENTO) */}
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
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

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

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Serviço *</label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} - R$ {s.price.toFixed(2)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Barbeiro *</label>
                <select
                  value={barberId}
                  onChange={(e) => setBarberId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
