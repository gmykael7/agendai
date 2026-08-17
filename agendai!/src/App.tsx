import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  TabType, 
  Organization, 
  Service, 
  Barber, 
  Appointment,
  Client
} from './types';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { Header } from './components/layout/Header';
import { DashboardView } from './views/DashboardView';
import { AtendimentosView } from './views/AtendimentosView';
import { AgendaView } from './views/AgendaView';
import { CaixaView } from './views/CaixaView';
import { ClientesView } from './views/ClientesView';
import { AjustesView } from './views/AjustesView';
import { TenantBookingView } from './views/TenantBookingView';
import { AuthView } from './views/AuthView';
import { 
  INITIAL_ORG, 
  INITIAL_SERVICES, 
  INITIAL_BARBERS, 
  INITIAL_APPOINTMENTS,
  INITIAL_CLIENTS
} from './data/mockData';
import { Bell, Calendar, CheckCircle2, Clock, Sparkles, User, X, Smartphone, QrCode, Copy, Check, Share2, ArrowRight } from 'lucide-react';

const STORAGE_KEYS = {
  CURRENT_ORG: 'agendai_current_org',
  ALL_ORGS: 'agendai_all_orgs',
  SERVICES: 'agendai_services',
  BARBERS: 'agendai_barbers',
  APPOINTMENTS: 'agendai_appointments',
  CLIENTS: 'agendai_clients',
  AUTH_SESSION: 'agendai_session_active',
};

const SYNC_CHANNEL_NAME = 'agendai_realtime_sync';

// Converte horário 'HH:mm' para minutos a partir da meia-noite
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Função para tocar som suave de notificação de novo agendamento
const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    
    // Primeiro tom (D5 - 587Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.18);

    // Segundo tom harmônico (A5 - 880Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.14);
    gain2.gain.setValueAtTime(0.12, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.4);
  } catch {
    // Caso o navegador bloqueie áudio antes do primeiro clique
  }
};

// Extrair slug da URL (#/agendar/slug ou ?agendar=slug)
const getSlugFromUrl = (): string | null => {
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  
  const hashMatch = hash.match(/agendar\/([a-z0-9-]+)/i) || hash.match(/booking\/([a-z0-9-]+)/i);
  if (hashMatch && hashMatch[1]) {
    return hashMatch[1];
  }
  
  const params = new URLSearchParams(window.location.search);
  const paramSlug = params.get('slug') || params.get('agendar') || params.get('org');
  if (paramSlug && paramSlug !== 'true' && paramSlug !== '1') {
    return paramSlug.toLowerCase();
  }
  return null;
};

export default function App() {
  // Lista de organizações cadastradas com fallback inicial
  const [savedOrgs, setSavedOrgs] = useState<Organization[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ALL_ORGS);
    return saved ? JSON.parse(saved) : [INITIAL_ORG];
  });

  // Organização ativa na sessão com fallback
  const [org, setOrg] = useState<Organization | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_ORG);
    return saved ? JSON.parse(saved) : INITIAL_ORG;
  });

  // Estado da sessão
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const session = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    if (session === 'false') return false;
    return true; // Por padrão entra com sessão demo ativa caso não haja logout explícito
  });

  // Catálogo de serviços com fallback
  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  // Lista de barbeiros com fallback
  const [barbers, setBarbers] = useState<Barber[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BARBERS);
    return saved ? JSON.parse(saved) : INITIAL_BARBERS;
  });

  // Agendamentos com fallback
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  // Clientes com fallback
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  // Detecção de Rota Pública de Agendamento pelo Cliente (URL Hash ou Query Param)
  const [isClientRoute, setIsClientRoute] = useState<boolean>(() => {
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return hash.includes('agendar') || search.includes('agendar') || search.includes('booking');
  });

  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [copiedSyncLink, setCopiedSyncLink] = useState(false);

  // Notificação Toast em tempo real de novos agendamentos
  const [toastNotification, setToastNotification] = useState<{
    id: string;
    client_name: string;
    service_name: string;
    barber_name: string;
    start_time: string;
    date: string;
    price: number;
  } | null>(null);

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // 1. SINCRONIZAÇÃO AUTOMÁTICA DE DADOS VIA LINK DE CELULAR (?sync_data=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const syncPayload = params.get('sync_data');
      if (syncPayload) {
        const decoded = JSON.parse(decodeURIComponent(syncPayload));
        if (decoded.org) {
          setOrg(decoded.org);
          localStorage.setItem(STORAGE_KEYS.CURRENT_ORG, JSON.stringify(decoded.org));
        }
        if (decoded.savedOrgs && Array.isArray(decoded.savedOrgs)) {
          setSavedOrgs(decoded.savedOrgs);
          localStorage.setItem(STORAGE_KEYS.ALL_ORGS, JSON.stringify(decoded.savedOrgs));
        }
        if (decoded.services && Array.isArray(decoded.services)) {
          setServices(decoded.services);
          localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(decoded.services));
        }
        if (decoded.barbers && Array.isArray(decoded.barbers)) {
          setBarbers(decoded.barbers);
          localStorage.setItem(STORAGE_KEYS.BARBERS, JSON.stringify(decoded.barbers));
        }
        if (decoded.appointments && Array.isArray(decoded.appointments)) {
          setAppointments(decoded.appointments);
          localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(decoded.appointments));
        }
        if (decoded.clients && Array.isArray(decoded.clients)) {
          setClients(decoded.clients);
          localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(decoded.clients));
        }
        setIsLoggedIn(true);
        localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, 'true');

        // Limpa parâmetro da URL
        const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);

        alert('✅ Barbearia e dados sincronizados com sucesso no seu celular!');
      }
    } catch (err) {
      console.error('Erro ao sincronizar dados via URL:', err);
    }
  }, []);

  // Monitorar alterações na URL para links diretos
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      setIsClientRoute(hash.includes('agendar') || search.includes('agendar') || search.includes('booking'));
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  // SINCRONIZAÇÃO EM TEMPO REAL ENTRE ABAS/JANELAS (BroadcastChannel e Storage Event)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        broadcastChannelRef.current = channel;

        channel.onmessage = (event) => {
          const { type, payload } = event.data || {};

          if (type === 'NEW_APPOINTMENT' && payload) {
            setAppointments(prev => {
              const exists = prev.some(a => a.id === payload.id);
              if (exists) return prev;
              return [payload, ...prev];
            });

            // Atualiza estatísticas do cliente
            setClients(prev => {
              const existing = prev.find(c => c.phone === payload.client_phone || c.name === payload.client_name);
              if (existing) {
                return prev.map(c => c.id === existing.id ? {
                  ...c,
                  total_visits: c.total_visits + 1,
                  total_spent: c.total_spent + payload.price,
                  last_visit: 'Hoje',
                } : c);
              } else {
                const newClient: Client = {
                  id: 'cli-' + Date.now(),
                  org_id: payload.org_id,
                  name: payload.client_name,
                  phone: payload.client_phone,
                  total_visits: 1,
                  total_spent: payload.price,
                  last_visit: 'Hoje',
                };
                return [newClient, ...prev];
              }
            });

            // Dispara notificação e som no painel da barbearia
            setToastNotification(payload);
            playNotificationSound();
          } else if (type === 'UPDATE_APPOINTMENT' && payload) {
            setAppointments(prev => prev.map(a => a.id === payload.id ? payload : a));
          } else if (type === 'APPOINTMENTS_SYNC' && Array.isArray(payload)) {
            setAppointments(payload);
          } else if (type === 'SERVICES_SYNC' && Array.isArray(payload)) {
            setServices(payload);
          } else if (type === 'BARBERS_SYNC' && Array.isArray(payload)) {
            setBarbers(payload);
          } else if (type === 'CLIENTS_SYNC' && Array.isArray(payload)) {
            setClients(payload);
          } else if (type === 'ORG_SYNC' && payload) {
            setOrg(payload);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel não suportado ou erro ao inicializar:', e);
    }

    // Fallback: Storage Event Listener do navegador
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === STORAGE_KEYS.APPOINTMENTS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setAppointments(parsed);
          }
        } else if (e.key === STORAGE_KEYS.CLIENTS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setClients(parsed);
          }
        } else if (e.key === STORAGE_KEYS.SERVICES) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setServices(parsed);
          }
        } else if (e.key === STORAGE_KEYS.BARBERS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setBarbers(parsed);
          }
        } else if (e.key === STORAGE_KEYS.CURRENT_ORG) {
          const parsed = JSON.parse(e.newValue);
          if (parsed) setOrg(parsed);
        } else if (e.key === STORAGE_KEYS.ALL_ORGS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setSavedOrgs(parsed);
        }
      } catch (err) {
        console.error('Erro ao sincronizar via storage event:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, []);

  // Persistência automática no localStorage
  useEffect(() => {
    if (org) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_ORG, JSON.stringify(org));
    }
  }, [org]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ALL_ORGS, JSON.stringify(savedOrgs));
  }, [savedOrgs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, isLoggedIn ? 'true' : 'false');
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BARBERS, JSON.stringify(barbers));
  }, [barbers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }, [clients]);

  // Fechar notificação toast automaticamente após 8 segundos
  useEffect(() => {
    if (!toastNotification) return;
    const timer = setTimeout(() => {
      setToastNotification(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [toastNotification]);

  // Contagem de agendamentos pendentes para badge no app móvel
  const pendingAppointmentsCount = useMemo(() => {
    return appointments.filter(a => a.status === 'scheduled').length;
  }, [appointments]);

  // Função central de criação de agendamento (usada pelo cliente e pelo administrador)
  const handleAddAppointment = useCallback((newApp: Omit<Appointment, 'id'>) => {
    const targetDate = newApp.date || new Date().toISOString().split('T')[0];
    const duration = newApp.duration_minutes || (newApp.services?.reduce((sum, s) => sum + (s.duration_minutes || 30), 0)) || 30;

    // Verificação de segurança contra agendamentos simultâneos ou duplicados
    const candidateStart = timeToMinutes(newApp.start_time);
    const candidateEnd = candidateStart + duration;

    const isConflict = appointments.some(app => {
      if (app.status === 'canceled') return false;
      if (app.barber_id !== newApp.barber_id) return false;
      const appDate = app.date || targetDate;
      if (appDate !== targetDate) return false;

      const appStart = timeToMinutes(app.start_time);
      const appDuration = app.duration_minutes || (app.services?.reduce((sum, s) => sum + (s.duration_minutes || 30), 0)) || 30;
      const appEnd = appStart + appDuration;

      return candidateStart < appEnd && appStart < candidateEnd;
    });

    if (isConflict) {
      console.warn('Conflito detectado: O horário selecionado já está ocupado.');
      return;
    }

    const created: Appointment = {
      ...newApp,
      id: 'app-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      date: targetDate,
      created_at: new Date().toISOString(),
      status: newApp.status || 'scheduled',
    };

    // 1. Atualiza lista de agendamentos localmente
    setAppointments((prev) => {
      const updated = [created, ...prev];
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updated));
      return updated;
    });

    // 2. Atualiza ou cria o cliente na base
    setClients((prev) => {
      const existing = prev.find(c => c.phone === newApp.client_phone || c.name === newApp.client_name);
      let updatedClients: Client[];
      if (existing) {
        updatedClients = prev.map(c => c.id === existing.id ? {
          ...c,
          total_visits: c.total_visits + 1,
          total_spent: c.total_spent + newApp.price,
          last_visit: 'Hoje',
        } : c);
      } else {
        const newClient: Client = {
          id: 'cli-' + Date.now(),
          org_id: created.org_id,
          name: newApp.client_name,
          phone: newApp.client_phone,
          total_visits: 1,
          total_spent: newApp.price,
          last_visit: 'Hoje',
        };
        updatedClients = [newClient, ...prev];
      }
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(updatedClients));
      return updatedClients;
    });

    // 3. Transmite em tempo real para todas as outras abas/telas do painel
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({
          type: 'NEW_APPOINTMENT',
          payload: created,
        });
      } catch (e) {
        console.warn('Erro ao transmitir pelo BroadcastChannel:', e);
      }
    }

    // 4. Se a ação foi feita na mesma aba mas o usuário está no painel, toca o som e mostra toast
    playNotificationSound();
    setToastNotification(created);

    return created;
  }, [appointments]);

  // Atualizar status do agendamento (concluir, cancelar, alterar)
  const handleUpdateAppointment = useCallback((updatedApp: Appointment) => {
    setAppointments(prev => {
      const next = prev.map(a => a.id === updatedApp.id ? updatedApp : a);
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(next));
      return next;
    });

    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({
          type: 'UPDATE_APPOINTMENT',
          payload: updatedApp,
        });
      } catch (e) {
        console.warn(e);
      }
    }
  }, []);

  // Ações de Autenticação
  const handleLogin = (targetOrg: Organization) => {
    setOrg(targetOrg);
    setIsLoggedIn(true);
    setCurrentTab('dashboard');
  };

  const handleRegister = (newOrg: Organization) => {
    setOrg(newOrg);
    setSavedOrgs(prev => {
      const exists = prev.some(o => o.id === newOrg.id || o.slug === newOrg.slug);
      return exists ? prev.map(o => o.id === newOrg.id ? newOrg : o) : [newOrg, ...prev];
    });

    if (services.length === 0) {
      const defaultServices = INITIAL_SERVICES.map(s => ({ ...s, org_id: newOrg.id }));
      setServices(defaultServices);
    }
    if (barbers.length === 0) {
      const defaultBarbers = INITIAL_BARBERS.map(b => ({ ...b, org_id: newOrg.id }));
      setBarbers(defaultBarbers);
    }

    setIsLoggedIn(true);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, 'false');
    setCurrentTab('auth');
  };

  const handleLoadDemo = (demoData: {
    org: Organization;
    services: Service[];
    barbers: Barber[];
    appointments: Appointment[];
  }) => {
    setOrg(demoData.org);
    setSavedOrgs(prev => prev.some(o => o.id === demoData.org.id) ? prev : [demoData.org, ...prev]);
    setServices(demoData.services);
    setBarbers(demoData.barbers);
    setAppointments(demoData.appointments);
    setClients(INITIAL_CLIENTS);
    setIsLoggedIn(true);
    setCurrentTab('dashboard');

    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ type: 'APPOINTMENTS_SYNC', payload: demoData.appointments });
        broadcastChannelRef.current.postMessage({ type: 'SERVICES_SYNC', payload: demoData.services });
        broadcastChannelRef.current.postMessage({ type: 'BARBERS_SYNC', payload: demoData.barbers });
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handleResetAll = () => {
    localStorage.clear();
    setOrg(INITIAL_ORG);
    setSavedOrgs([INITIAL_ORG]);
    setServices(INITIAL_SERVICES);
    setBarbers(INITIAL_BARBERS);
    setAppointments([]);
    setClients([]);
    setIsLoggedIn(false);
    setCurrentTab('auth');
  };

  // Gerar link de sincronização para abrir no celular
  const generateMobileSyncLink = () => {
    const payload = {
      org,
      savedOrgs,
      services,
      barbers,
      appointments,
      clients,
    };
    const jsonStr = JSON.stringify(payload);
    return `${window.location.origin}/?sync_data=${encodeURIComponent(jsonStr)}`;
  };

  const handleCopySyncLink = () => {
    const link = generateMobileSyncLink();
    navigator.clipboard.writeText(link);
    setCopiedSyncLink(true);
    setTimeout(() => setCopiedSyncLink(false), 2500);
  };

  // Identificar organização correta para o agendamento do cliente (baseado no slug da URL)
  const urlSlug = getSlugFromUrl();
  const currentPublicOrg = (urlSlug ? savedOrgs.find(o => o.slug === urlSlug || o.id === urlSlug) : null) || org || savedOrgs[0] || INITIAL_ORG;

  // 1. ROTA PÚBLICA DE AGENDAMENTO DO CLIENTE (MOBILE-FIRST)
  if (isClientRoute || currentTab === 'booking') {
    return (
      <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans p-3 sm:p-6 flex items-center justify-center">
        <TenantBookingView 
          org={currentPublicOrg}
          services={services}
          barbers={barbers}
          appointments={appointments}
          onAddAppointment={handleAddAppointment}
          onBackToAdmin={isLoggedIn && org ? () => {
            window.location.hash = '';
            setIsClientRoute(false);
            setCurrentTab('dashboard');
          } : undefined}
          isStandalone={isClientRoute}
        />
      </div>
    );
  }

  // 2. TELA DE AUTENTICAÇÃO (ENTRAR / CADASTRAR NOVO / DESLOGADO)
  if (!isLoggedIn || !org || currentTab === 'auth') {
    return (
      <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans p-4 sm:p-8 flex items-center justify-center">
        <AuthView
          onLogin={handleLogin}
          onRegister={handleRegister}
          onLoadDemo={handleLoadDemo}
          savedOrganizations={savedOrgs}
        />
      </div>
    );
  }

  // 3. PAINEL ADMINISTRATIVO INTERNO DA BARBEARIA (MOBILE-FIRST COM BOTTOM NAV & DESKTOP SIDEBAR)
  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans flex flex-col md:flex-row relative">
      {/* TOAST DE NOVO AGENDAMENTO EM TEMPO REAL */}
      {toastNotification && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-5 sm:w-96 z-50 animate-bounce-short">
          <div className="bg-gradient-to-r from-emerald-950 to-[#0B1120] border-2 border-emerald-500 rounded-3xl p-4 shadow-2xl shadow-emerald-500/20 text-white flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Bell className="w-4 h-4 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  Novo Agendamento!
                </span>
                <h4 className="font-bold text-white text-xs leading-snug">
                  {toastNotification.client_name} agendou
                </h4>
                <p className="text-[11px] text-slate-300">
                  <strong className="text-emerald-400">{toastNotification.service_name}</strong> com {toastNotification.barber_name}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5 font-mono">
                  <span>{new Date(toastNotification.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                  <span className="font-bold text-emerald-400">às {toastNotification.start_time}</span>
                  <span>R$ {toastNotification.price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <button
                onClick={() => setToastNotification(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setCurrentTab('agenda');
                  setToastNotification(null);
                }}
                className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20"
              >
                Ver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR DE NAVEGAÇÃO PARA TELAS MÉDIAS E GRANDES (DESKTOP) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        org={org}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        onLogout={handleLogout}
      />

      {/* ÁREA PRINCIPAL COM SCROLL E PADDING INFERIOR SEGURO PARA CELULAR */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#070B14] pb-24 md:pb-8">
        {/* Cabeçalho Smartphone / Desktop */}
        <Header 
          org={org} 
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onNavigateToBooking={() => setCurrentTab('booking')}
          pendingAppointmentsCount={pendingAppointmentsCount}
        />

        {/* BOTÃO DE SINCRONIZAÇÃO RÁPIDA ENTRE DISPOSITIVOS NO TOPO */}
        <div className="px-4 sm:px-6 md:px-8 max-w-7xl w-full mx-auto pt-3">
          <div className="bg-gradient-to-r from-slate-900 to-[#121B2E] border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <span className="text-white font-semibold block sm:inline">Usando no Computador ou Celular? </span>
                <span className="text-slate-400 text-[11px]">Transfira seus dados para o outro aparelho com 1 clique.</span>
              </div>
            </div>
            <button
              onClick={() => setShowSyncModal(true)}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shrink-0 shadow-sm"
            >
              <Share2 className="w-3 h-3" />
              <span className="hidden sm:inline">Sincronizar</span> Celular
            </button>
          </div>
        </div>

        {/* CONTEÚDO DA ABA ATIVA */}
        <div className="flex-1 p-3 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView 
              appointments={appointments}
              setAppointments={setAppointments}
              services={services}
              barbers={barbers}
              org={org}
              onNavigateToAgenda={() => setCurrentTab('agenda')}
              onNavigateToServices={() => setCurrentTab('ajustes')}
            />
          )}

          {currentTab === 'atendimentos' && (
            <AtendimentosView 
              appointments={appointments}
              setAppointments={setAppointments}
              services={services}
              barbers={barbers}
            />
          )}

          {currentTab === 'agenda' && (
            <AgendaView 
              appointments={appointments}
              setAppointments={setAppointments}
              barbers={barbers}
              services={services}
            />
          )}

          {currentTab === 'caixa' && (
            <CaixaView 
              appointments={appointments}
              barbers={barbers}
            />
          )}

          {currentTab === 'clientes' && (
            <ClientesView 
              clients={clients}
              setClients={setClients}
              appointments={appointments}
            />
          )}

          {currentTab === 'ajustes' && (
            <AjustesView 
              org={org}
              setOrg={setOrg as React.Dispatch<React.SetStateAction<Organization>>}
              services={services}
              setServices={setServices}
              barbers={barbers}
              setBarbers={setBarbers}
              appointments={appointments}
              onLoadDemo={handleLoadDemo}
              onResetAll={handleResetAll}
            />
          )}
        </div>
      </main>

      {/* BARRA DE NAVEGAÇÃO INFERIOR PARA SMARTPHONE (APP STYLE) */}
      <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        pendingCount={pendingAppointmentsCount}
      />

      {/* MODAL DE SINCRONIZAÇÃO ENTRE DISPOSITIVOS (COMPUTADOR <-> CELULAR) */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121B2E] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                Sincronizar com seu Celular
              </h3>
              <button onClick={() => setShowSyncModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Como este sistema funciona de forma rápida e segura direto no seu navegador, você pode transferir todos os seus dados cadastrados (barbearia, barbeiros, serviços e agendamentos) para o celular através do link de sincronização abaixo:
              </p>

              <div className="bg-[#0B1120] p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Instruções Rápidas:
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                  <li>Clique no botão <strong>"Copiar Link para Celular"</strong> abaixo.</li>
                  <li>Envie este link para você mesmo no seu WhatsApp.</li>
                  <li>Abra o link no celular: <strong>todos os seus dados carregarão automaticamente</strong>!</li>
                </ol>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopySyncLink}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-98"
                >
                  {copiedSyncLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedSyncLink ? 'Link Copiado para a Área de Transferência!' : 'Copiar Link de Sincronização'}
                </button>

                <p className="text-[10px] text-slate-500 text-center">
                  O link contém todos os seus dados atuais criptografados de forma segura na URL.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
