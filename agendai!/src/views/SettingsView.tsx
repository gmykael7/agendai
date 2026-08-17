import React, { useState } from 'react';
import { 
  Building2, Settings, Phone, MapPin, Clock, 
  Sparkles, RotateCcw, Check, Copy, ExternalLink, Share2, Smartphone, Download, Upload, ArrowRight
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
  const [copiedMobileLink, setCopiedMobileLink] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);

  const publicLink = `${window.location.origin}/#/agendar/${slug || org.slug}`;

  // Gera o link de sincronização completo com dados para o celular
  const generateMobileSyncLink = () => {
    const payload = {
      org,
      savedOrgs: JSON.parse(localStorage.getItem('agendai_all_orgs') || '[]'),
      services: JSON.parse(localStorage.getItem('agendai_services') || '[]'),
      barbers: JSON.parse(localStorage.getItem('agendai_barbers') || '[]'),
      appointments: JSON.parse(localStorage.getItem('agendai_appointments') || '[]'),
      clients: JSON.parse(localStorage.getItem('agendai_clients') || '[]'),
    };
    return `${window.location.origin}/?sync_data=${encodeURIComponent(JSON.stringify(payload))}`;
  };

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

  const handleCopyMobileLink = () => {
    const link = generateMobileSyncLink();
    navigator.clipboard.writeText(link);
    setCopiedMobileLink(true);
    setTimeout(() => setCopiedMobileLink(false), 2500);
  };

  const handleExportBackup = () => {
    const backup = {
      org,
      savedOrgs: JSON.parse(localStorage.getItem('agendai_all_orgs') || '[]'),
      services: JSON.parse(localStorage.getItem('agendai_services') || '[]'),
      barbers: JSON.parse(localStorage.getItem('agendai_barbers') || '[]'),
      appointments: JSON.parse(localStorage.getItem('agendai_appointments') || '[]'),
      clients: JSON.parse(localStorage.getItem('agendai_clients') || '[]'),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${org.slug}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImportBackup = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      if (parsed.org) localStorage.setItem('agendai_current_org', JSON.stringify(parsed.org));
      if (parsed.savedOrgs) localStorage.setItem('agendai_all_orgs', JSON.stringify(parsed.savedOrgs));
      if (parsed.services) localStorage.setItem('agendai_services', JSON.stringify(parsed.services));
      if (parsed.barbers) localStorage.setItem('agendai_barbers', JSON.stringify(parsed.barbers));
      if (parsed.appointments) localStorage.setItem('agendai_appointments', JSON.stringify(parsed.appointments));
      if (parsed.clients) localStorage.setItem('agendai_clients', JSON.stringify(parsed.clients));
      localStorage.setItem('agendai_session_active', 'true');
      alert('✅ Backup restaurado com sucesso! A página será atualizada.');
      window.location.reload();
    } catch (err) {
      alert('❌ Erro: Formato de JSON de backup inválido.');
    }
  };

  return (
    <div className=\"space-y-6 sm:space-y-8 animate-fadeIn max-w-3xl\">
      {/* CABEÇALHO */}
      <div className=\"bg-[#121B2E] p-5 sm:p-6 rounded-3xl border border-slate-800 flex items-center justify-between\">
        <div>
          <h2 className=\"text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5\">
            <Settings className=\"w-5 h-5 sm:w-6 sm:h-6 text-emerald-400\" />
            Configurações da Barbearia
          </h2>
          <p className=\"text-xs sm:text-sm text-slate-400 mt-1\">
            Personalize os dados públicos do seu estabelecimento, WhatsApp e sincronização entre aparelhos.
          </p>
        </div>
      </div>

      {/* 1. CARD: ABRIR E SINCRONIZAR NO CELULAR */}
      <div className=\"bg-gradient-to-br from-emerald-950/60 to-slate-900 border-2 border-emerald-500/40 p-5 sm:p-6 rounded-3xl space-y-3.5 shadow-xl\">
        <div className=\"flex items-center justify-between\">
          <div className=\"flex items-center gap-2\">
            <Smartphone className=\"w-5 h-5 text-emerald-400\" />
            <h3 className=\"text-sm font-bold text-white\">Usar no Celular com Seus Dados</h3>
          </div>
          <span className=\"text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full uppercase\">
            Sincronização 1-Clique
          </span>
        </div>

        <p className=\"text-xs text-slate-300\">
          Para acessar o painel no smartphone com todos os seus barbeiros, serviços e dados sincronizados, copie o link abaixo e abra no navegador do celular:
        </p>

        <div className=\"flex flex-col sm:flex-row items-stretch sm:items-center gap-2\">
          <button
            type=\"button\"
            onClick={handleCopyMobileLink}
            className=\"w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-98\"
          >
            {copiedMobileLink ? <Check className=\"w-4 h-4\" /> : <Copy className=\"w-4 h-4\" />}
            {copiedMobileLink ? 'Link Copiado! Cole no seu WhatsApp e abra no celular' : 'Copiar Link de Acesso para o Celular'}
          </button>
        </div>
      </div>

      {/* 2. CARD: LINK PÚBLICO DO CLIENTE */}
      <div className=\"bg-[#121B2E] border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-3 shadow-lg\">
        <div className=\"flex items-center justify-between\">
          <div className=\"flex items-center gap-2\">
            <Share2 className=\"w-5 h-5 text-emerald-400\" />
            <h3 className=\"text-sm font-bold text-white\">Link Público para Seus Clientes</h3>
          </div>
          <span className=\"text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full uppercase\">
            Online 24h
          </span>
        </div>

        <p className=\"text-xs text-slate-300\">
          Divulgue na bio do Instagram ou WhatsApp. O cliente entra, escolhe os serviços e o agendamento cai direto no seu painel.
        </p>

        <div className=\"flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#0B1120] p-2 rounded-2xl border border-slate-800\">
          <input
            type=\"text\"
            readOnly
            value={publicLink}
            className=\"w-full bg-transparent px-3 py-1.5 text-xs text-emerald-400 font-mono focus:outline-none truncate\"
          />
          <div className=\"flex items-center gap-2 shrink-0\">
            <button
              type=\"button\"
              onClick={handleCopyPublicLink}
              className=\"px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors w-full sm:w-auto\"
            >
              {copiedLink ? <Check className=\"w-3.5 h-3.5\" /> : <Copy className=\"w-3.5 h-3.5\" />}
              {copiedLink ? 'Copiado!' : 'Copiar'}
            </button>
            <a
              href={publicLink}
              target=\"_blank\"
              rel=\"noopener noreferrer\"
              className=\"p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center justify-center transition-colors\"
              title=\"Testar página do cliente em nova aba\"
            >
              <ExternalLink className=\"w-4 h-4\" />
            </a>
          </div>
        </div>
      </div>

      {/* 3. FORMULÁRIO DE DADOS GERAIS */}
      <form onSubmit={handleSave} className=\"bg-[#121B2E] p-5 sm:p-8 rounded-3xl border border-slate-800 space-y-5\">
        <h3 className=\"text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2\">
          <Building2 className=\"w-5 h-5 text-emerald-400\" />
          Perfil do Estabelecimento
        </h3>

        <div className=\"grid grid-cols-1 sm:grid-cols-2 gap-4\">
          <div>
            <label className=\"block text-xs font-semibold text-slate-300 mb-1.5\">
              Nome da Barbearia *
            </label>
            <input
              type=\"text\"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className=\"w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none\"
            />
          </div>

          <div>
            <label className=\"block text-xs font-semibold text-slate-300 mb-1.5\">
              Nome do Responsável
            </label>
            <input
              type=\"text\"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder=\"Ex: Felipe Mateus\"
              className=\"w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none\"
            />
          </div>
        </div>

        <div className=\"grid grid-cols-1 sm:grid-cols-2 gap-4\">
          <div>
            <label className=\"block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5\">
              <Phone className=\"w-3.5 h-3.5 text-emerald-400\" /> WhatsApp da Barbearia *
            </label>
            <input
              type=\"tel\"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder=\"(84) 99999-0000\"
              className=\"w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none\"
            />
          </div>

          <div>
            <label className=\"block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5\">
              <MapPin className=\"w-3.5 h-3.5 text-emerald-400\" /> Endereço Físico
            </label>
            <input
              type=\"text\"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder=\"Rua Central, 120 - Centro\"
              className=\"w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none\"
            />
          </div>
        </div>

        <div className=\"grid grid-cols-2 gap-3 sm:gap-4 bg-[#0B1120] p-3.5 sm:p-4 rounded-2xl border border-slate-800\">
          <div>
            <label className=\"block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1\">
              <Clock className=\"w-3.5 h-3.5 text-emerald-400\" /> Horário Abertura
            </label>
            <input
              type=\"time\"
              value={openHour}
              onChange={(e) => setOpenHour(e.target.value)}
              className=\"w-full bg-slate-900 border border-slate-700/70 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono\"
            />
          </div>
          <div>
            <label className=\"block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1\">
              <Clock className=\"w-3.5 h-3.5 text-emerald-400\" /> Horário Fechamento
            </label>
            <input
              type=\"time\"
              value={closeHour}
              onChange={(e) => setCloseHour(e.target.value)}
              className=\"w-full bg-slate-900 border border-slate-700/70 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono\"
            />
          </div>
        </div>

        <div className=\"flex items-center justify-between pt-2\">
          {savedSuccess ? (
            <span className=\"text-xs text-emerald-400 font-semibold flex items-center gap-1\">
              <Check className=\"w-4 h-4\" /> Salvo com sucesso!
            </span>
          ) : <div />}

          <button
            type=\"submit\"
            className=\"px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/10 active:scale-98\"
          >
            Salvar Configurações
          </button>
        </div>
      </form>

      {/* 4. BACKUP & RESTAURAÇÃO DE DADOS */}
      <div className=\"bg-[#121B2E] p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4\">
        <h3 className=\"text-sm font-bold text-white flex items-center gap-2\">
          <Download className=\"w-4 h-4 text-emerald-400\" />
          Backup e Transferência de Dados
        </h3>

        <div className=\"grid grid-cols-1 sm:grid-cols-2 gap-3\">
          <button
            type=\"button\"
            onClick={handleExportBackup}
            className=\"p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-2xl text-xs text-slate-200 font-semibold flex items-center justify-center gap-2 transition-colors\"
          >
            <Download className=\"w-4 h-4 text-emerald-400\" />
            Baixar Arquivo de Backup (.JSON)
          </button>

          <button
            type=\"button\"
            onClick={() => setShowImportBox(!showImportBox)}
            className=\"p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-2xl text-xs text-slate-200 font-semibold flex items-center justify-center gap-2 transition-colors\"
          >
            <Upload className=\"w-4 h-4 text-emerald-400\" />
            Restaurar Backup / Colar Código
          </button>
        </div>

        {showImportBox && (
          <div className=\"space-y-2 p-3 bg-[#0B1120] rounded-2xl border border-slate-800 animate-fadeIn\">
            <label className=\"block text-xs text-slate-400\">Cole o conteúdo do backup abaixo:</label>
            <textarea
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder=\"Cole o código JSON do backup aqui...\"
              rows={3}
              className=\"w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none\"
            />
            <button
              type=\"button\"
              onClick={handleImportBackup}
              className=\"w-full py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs\"
            >
              Carregar Dados
            </button>
          </div>
        )}
      </div>

      {/* 5. GERENCIAMENTO DE DADOS (RESET / DEMO) */}
      <div className=\"bg-[#121B2E] p-5 sm:p-6 rounded-3xl border border-slate-800/80 space-y-4\">
        <h3 className=\"text-sm font-bold text-white flex items-center gap-2\">
          <Sparkles className=\"w-4 h-4 text-emerald-400\" />
          Ambiente de Demonstração e Reset
        </h3>

        <div className=\"flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1\">
          <div>
            <p className=\"text-xs font-medium text-slate-300\">Carregar Dados de Exemplo</p>
            <p className=\"text-[11px] text-slate-500 mt-0.5\">Preenche serviços, barbeiros e agendamentos fictícios.</p>
          </div>
          <button
            type=\"button\"
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
            className=\"px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-semibold border border-slate-700/60 transition-colors\"
          >
            Carregar Demonstração
          </button>
        </div>

        <div className=\"flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/60\">
          <div>
            <p className=\"text-xs font-medium text-rose-400\">Zerar Dados Locais</p>
            <p className=\"text-[11px] text-slate-500 mt-0.5\">Apaga os dados salvos neste navegador para começar do zero.</p>
          </div>
          <button
            type=\"button\"
            onClick={() => {
              if (window.confirm('Atenção: Todos os dados locais serão apagados. Deseja continuar?')) {
                onResetAll();
              }
            }}
            className=\"px-3.5 py-2 bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800/40 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5\"
          >
            <RotateCcw className=\"w-3.5 h-3.5\" />
            Zerar Tudo
          </button>
        </div>
      </div>
    </div>
  );
};
