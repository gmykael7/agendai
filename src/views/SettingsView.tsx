import React, { useState } from 'react';
import { 
  Building2, Settings, Phone, MapPin, Clock, 
  Sparkles, RotateCcw, Check, Copy, ExternalLink, Share2
} from 'lucide-react';
import { Organization } from '../types';
import { INITIAL_ORG, INITIAL_SERVICES, INITIAL_BARBERS, INITIAL_APPOINTMENTS } from '../data/mockData';

interface SettingsViewProps {
  org: Organization;
  setOrg: React.Dispatch<React.SetStateAction<Organization>>;
  onLoadDemo: (demoData: {
    org: Organization;
    services: typeof INITIAL_SERVICES;
    barbers: typeof INITIAL_BARBERS;
    appointments: typeof INITIAL_APPOINTMENTS;
  }) => void;
  onResetAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  org,
  setOrg,
  onLoadDemo,
  onResetAll,
}) => {
  const [name, setName] = useState(org.name);
  const [ownerName, setOwnerName] = useState(org.owner_name || '');
  const [slug, setSlug] = useState(org.slug);
  const [phone, setPhone] = useState(org.phone);
  const [address, setAddress] = useState(org.address || '');
  const [openHour, setOpenHour] = useState(org.open_hour || '08:00');
  const [closeHour, setCloseHour] = useState(org.close_hour || '20:00');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const publicLink = `${window.location.origin}/#/agendar/${slug || org.slug}`;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Organization = {
      ...org,
      name: name.trim(),
      owner_name: ownerName.trim() || undefined,
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''),
      phone: phone.trim(),
      address: address.trim() || undefined,
      open_hour: openHour,
      close_hour: closeHour,
    };
    setOrg(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCopyPublicLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-3xl">
      {/* CABEÇALHO */}
      <div className="bg-[#121B2E] p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-emerald-400" />
            Configurações da Barbearia
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Personalize os dados públicos do seu estabelecimento, WhatsApp e link de agendamento.
          </p>
        </div>
      </div>

      {/* CARD DO LINK PÚBLICO DO CLIENTE */}
      <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 p-6 rounded-3xl space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Link Público para Seus Clientes</h3>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full uppercase">
            Online 24h
          </span>
        </div>

        <p className="text-xs text-slate-300">
          Envie este link no Instagram, bio ou WhatsApp. O cliente entra, escolhe o serviço e o agendamento cai direto no seu painel com aviso no seu WhatsApp.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#0B1120] p-2 rounded-2xl border border-slate-800">
          <input
            type="text"
            readOnly
            value={publicLink}
            className="w-full bg-transparent px-3 py-1.5 text-xs text-emerald-400 font-mono focus:outline-none"
          />
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyPublicLink}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors w-full sm:w-auto"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Copiado!' : 'Copiar'}
            </button>
            <a
              href={publicLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center justify-center transition-colors"
              title="Testar página do cliente em nova aba"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* FORMULÁRIO DE DADOS GERAIS */}
      <form onSubmit={handleSave} className="bg-[#121B2E] p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-400" />
          Perfil do Estabelecimento
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nome da Barbearia *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nome do Administrador / Responsável
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Ex: Felipe Mateus"
              className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp da Barbearia (Recebe Agendamentos) *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(84) 99999-0000"
              className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Endereço Físico
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua Central, 120 - Centro"
              className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-[#0B1120] p-4 rounded-2xl border border-slate-800">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> Horário de Abertura
            </label>
            <input
              type="time"
              value={openHour}
              onChange={(e) => setOpenHour(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/70 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> Horário de Fechamento
            </label>
            <input
              type="time"
              value={closeHour}
              onChange={(e) => setCloseHour(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/70 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-4 h-4" /> Alterações salvas com sucesso!
            </span>
          ) : <div />}

          <button
            type="submit"
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/10"
          >
            Salvar Configurações
          </button>
        </div>
      </form>

      {/* GERENCIAMENTO DE DADOS (RESET / DEMO) */}
      <div className="bg-[#121B2E] p-6 rounded-3xl border border-slate-800/80 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Ambiente de Testes e Dados
        </h3>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          <div>
            <p className="text-xs font-medium text-slate-300">Carregar Dados de Exemplo</p>
            <p className="text-xs text-slate-500 mt-0.5">Preenche serviços, barbeiros e agendamentos para teste imediato.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Carregar dados de demonstração irá substituir os dados atuais. Deseja continuar?')) {
                onLoadDemo({
                  org: INITIAL_ORG,
                  services: INITIAL_SERVICES,
                  barbers: INITIAL_BARBERS,
                  appointments: INITIAL_APPOINTMENTS,
                });
              }
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-semibold border border-slate-700/60 transition-colors"
          >
            Carregar Demonstração
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-800/60">
          <div>
            <p className="text-xs font-medium text-rose-400">Limpar Dados e Reiniciar</p>
            <p className="text-xs text-slate-500 mt-0.5">Apaga a barbearia atual, equipe e serviços para começar totalmente do zero.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Atenção: Todos os dados locais serão apagados e você voltará à tela de criação inicial. Deseja continuar?')) {
                onResetAll();
              }
            }}
            className="px-4 py-2 bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Zerar Tudo
          </button>
        </div>
      </div>
    </div>
  );
};
