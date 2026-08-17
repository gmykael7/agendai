import React, { useState } from 'react';
import { 
  Users, Plus, Search, Phone, MessageSquare, 
  Calendar, DollarSign, X, Check, User
} from 'lucide-react';
import { Client, Appointment } from '../types';

interface ClientesViewProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  appointments: Appointment[];
}

export const ClientesView: React.FC<ClientesViewProps> = ({
  clients,
  setClients,
  appointments,
}) => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Sincronizar clientes a partir dos agendamentos se a lista estiver vazia
  const allClients = React.useMemo(() => {
    const map = new Map<string, Client>();

    // Adiciona clientes cadastrados
    clients.forEach(c => map.set(c.phone || c.name, c));

    // Adiciona clientes dos agendamentos
    appointments.forEach(a => {
      const key = a.client_phone || a.client_name;
      if (!map.has(key)) {
        map.set(key, {
          id: 'c-' + Date.now() + Math.random(),
          name: a.client_name,
          phone: a.client_phone,
          total_visits: 1,
          total_spent: a.price,
          last_visit: a.date || 'Hoje',
        });
      }
    });

    return Array.from(map.values());
  }, [clients, appointments]);

  const filtered = allClients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newClient: Client = {
      id: 'cli-' + Date.now(),
      name: name.trim(),
      phone: phone.trim() || 'Não informado',
      total_visits: 0,
      total_spent: 0,
      last_visit: 'Novo cliente',
    };

    setClients(prev => [newClient, ...prev]);
    setName('');
    setPhone('');
    setShowModal(false);
  };

  const getWhatsAppDirect = (clientPhone: string, clientName: string) => {
    const cleanPhone = clientPhone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${clientName}, tudo bem? Aqui é da barbearia! Gostaria de agendar seu próximo horário?`);
    return `https://wa.me/55${cleanPhone}?text=${message}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121B2E] p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-400" />
            Base de Clientes
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Histórico de visitas, consumo e contato direto via WhatsApp.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/10 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {/* BUSCA */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou WhatsApp..."
            className="w-full bg-[#121B2E] border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          {filtered.length} clientes encontrados
        </span>
      </div>

      {/* LISTAGEM DE CLIENTES */}
      <div className="bg-[#121B2E] border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
        {filtered.length === 0 ? (
          <div className="p-12 text-center max-w-sm mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto border border-slate-700/60">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base">Nenhum cliente cadastrado</h4>
            <p className="text-xs text-slate-400">
              Cadastre novos clientes ou aguarde agendamentos pelo portal online.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 overflow-x-auto">
            {filtered.map((cli) => (
              <div
                key={cli.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                    {cli.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base leading-snug">{cli.name}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-500" /> {cli.phone || 'Sem telefone'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                  <div className="text-left sm:text-right">
                    <p className="text-[11px] text-slate-400">Visitas</p>
                    <p className="text-sm font-bold text-white font-mono">{cli.total_visits} cortes</p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-[11px] text-slate-400">Total Investido</p>
                    <p className="text-sm font-bold text-emerald-400 font-mono">R$ {cli.total_spent.toFixed(2)}</p>
                  </div>

                  {cli.phone && cli.phone !== 'Não informado' && (
                    <a
                      href={getWhatsAppDirect(cli.phone, cli.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                      title="Conversar no WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL NOVO CLIENTE */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Novo Cliente
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Gabriel Moreira"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp / Telefone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(84) 99999-0000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
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
                  Cadastrar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
