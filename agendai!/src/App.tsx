import { useState, useEffect } from 'react';
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

const STORAGE_KEYS = {
  CURRENT_ORG: 'agendai_current_org',
  ALL_ORGS: 'agendai_all_orgs',
  SERVICES: 'agendai_services',
  BARBERS: 'agendai_barbers',
  APPOINTMENTS: 'agendai_appointments',
  CLIENTS: 'agendai_clients',
  AUTH_SESSION: 'agendai_session_active',
};

export default function App() {
  // Lista de organizações cadastradas
  const [savedOrgs, setSavedOrgs] = useState<Organization[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ALL_ORGS);
    return saved ? JSON.parse(saved) : [];
  });

  // Organização ativa na sessão
  const [org, setOrg] = useState<Organization | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_ORG);
    return saved ? JSON.parse(saved) : null;
  });

  // Estado da sessão (se está logado ou deslogado)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const session = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    return session === 'true' && !!localStorage.getItem(STORAGE_KEYS.CURRENT_ORG);
  });

  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
    return saved ? JSON.parse(saved) : [];
  });

  const [barbers, setBarbers] = useState<Barber[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BARBERS);
    return saved ? JSON.parse(saved) : [];
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    return saved ? JSON.parse(saved) : [];
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return saved ? JSON.parse(saved) : [];
  });

  // Detecção de Rota Pública de Agendamento pelo Cliente (URL Hash ou Query Param)
  const [isClientRoute, setIsClientRoute] = useState<boolean>(() => {
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return hash.includes('agendar') || search.includes('agendar') || search.includes('booking');
  });

  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Monitorar alterações na URL para suporte a links diretos enviados aos clientes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      setIsClientRoute(hash.includes('agendar') || search.includes('agendar') || search.includes('booking'));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Persistência automática
  useEffect(() => {
    if (org) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_ORG, JSON.stringify(org));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_ORG);
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
    setIsLoggedIn(true);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, 'false');
    setCurrentTab('auth');
  };

  const handleAddAppointment = (newApp: Omit<Appointment, 'id'>) => {
    const created: Appointment = {
      ...newApp,
      id: 'app-' + Date.now(),
      date: newApp.date || new Date().toISOString().split('T')[0],
    };
    setAppointments((prev) => [created, ...prev]);

    setClients((prev) => {
      const existing = prev.find(c => c.phone === newApp.client_phone || c.name === newApp.client_name);
      if (existing) {
        return prev.map(c => c.id === existing.id ? {
          ...c,
          total_visits: c.total_visits + 1,
          total_spent: c.total_spent + newApp.price,
          last_visit: 'Hoje',
        } : c);
      } else {
        const newClient: Client = {
          id: 'cli-' + Date.now(),
          name: newApp.client_name,
          phone: newApp.client_phone,
          total_visits: 1,
          total_spent: newApp.price,
          last_visit: 'Hoje',
        };
        return [newClient, ...prev];
      }
    });
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
  };

  const handleResetAll = () => {
    localStorage.clear();
    setOrg(null);
    setSavedOrgs([]);
    setServices([]);
    setBarbers([]);
    setAppointments([]);
    setClients([]);
    setIsLoggedIn(false);
    setCurrentTab('auth');
  };

  // 1. ROTA PÚBLICA DE AGENDAMENTO DO CLIENTE
  if (isClientRoute || currentTab === 'booking') {
    return (
      <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans p-4 sm:p-6 flex items-center justify-center">
        <TenantBookingView 
          org={org || INITIAL_ORG}
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
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans flex flex-col md:flex-row">
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
