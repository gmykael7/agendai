import React, { useState } from 'react';
import { 
  Users, Plus, Trash2, Edit3, Phone, DollarSign, 
  UserCheck, AlertCircle, Percent, Sparkles, X, Check
} from 'lucide-react';
import { Barber, Appointment } from '../types';
import { BarberAvatar } from '../components/common/BarberAvatar';

interface TeamViewProps {
  barbers: Barber[];
  setBarbers: React.Dispatch<React.SetStateAction<Barber[]>>;
  appointments: Appointment[];
}

export const TeamView: React.FC<TeamViewProps> = ({
  barbers,
  setBarbers,
  appointments,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [commissionRate, setCommissionRate] = useState(50);
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const openAddModal = () => {
    setEditingBarber(null);
    setFullName('');
    setRole('Barbeiro Especialista');
    setCommissionRate(50);
    setPhone('');
    setAvatarUrl('');
    setShowModal(true);
  };

  const openEditModal = (barber: Barber) => {
    setEditingBarber(barber);
    setFullName(barber.full_name);
    setRole(barber.role);
    setCommissionRate(barber.commission_rate);
    setPhone(barber.phone);
    setAvatarUrl(barber.avatar_url || '');
    setShowModal(true);
  };

  const handleSaveBarber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    if (editingBarber) {
      // Atualizar barbeiro existente
      setBarbers(prev => prev.map(b => b.id === editingBarber.id ? {
        ...b,
        full_name: fullName.trim(),
        role: role.trim() || 'Barbeiro',
        commission_rate: commissionRate,
        phone: phone.trim(),
        avatar_url: avatarUrl.trim() || undefined,
      } : b));
    } else {
      // Criar novo barbeiro (sem foto humana por padrão)
      const newBarber: Barber = {
        id: 'b-' + Date.now(),
        full_name: fullName.trim(),
        role: role.trim() || 'Barbeiro',
        commission_rate: commissionRate,
        phone: phone.trim(),
        avatar_url: avatarUrl.trim() || undefined,
        active: true,
      };
      setBarbers(prev => [...prev, newBarber]);
    }

    setShowModal(false);
  };

  const handleDeleteBarber = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este profissional?')) {
      setBarbers(prev => prev.filter(b => b.id !== id));
    }
  };

  const updateCommissionRate = (barberId: string, newRate: number) => {
    setBarbers(prev => prev.map(b => b.id === barberId ? { ...b, commission_rate: newRate } : b));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* CABEÇALHO DA SEÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-amber-500" />
            Equipe de Barbeiros & Comissões
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Cadastre os profissionais que atendem no seu estabelecimento e defina as porcentagens de comissão.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/10 shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Adicionar Barbeiro
        </button>
      </div>

      {/* LISTA DE BARBEIROS OU EMPTY STATE */}
      {barbers.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Nenhum barbeiro cadastrado</h3>
            <p className="text-xs text-slate-400 mt-1">
              Cadastre o primeiro profissional para que seus clientes possam escolher com quem desejam ser atendidos.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Primeiro Barbeiro
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {barbers.map((barber) => {
            const concluidos = appointments.filter(a => a.barber_id === barber.id && a.status === 'completed');
            const totalBruto = concluidos.reduce((acc, curr) => acc + curr.price, 0);
            const valorComissao = (totalBruto * barber.commission_rate) / 100;
            const agendamentosPendentes = appointments.filter(a => a.barber_id === barber.id && a.status === 'scheduled').length;

            return (
              <div 
                key={barber.id} 
                className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-5 hover:border-slate-700 transition-all"
              >
                {/* TOPO DO CARD: FOTO / ÍCONE DE PERFIL PADRÃO, NOME, AÇÕES */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <BarberAvatar
                      name={barber.full_name}
                      avatarUrl={barber.avatar_url}
                      size="lg"
                    />
                    <div>
                      <h4 className="font-bold text-white text-lg leading-tight">{barber.full_name}</h4>
                      <p className="text-xs text-amber-400/90 font-medium mt-0.5">{barber.role}</p>
                      {barber.phone && (
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" /> {barber.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(barber)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                      title="Editar barbeiro"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBarber(barber.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                      title="Remover barbeiro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* CONTROLE DE COMISSÃO */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Percentual de Comissão</span>
                    <span className="text-amber-400 font-bold font-mono text-sm bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                      {barber.commission_rate}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={barber.commission_rate}
                    onChange={(e) => updateCommissionRate(barber.id, parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>10%</span>
                    <span>50%</span>
                    <span>90%</span>
                  </div>
                </div>

                {/* MÉTRICAS DE PRODUÇÃO E LIQUIDAÇÃO */}
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <p className="text-[11px] text-slate-400">Atendimentos</p>
                    <p className="text-sm font-bold text-white mt-0.5">
                      {concluidos.length} <span className="text-[10px] text-slate-500 font-normal">({agendamentosPendentes} pend.)</span>
                    </p>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <p className="text-[11px] text-slate-400">Total Produzido</p>
                    <p className="text-sm font-bold text-white mt-0.5 font-mono">R$ {totalBruto.toFixed(2)}</p>
                  </div>
                  <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20">
                    <p className="text-[11px] text-emerald-400 font-medium">Comissão Líquida</p>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5 font-mono">R$ {valorComissao.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL ADICIONAR / EDITAR BARBEIRO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-fadeIn max-h-[88vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                {editingBarber ? 'Editar Barbeiro' : 'Adicionar Novo Barbeiro'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBarber} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Lucas Silva"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Especialidade / Cargo
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Ex: Barbeiro Sênior"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Comissão Inicial (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  WhatsApp do Barbeiro
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(84) 99999-8888"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  URL da Foto / Avatar (Opcional - por padrão usa ícone de perfil)
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="Opcional: https://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-colors"
                >
                  {editingBarber ? 'Salvar Alterações' : 'Cadastrar Barbeiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
