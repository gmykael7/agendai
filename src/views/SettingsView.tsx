import React, { useState } from 'react';
import { 
  Building2, Settings, Phone, MapPin, Clock, 
  Sparkles, RotateCcw, Check, Copy, ExternalLink, AlertTriangle
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
  const [slug, setSlug] = useState(org.slug);
  const [phone, setPhone] = useState(org.phone);
  const [address, setAddress] = useState(org.address || '');
  const [openHour, setOpenHour] = useState(org.open_hour || '08:00');
  const [closeHour, setCloseHour] = useState(org.close_hour || '20:00');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Organization = {
      ...org,
      name: name.trim(),
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
    const fullUrl = `${window.location.origin}/#${org.slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-3xl">
      {/* CABEÇALHO */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-amber-500" />
            Configurações da Barbearia
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Personalize os dados públicos do seu estabelecimento, links e horários.
          </p>
        </div>
      </div>

      {/* FORMULÁRIO DE DADOS GERAIS */}
      <form onSubmit={handleSave} className="bg-slate-900/80 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-amber-500" />
          Perfil do Estabelecimento
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nome da Barbearia
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Link Personalizado (Slug)
            </label>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 text-xs text-slate-400 focus-within:border-amber-500">
              <span>agend.ai/</span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="w-full bg-transparent border-0 text-white py-2.5 text-sm focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-500" /> WhatsApp Principal
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-500" /> Endereço Físico
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, Número, Bairro, Cidade"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" /> Horário de Abertura
            </label>
            <input
              type="time"
              value={openHour}
              onChange={(e) => setOpenHour(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/70 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" /> Horário de Fechamento
            </label>
            <input
              type="time"
              value={closeHour}
              onChange={(e) => setCloseHour(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/70 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* LINK PÚBLICO E COMPARTILHAMENTO */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-white">Link Público de Agendamento:</p>
            <p className="text-xs text-amber-400 font-mono mt-0.5">agend.ai/{org.slug}</p>
          </div>
          <button
            type="button"
            onClick={handleCopyPublicLink}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedLink ? 'Link Copiado!' : 'Copiar Link'}
          </button>
        </div>

        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-4 h-4" /> Alterações salvas com sucesso!
            </span>
          ) : <div />}

          <button
            type="submit"
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/10"
          >
            Salvar Configurações
          </button>
        </div>
      </form>

      {/* GERENCIAMENTO DE DADOS (RESET / DEMO) */}
      <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800/80 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
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
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-semibold border border-slate-700/60 transition-colors"
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
