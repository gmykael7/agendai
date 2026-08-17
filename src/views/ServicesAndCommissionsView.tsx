import React, { useState } from 'react';
import { Plus, Clock, Trash2 } from 'lucide-react';
import { Service, Barber, Appointment } from '../types';

interface ServicesAndCommissionsViewProps {
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  barbers: Barber[];
  setBarbers: React.Dispatch<React.SetStateAction<Barber[]>>;
  appointments: Appointment[];
}

export const ServicesAndCommissionsView: React.FC<ServicesAndCommissionsViewProps> = ({
  services,
  setServices,
  barbers,
  setBarbers,
  appointments
}) => {
  const [activeTab, setActiveTab] = useState<'services' | 'commissions'>('services');
  const [showAddService, setShowAddService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('30');

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newServicePrice) return;

    const created: Service = {
      id: 'srv-' + Date.now(),
      name: newServiceName,
      price: parseFloat(newServicePrice),
      duration_minutes: parseInt(newServiceDuration, 10),
      category: 'Geral',
      active: true,
    };

    setServices(prev => [...prev, created]);
    setNewServiceName('');
    setNewServicePrice('');
    setShowAddService(false);
  };

  const updateCommissionRate = (barberId: string, newRate: number) => {
    setBarbers(prev => prev.map(b => b.id === barberId ? { ...b, commission_rate: newRate } : b));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* SELEÇÃO DE SUB-ABA */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('services')}
          className={`pb-4 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'services'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Catálogo de Serviços ({services.length})
        </button>
        <button
          onClick={() => setActiveTab('commissions')}
          className={`pb-4 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'commissions'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Cálculo de Comissões da Equipa
        </button>
      </div>

      {activeTab === 'services' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-400">Configure os serviços, tempos de execução e valores praticados.</p>
            <button
              onClick={() => setShowAddService(!showAddService)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Serviço
            </button>
          </div>

          {/* FORMULÁRIO ADICIONAR SERVIÇO */}
          {showAddService && (
            <form onSubmit={handleAddService} className="bg-slate-900 p-6 rounded-2xl border border-amber-500/30 space-y-4">
              <h4 className="font-bold text-white text-base">Adicionar Novo Serviço</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Serviço</label>
                  <input
                    type="text"
                    required
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="Ex: Barba & Sobrancelha"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    placeholder="45.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Duração (Minutos)</label>
                  <input
                    type="number"
                    required
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddService(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold"
                >
                  Guardar Serviço
                </button>
              </div>
            </form>
          )}

          {/* LISTA DE SERVIÇOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => (
              <div key={service.id} className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white">{service.name}</h4>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">{service.category}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-500" /> {service.duration_minutes} min</span>
                    <span className="text-amber-400 font-bold text-sm">R$ {service.price.toFixed(2)}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setServices(prev => prev.filter(s => s.id !== service.id))}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                  aria-label={`Remover serviço ${service.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ABA CÁLCULO DE COMISSÕES */
        <div className="space-y-6">
          <p className="text-sm text-slate-400">Ajuste os percentuais de comissão e visualize os valores a liquidar para cada profissional.</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {barbers.map((barber) => {
              // Calcular faturamento individual do barbeiro nos agendamentos concluídos
              const atendimentosConcluidos = appointments.filter(a => a.barber_id === barber.id && a.status === 'completed');
              const totalBruto = atendimentosConcluidos.reduce((acc, curr) => acc + curr.price, 0);
              const valorComissao = (totalBruto * barber.commission_rate) / 100;

              return (
                <div key={barber.id} className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={barber.avatar_url} alt={barber.full_name} className="w-12 h-12 rounded-full object-cover border border-slate-700" />
                      <div>
                        <h4 className="font-bold text-white text-base">{barber.full_name}</h4>
                        <p className="text-xs text-slate-400">{barber.role}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full border border-amber-500/20 font-bold">
                      {barber.commission_rate}% Comissão
                    </span>
                  </div>

                  {/* Controle de Taxa */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Ajustar Alíquota</span>
                      <span className="text-amber-400 font-bold">{barber.commission_rate}%</span>
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
                  </div>

                  {/* Resumo de Caixa */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      <p className="text-[11px] text-slate-400">Produção Bruta (Hoje)</p>
                      <p className="text-base font-bold text-white mt-0.5">R$ {totalBruto.toFixed(2)}</p>
                    </div>
                    <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20">
                      <p className="text-[11px] text-emerald-400">Comissão a Pagar</p>
                      <p className="text-base font-bold text-emerald-400 mt-0.5">R$ {valorComissao.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
