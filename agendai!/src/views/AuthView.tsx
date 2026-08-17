import React, { useState } from 'react';
import { 
  Building2, Scissors, LogIn, UserPlus, Lock, 
  Mail, Phone, Sparkles, ArrowRight, ShieldCheck, User, Smartphone, Upload, Check, Loader2, Cloud
} from 'lucide-react';
import { Organization } from '../types';
import { INITIAL_ORG, INITIAL_SERVICES, INITIAL_BARBERS, INITIAL_APPOINTMENTS, INITIAL_CLIENTS } from '../data/mockData';
import { loadBarbershopFromCloud } from '../services/cloudSync';

interface AuthViewProps {
  onLogin: (org: Organization) => void;
  onRegister: (newOrg: Organization) => void;
  onLoadDemo: (demoData: {
    org: Organization;
    services: typeof INITIAL_SERVICES;
    barbers: typeof INITIAL_BARBERS;
    appointments: typeof INITIAL_APPOINTMENTS;
  }) => void;
  savedOrganizations: Organization[];
}

export const AuthView: React.FC<AuthViewProps> = ({
  onLogin,
  onRegister,
  onLoadDemo,
  savedOrganizations,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);

  // Register Form
  const [salonName, setSalonName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [slug, setSlug] = useState('');

  // Sync Import modal
  const [showImportSync, setShowImportSync] = useState(false);
  const [syncCode, setSyncCode] = useState('');

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSalonName(val);
    setSlug(generateSlug(val));
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoadingCloud(true);

    const emailTrimmed = loginEmail.trim();

    // 1. Verificar se existe organização salva localmente neste dispositivo
    const foundLocal = savedOrganizations.find(
      org => (org.email && org.email.toLowerCase() === emailTrimmed.toLowerCase()) ||
             (org.phone && org.phone.includes(emailTrimmed)) ||
             (org.name && org.name.toLowerCase() === emailTrimmed.toLowerCase()) ||
             (org.slug && org.slug.toLowerCase() === emailTrimmed.toLowerCase())
    );

    if (foundLocal) {
      setIsLoadingCloud(false);
      onLogin(foundLocal);
      return;
    }

    // 2. Buscar automaticamente na Nuvem (Cloudflare / Cloud) pelo email ou slug
    try {
      const cloudData = await loadBarbershopFromCloud(emailTrimmed);
      if (cloudData && cloudData.org) {
        // Salva todos os dados recebidos da nuvem no dispositivo
        localStorage.setItem('agendai_current_org', JSON.stringify(cloudData.org));
        localStorage.setItem('agendai_all_orgs', JSON.stringify(cloudData.savedOrgs));
        localStorage.setItem('agendai_services', JSON.stringify(cloudData.services));
        localStorage.setItem('agendai_barbers', JSON.stringify(cloudData.barbers));
        localStorage.setItem('agendai_appointments', JSON.stringify(cloudData.appointments));
        localStorage.setItem('agendai_clients', JSON.stringify(cloudData.clients));
        localStorage.setItem('agendai_session_active', 'true');

        setIsLoadingCloud(false);
        onLogin(cloudData.org);
        window.location.reload();
        return;
      }
    } catch (err) {
      console.warn('Erro ao consultar nuvem:', err);
    }

    setIsLoadingCloud(false);

    // 3. Se houver alguma conta salva no dispositivo, entra
    if (savedOrganizations.length > 0) {
      onLogin(savedOrganizations[0]);
    } else {
      // 4. Criação de acesso direto
      onLogin({
        ...INITIAL_ORG,
        email: emailTrimmed || 'admin@barbearia.com',
      });
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonName.trim()) return;

    const newOrg: Organization = {
      id: 'org-' + Date.now(),
      name: salonName.trim(),
      owner_name: ownerName.trim() || 'Administrador',
      email: email.trim() || undefined,
      password: password || undefined,
      slug: slug.trim() || generateSlug(salonName),
      phone: phone.trim() || '(84) 99999-0000',
      primary_color: '#10b981',
      open_hour: '08:00',
      close_hour: '20:00',
    };

    onRegister(newOrg);
  };

  const handleImportSyncCode = () => {
    try {
      let rawJson = syncCode.trim();
      if (rawJson.includes('sync_data=')) {
        const queryPart = rawJson.split('sync_data=')[1].split('&')[0];
        rawJson = decodeURIComponent(queryPart);
      }
      const parsed = JSON.parse(rawJson);
      if (parsed.org) localStorage.setItem('agendai_current_org', JSON.stringify(parsed.org));
      if (parsed.savedOrgs) localStorage.setItem('agendai_all_orgs', JSON.stringify(parsed.savedOrgs));
      if (parsed.services) localStorage.setItem('agendai_services', JSON.stringify(parsed.services));
      if (parsed.barbers) localStorage.setItem('agendai_barbers', JSON.stringify(parsed.barbers));
      if (parsed.appointments) localStorage.setItem('agendai_appointments', JSON.stringify(parsed.appointments));
      if (parsed.clients) localStorage.setItem('agendai_clients', JSON.stringify(parsed.clients));
      localStorage.setItem('agendai_session_active', 'true');
      alert('✅ Dados sincronizados com sucesso neste dispositivo!');
      window.location.reload();
    } catch {
      alert('❌ Código de sincronização inválido. Certifique-se de colar o link ou o código copiado do outro aparelho.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-4 sm:py-10 animate-fadeIn px-2 sm:px-0">
      <div className="bg-[#121B2E] border border-slate-800 rounded-3xl p-5 sm:p-8 space-y-5 sm:space-y-6 shadow-2xl">
        {/* LOGO E CABEÇALHO */}
        <div className="text-center space-y-1.5">
          <div className="w-13 h-13 sm:w-14 sm:h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <Scissors className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">AgendAI</h2>
          <p className="text-xs text-slate-400">
            Gestão & Agendamento com Nuvem Cloudflare
          </p>
        </div>

        {/* ABAS: ENTRAR / CADASTRAR */}
        <div className="flex bg-[#0B1120] p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`w-1/2 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Entrar
          </button>

          <button
            type="button"
            onClick={() => setMode('register')}
            className={`w-1/2 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Cadastrar Novo
          </button>
        </div>

        {/* 1. FORMULÁRIO DE LOGIN */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fadeIn">
            {savedOrganizations.length > 0 && (
              <div className="bg-[#0B1120] p-3 rounded-2xl border border-slate-800 space-y-2">
                <p className="text-[11px] font-semibold text-slate-400">Contas salvas neste dispositivo:</p>
                <div className="space-y-1.5">
                  {savedOrganizations.map((o) => (
                    <div
                      key={o.id}
                      onClick={() => onLogin(o)}
                      className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 cursor-pointer flex items-center justify-between transition-colors group active:scale-98"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">{o.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">agend.ai/{o.slug}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold shrink-0">Entrar →</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" /> E-mail de Login
              </label>
              <input
                type="text"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="seu-email@exemplo.com ou barbearia-slug"
                className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Ao entrar, seus dados serão buscados automaticamente na nuvem Cloudflare.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> Senha de Acesso
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {loginError && (
              <p className="text-xs text-rose-400 bg-rose-950/20 p-2.5 rounded-xl border border-rose-800/40 text-center">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoadingCloud}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {isLoadingCloud ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Buscando na Nuvem...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Acessar Painel</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* 2. FORMULÁRIO DE CADASTRO NOVO */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 animate-fadeIn">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Nome da Barbearia *
              </label>
              <input
                type="text"
                required
                value={salonName}
                onChange={handleNameChange}
                placeholder="Ex: Barbearia Dom Pedro"
                className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" /> Seu Nome (Administrador) *
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Ex: Felipe Mateus"
                className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp da Barbearia *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(84) 99999-0000"
                className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" /> E-mail de Login *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@barbearia.com"
                className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> Senha *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Crie uma senha de acesso"
                className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Link Exclusivo (Slug)
              </label>
              <div className="flex items-center bg-[#0B1120] border border-slate-800 rounded-xl px-3 text-xs text-slate-400">
                <span>agend.ai/</span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="w-full bg-transparent border-0 text-emerald-400 py-2.5 text-xs focus:outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/10 mt-2 active:scale-98"
            >
              Criar Conta e Salvar na Nuvem
            </button>
          </form>
        )}

        {/* OPÇÃO DE IMPORTAR CÓDIGO DIRETO */}
        <div className="pt-3 border-t border-slate-800 space-y-2 text-center">
          <button
            type="button"
            onClick={() => setShowImportSync(!showImportSync)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>{showImportSync ? 'Ocultar importação' : 'Colar código de sincronização do computador'}</span>
          </button>

          {showImportSync && (
            <div className="p-3 bg-[#0B1120] rounded-2xl border border-slate-800 space-y-2 text-left animate-fadeIn">
              <label className="block text-[11px] text-slate-400">
                Cole o link ou código de sincronização:
              </label>
              <input
                type="text"
                value={syncCode}
                onChange={(e) => setSyncCode(e.target.value)}
                placeholder="Cole o link ou código aqui..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={handleImportSyncCode}
                className="w-full py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Importar e Entrar
              </button>
            </div>
          )}
        </div>

        {/* DEMO BUTTON */}
        <div className="pt-2 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500 mb-1.5">Quer apenas testar a plataforma?</p>
          <button
            type="button"
            onClick={() => {
              onLoadDemo({
                org: INITIAL_ORG,
                services: INITIAL_SERVICES,
                barbers: INITIAL_BARBERS,
                appointments: INITIAL_APPOINTMENTS,
              });
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 text-emerald-400 text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Entrar como Conta Demonstração
          </button>
        </div>
      </div>
    </div>
  );
};
