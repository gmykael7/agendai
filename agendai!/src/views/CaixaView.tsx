import React, { useState } from 'react';
import { 
  Wallet, DollarSign, ArrowUpRight, ArrowDownRight, 
  CreditCard, QrCode, Banknote, Users, Plus, Percent
} from 'lucide-react';
import { Appointment, Barber } from '../types';
import { BarberAvatar } from '../components/common/BarberAvatar';

interface CaixaViewProps {
  appointments: Appointment[];
  barbers: Barber[];
}

export const CaixaView: React.FC<CaixaViewProps> = ({
  appointments,
  barbers,
}) => {
  const concluidos = appointments.filter(a => a.status === 'completed');

  const totalFaturado = concluidos.reduce((acc, curr) => acc + curr.price, 0);

  // Totais por forma de pagamento
  const totalPix = concluidos.filter(a => a.payment_method === 'pix').reduce((acc, curr) => acc + curr.price, 0);
  const totalCartao = concluidos.filter(a => a.payment_method === 'credit' || a.payment_method === 'debit').reduce((acc, curr) => acc + curr.price, 0);
  const totalDinheiro = concluidos.filter(a => a.payment_method === 'cash' || !a.payment_method).reduce((acc, curr) => acc + curr.price, 0);

  // Total de comissões
  const totalComissoes = barbers.reduce((acc, b) => {
    const atendimentosBarber = concluidos.filter(a => a.barber_id === b.id);
    const bruto = atendimentosBarber.reduce((sum, curr) => sum + curr.price, 0);
    return acc + (bruto * b.commission_rate) / 100;
  }, 0);

  const lucroLiquido = totalFaturado - totalComissoes;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* CABEÇALHO */}
      <div className="bg-[#121B2E] p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-emerald-400" />
            Fluxo de Caixa & Fechamento
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Resumo financeiro das entradas, liquidação de comissões e saldo líquido.
          </p>
        </div>
      </div>

      {/* CARDS PRINCIPAIS DO CAIXA */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#121B2E] border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faturamento Bruto</p>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-400 font-mono mt-3">
            R$ {totalFaturado.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{concluidos.length} atendimentos concluídos</p>
        </div>

        <div className="bg-[#121B2E] border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Comissões a Pagar</p>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-400 font-mono mt-3">
            R$ {totalComissoes.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Distribuído entre {barbers.length} profissionais</p>
        </div>

        <div className="bg-[#121B2E] border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lucro Líquido Barbearia</p>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white font-mono mt-3">
            R$ {lucroLiquido.toFixed(2)}
          </p>
          <p className="text-[11px] text-emerald-400 mt-1">Margem retida do salão</p>
        </div>
      </div>

      {/* DETALHAMENTO POR FORMA DE PAGAMENTO */}
      <div className="bg-[#121B2E] border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
        <h3 className="text-base font-bold text-white">Recebimentos por Forma de Pagamento</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0B1120] border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Pix</p>
                <p className="text-lg font-bold text-white font-mono">R$ {totalPix.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0B1120] border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Cartão (Crédito/Débito)</p>
                <p className="text-lg font-bold text-white font-mono">R$ {totalCartao.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0B1120] border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Dinheiro Físico</p>
                <p className="text-lg font-bold text-white font-mono">R$ {totalDinheiro.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FECHAMENTO DE COMISSÕES POR BARBEIRO */}
      <div className="bg-[#121B2E] border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-500" />
          Extrato de Comissões dos Profissionais
        </h3>

        <div className="divide-y divide-slate-800/60">
          {barbers.map((b) => {
            const atendimentosBarber = concluidos.filter(a => a.barber_id === b.id);
            const totalBruto = atendimentosBarber.reduce((acc, curr) => acc + curr.price, 0);
            const comissao = (totalBruto * b.commission_rate) / 100;

            return (
              <div key={b.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <BarberAvatar
                    name={b.full_name}
                    avatarUrl={b.avatar_url}
                    size="md"
                  />
                  <div>
                    <h4 className="font-bold text-white text-sm">{b.full_name}</h4>
                    <p className="text-xs text-slate-400">
                      {atendimentosBarber.length} cortes • Alíquota: <strong className="text-amber-400">{b.commission_rate}%</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[11px] text-slate-400">Produção Bruta</p>
                    <p className="text-sm font-bold text-white font-mono">R$ {totalBruto.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-emerald-400 font-medium">Comissão Líquida</p>
                    <p className="text-sm font-bold text-emerald-400 font-mono">R$ {comissao.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
