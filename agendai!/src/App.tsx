import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  TabType, 
  Organization, 
  Service, 
  Barber, 
  Appointment,
  Client
} from './types';
import { Sidebar } from './components/layout/Sidebar';
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
import { Bell, Calendar, CheckCircle2, Clock, Sparkles, User, X } from 'lucide-react';

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

  // Função central de criação de agendamento (usada pelo cliente e pelo administrador)
  const handleAddAppointment = useCallback((newApp: Omit<Appointment, 'id'>) => {
    const created: Appointment = {
      ...newApp,
      id: 'app-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      date: newApp.date || new Date().toISOString().split('T')[0],
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
  }, []);

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

    // Se não tiver serviços ou barbeiros cadastrados, fornece um conjunto inicial
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

  // Identificar organização correta para o agendamento do cliente (baseado no slug da URL)
  const urlSlug = getSlugFromUrl();
  const currentPublicOrg = (urlSlug ? savedOrgs.find(o => o.slug === urlSlug || o.id === urlSlug) : null) || org || savedOrgs[0] || INITIAL_ORG;

  // 1. ROTA PÚBLICA DE AGENDAMENTO DO CLIENTE
  if (isClientRoute || currentTab === 'booking') {
    return (
      <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans p-4 sm:p-6 flex items-center justify-center">
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

  // 3. PAINEL ADMINISTRATIVO INTERNO DA BARBEARIA
  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans flex flex-col md:flex-row relative">
      {/* TOAST DE NOVO AGENDAMENTO EM TEMPO REAL */}
      {toastNotification && (
        <div className="fixed top-5 right-5 z-50 max-w-md w-full animate-bounce-short">
          <div className="bg-gradient-to-r from-emerald-950 to-[#0B1120] border-2 border-emerald-500 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-emerald-500/20 text-white flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
                    Novo Agendamento!
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm">
                  {toastNotification.client_name} agendou um horário
                </h4>
                <p className="text-xs text-slate-300">
                  <strong className="text-emerald-400">{toastNotification.service_name}</strong> com <strong className="text-white">{toastNotification.barber_name}</strong>
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-400" />
                    {new Date(toastNotification.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-emerald-400">
                    <Clock className="w-3 h-3" />
                    às {toastNotification.start_time}
                  </span>
                  <span>
                    R$ {toastNotification.price.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => setToastNotification(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                title="Fechar alerta"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setCurrentTab('agenda');
                  setToastNotification(null);
                }}
                className="text-[11px] font-bold text-emerald-400 hover:underline bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20"
              >
                Ver Agenda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR DE NAVEGAÇÃO */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        org={org}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        onLogout={handleLogout}
      />

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#070B14]">
        {/* Cabeçalho Mobile */}
        <Header 
          org={org} 
          onOpenSidebar={() => setIsSidebarOpen(true)} 
        />

        {/* CONTEÚDO DA ABA ATIVA */}
        <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
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
    </div>
  );
}
