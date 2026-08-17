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
import { 
  saveBarbershopToCloud, 
  loadBarbershopFromCloud, 
  pushAppointmentToCloud 
} from './services/cloudSync';
import { Bell, Calendar, CheckCircle2, Clock, Sparkles, User, X, Smartphone, QrCode, Copy, Check, Share2, ArrowRight, Cloud, RefreshCw, Loader2, Scissors } from 'lucide-react';

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

const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    
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
  } catch {}
};

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
  const [savedOrgs, setSavedOrgs] = useState<Organization[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ALL_ORGS);
    return saved ? JSON.parse(saved) : [INITIAL_ORG];
  });

  const [org, setOrg] = useState<Organization | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_ORG);
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const session = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    const hasOrg = !!localStorage.getItem(STORAGE_KEYS.CURRENT_ORG);
    return session === 'true' && hasOrg;
  });

  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [barbers, setBarbers] = useState<Barber[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BARBERS);
    return saved ? JSON.parse(saved) : INITIAL_BARBERS;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [isClientRoute, setIsClientRoute] = useState<boolean>(() => {
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return hash.includes('agendar') || search.includes('agendar') || search.includes('booking');
  });

  const [isLoadingPublicData, setIsLoadingPublicData] = useState<boolean>(false);
  const [publicOrgData, setPublicOrgData] = useState<Organization | null>(null);

  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [copiedSyncLink, setCopiedSyncLink] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

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
  const isInitialLoadDone = useRef(false);

  // 1. CARREGAMENTO INICIAL: BUSCAR DADOS NA NUVEM AO ABRIR QUALQUER PÁGINA
  useEffect(() => {
    const initApp = async () => {
      const urlSlug = getSlugFromUrl();

      // CASO A: O usuário abriu a página pública do cliente (/#/agendar/:slug)
      if (urlSlug || isClientRoute) {
        const targetSlug = urlSlug || org?.slug || 'barbearia-vanguarda';
        setIsLoadingPublicData(true);
        try {
          const cloudData = await loadBarbershopFromCloud(targetSlug);
          if (cloudData && cloudData.org) {
            setPublicOrgData(cloudData.org);
            if (cloudData.services && cloudData.services.length > 0) setServices(cloudData.services);
            if (cloudData.barbers && cloudData.barbers.length > 0) setBarbers(cloudData.barbers);
            if (cloudData.appointments) setAppointments(cloudData.appointments);
          }
        } catch (e) {
          console.debug('Erro ao carregar dados públicos da nuvem:', e);
        } finally {
          setIsLoadingPublicData(false);
        }
      } 
      // CASO B: O usuário está no painel administrativo e já fez login antes
      else if (org && (org.email || org.slug)) {
        try {
          const cloudData = await loadBarbershopFromCloud(org.email || org.slug);
          if (cloudData && cloudData.org) {
            setOrg(cloudData.org);
            if (cloudData.savedOrgs) setSavedOrgs(cloudData.savedOrgs);
            if (cloudData.services) setServices(cloudData.services);
            if (cloudData.barbers) setBarbers(cloudData.barbers);
            if (cloudData.appointments) setAppointments(cloudData.appointments);
            if (cloudData.clients) setClients(cloudData.clients);
          }
        } catch (e) {
          console.debug('Erro ao restaurar da nuvem:', e);
        }
      }

      isInitialLoadDone.current = true;
    };

    initApp();
  }, [isClientRoute]);

  // 2. SINCRONIZAÇÃO AUTOMÁTICA VIA URL (?sync_data=...)
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

        const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);

        alert('✅ Barbearia e dados sincronizados com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao sincronizar via URL:', err);
    }
  }, []);

  // Monitorar alterações na URL
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

  // 3. SALVAR AUTOMATICAMENTE NA NUVEM APENAS QUANDO O CARREGAMENTO INICIAL JÁ FOI FEITO
  useEffect(() => {
    if (!isInitialLoadDone.current) return;
    if (!org || (!org.email && !org.slug)) return;

    const timer = setTimeout(() => {
      saveBarbershopToCloud({
        org,
        savedOrgs,
        services,
        barbers,
        appointments,
        clients,
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [org, savedOrgs, services, barbers, appointments, clients]);

  // 4. CONSULTAR A NUVEM PERIODICAMENTE PARA NOVOS AGENDAMENTOS ONLINE
  useEffect(() => {
    if (!org || !isLoggedIn || isClientRoute) return;

    const syncCloudData = async () => {
      try {
        const cloudData = await loadBarbershopFromCloud(org.email || org.slug);
        if (cloudData && Array.isArray(cloudData.appointments)) {
          setAppointments(prev => {
            const existingIds = new Set(prev.map(a => a.id));
            const newIncoming = cloudData.appointments.filter(a => !existingIds.has(a.id));
            if (newIncoming.length > 0) {
              playNotificationSound();
              setToastNotification(newIncoming[0]);
              return [...newIncoming, ...prev];
            }
            return prev;
          });
        }
      } catch (e) {}
    };

    const interval = setInterval(syncCloudData, 5000);
    window.addEventListener('focus', syncCloudData);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', syncCloudData);
    };
  }, [org, isLoggedIn, isClientRoute]);

  // Sincronização entre abas com BroadcastChannel e storage event
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
    } catch (e) {}

    const handleStorageChange = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === STORAGE_KEYS.APPOINTMENTS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setAppointments(parsed);
        } else if (e.key === STORAGE_KEYS.CLIENTS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setClients(parsed);
        } else if (e.key === STORAGE_KEYS.SERVICES) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setServices(parsed);
        } else if (e.key === STORAGE_KEYS.BARBERS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setBarbers(parsed);
        } else if (e.key === STORAGE_KEYS.CURRENT_ORG) {
          const parsed = JSON.parse(e.newValue);
          if (parsed) setOrg(parsed);
        } else if (e.key === STORAGE_KEYS.ALL_ORGS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setSavedOrgs(parsed);
        }
      } catch (err) {}
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, []);

  // Persistência local
  useEffect(() => {
    if (org) localStorage.setItem(STORAGE_KEYS.CURRENT_ORG, JSON.stringify(org));
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

  useEffect(() => {
    if (!toastNotification) return;
    const timer = setTimeout(() => {
      setToastNotification(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [toastNotification]);

  const pendingAppointmentsCount = useMemo(() => {
    return appointments.filter(a => a.status === 'scheduled').length;
  }, [appointments]);

  const handleForceCloudSync = async () => {
    if (!org) return;
    setIsManualSyncing(true);
    setSyncStatusMsg('');

    const success = await saveBarbershopToCloud({
      org,
      savedOrgs,
      services,
      barbers,
      appointments,
      clients,
    });

    setIsManualSyncing(false);
    if (success) {
      setSyncStatusMsg('✅ Dados salvos com sucesso na nuvem!');
      setTimeout(() => setSyncStatusMsg(''), 4000);
    } else {
      setSyncStatusMsg('⚠️ Dados salvos localmente.');
    }
  };

  const handleAddAppointment = useCallback((newApp: Omit<Appointment, 'id'>) => {
    const targetDate = newApp.date || new Date().toISOString().split('T')[0];
    const duration = newApp.duration_minutes || (newApp.services?.reduce((sum, s) => sum + (s.duration_minutes || 30), 0)) || 30;

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
      return;
    }

    const created: Appointment = {
      ...newApp,
      id: 'app-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      date: targetDate,
      created_at: new Date().toISOString(),
      status: newApp.status || 'scheduled',
    };

    setAppointments((prev) => {
      const updated = [created, ...prev];
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updated));
      return updated;
    });

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

    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({
          type: 'NEW_APPOINTMENT',
          payload: created,
        });
      } catch (e) {}
    }

    pushAppointmentToCloud(created, org?.slug);

    playNotificationSound();
    setToastNotification(created);

    return created;
  }, [appointments, org?.slug]);

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

    let currentServices = services;
    let currentBarbers = barbers;

    if (services.length === 0) {
      currentServices = INITIAL_SERVICES.map(s => ({ ...s, org_id: newOrg.id }));
      setServices(currentServices);
    }
    if (barbers.length === 0) {
      currentBarbers = INITIAL_BARBERS.map(b => ({ ...b, org_id: newOrg.id }));
      setBarbers(currentBarbers);
    }

    saveBarbershopToCloud({
      org: newOrg,
      savedOrgs: [newOrg],
      services: currentServices,
      barbers: currentBarbers,
      appointments: [],
      clients: [],
    });

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

    saveBarbershopToCloud({
      org: demoData.org,
      savedOrgs: [demoData.org],
      services: demoData.services,
      barbers: demoData.barbers,
      appointments: demoData.appointments,
      clients: INITIAL_CLIENTS,
    });

    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ type: 'APPOINTMENTS_SYNC', payload: demoData.appointments });
        broadcastChannelRef.current.postMessage({ type: 'SERVICES_SYNC', payload: demoData.services });
        broadcastChannelRef.current.postMessage({ type: 'BARBERS_SYNC', payload: demoData.barbers });
      } catch (e) {}
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

  const urlSlug = getSlugFromUrl();
  const currentPublicOrg = publicOrgData || (urlSlug ? savedOrgs.find(o => o.slug === urlSlug || o.id === urlSlug) : null) || org || savedOrgs[0] || INITIAL_ORG;

  // 1. ROTA PÚBLICA DE AGENDAMENTO DO CLIENTE (MOBILE-FIRST)
  if (isClientRoute || currentTab === 'booking') {
    if (isLoadingPublicData) {
      return (
        <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
            <Scissors className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Carregando Barbearia...</h3>
            <p className="text-xs text-slate-400 mt-1">Buscando catálogo de serviços e horários em tempo real.</p>
          </div>
        </div>
      );
    }

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

  // 2. TELA DE AUTENTICAÇÃO
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

  // 3. PAINEL ADMINISTRATIVO INTERNO DA BARBEARIA
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

      {/* SIDEBAR PARA DESKTOP */}
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
        <Header 
          org={org} 
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onNavigateToBooking={() => setCurrentTab('booking')}
          pendingAppointmentsCount={pendingAppointmentsCount}
        />

        {/* BARRA DE STATUS DE NUVEM COM BOTÃO DIRETO DE SINCRONIZAÇÃO */}
        <div className="px-3 sm:px-6 md:px-8 max-w-7xl w-full mx-auto pt-3">
          <div className="bg-gradient-to-r from-slate-900 via-[#121B2E] to-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Cloud className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-xs">Nuvem Conectada</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] text-emerald-400/90 font-mono">({org?.email || org?.slug})</span>
                </div>
                <span className="text-slate-400 text-[11px] truncate block">
                  Ao logar com este e-mail em qualquer celular, seus dados carregarão automaticamente.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleForceCloudSync}
                disabled={isManualSyncing}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                title="Salvar imediatamente na nuvem"
              >
                <RefreshCw className={`w-3 h-3 ${isManualSyncing ? 'animate-spin' : ''}`} />
                <span>{isManualSyncing ? 'Salvando...' : 'Salvar na Nuvem'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSyncModal(true)}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Abrir no Celular</span>
              </button>
            </div>
          </div>

          {syncStatusMsg && (
            <p className="text-xs text-emerald-400 mt-1.5 font-medium px-2 animate-fadeIn">
              {syncStatusMsg}
            </p>
          )}
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

      {/* MODAL DE SINCRONIZAÇÃO ENTRE DISPOSITIVOS */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#121B2E] border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cloud className="w-5 h-5 text-emerald-400" />
                Sincronização em Nuvem
              </h3>
              <button onClick={() => setShowSyncModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Sua conta está conectada e os dados estão salvos na nuvem sob o e-mail: <strong className="text-emerald-400">{org?.email}</strong>.
              </p>

              <div className="bg-[#0B1120] p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Como abrir em qualquer celular:
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                  <li>No celular, acesse a página de login.</li>
                  <li>Digite exatamente o e-mail: <strong className="text-white">{org?.email}</strong></li>
                  <li>O app busca e carrega automaticamente todos os seus barbeiros, serviços e agendamentos salvos!</li>
                </ol>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopySyncLink}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-98"
                >
                  {copiedSyncLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedSyncLink ? 'Link Copiado! Cole no WhatsApp e abra no celular' : 'Copiar Link Direto com Todos os Dados'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
