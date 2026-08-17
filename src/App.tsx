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
import { AuthOnboardingView } from './views/AuthOnboardingView';
import { 
  INITIAL_ORG, 
  INITIAL_SERVICES, 
  INITIAL_BARBERS, 
  INITIAL_APPOINTMENTS,
  INITIAL_CLIENTS
} from './data/mockData';

const STORAGE_KEYS = {
  ORG: 'agendai_org',
  SERVICES: 'agendai_services',
  BARBERS: 'agendai_barbers',
  APPOINTMENTS: 'agendai_appointments',
  CLIENTS: 'agendai_clients',
};

export default function App() {
  // Inicialização do estado a partir do localStorage ou vazio (Zero State)
  const [org, setOrg] = useState<Organization | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORG);
    return saved ? JSON.parse(saved) : null;
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

  const [currentTab, setCurrentTab] = useState<TabType>(() => {
    const savedOrg = localStorage.getItem(STORAGE_KEYS.ORG);
    return savedOrg ? 'dashboard' : 'onboarding';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Persistência automática no localStorage
  useEffect(() => {
    if (org) {
      localStorage.setItem(STORAGE_KEYS.ORG, JSON.stringify(org));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ORG);
    }
  }, [org]);

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

  const handleAddAppointment = (newApp: Omit<Appointment, 'id'>) => {
    const created: Appointment = {
      ...newApp,
      id: 'app-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
    };
    setAppointments((prev) => [created, ...prev]);

    // Atualizar ou adicionar à lista de clientes
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

  const handleCompleteOnboarding = (newOrg: Organization) => {
    setOrg(newOrg);
    setCurrentTab('dashboard');
  };

  const handleLoadDemo = (demoData: {
    org: Organization;
    services: Service[];
    barbers: Barber[];
    appointments: Appointment[];
  }) => {
    setOrg(demoData.org);
    setServices(demoData.services);
    setBarbers(demoData.barbers);
    setAppointments(demoData.appointments);
    setClients(INITIAL_CLIENTS);
    setCurrentTab('dashboard');
  };

  const handleResetAll = () => {
    localStorage.clear();
    setOrg(null);
    setServices([]);
    setBarbers([]);
    setAppointments([]);
    setClients([]);
    setCurrentTab('onboarding');
  };

  // Se não houver organização cadastrada ou estiver na aba onboarding
  if (!org || currentTab === 'onboarding') {
    return (
      <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans p-4 sm:p-8 flex items-center justify-center">
        <AuthOnboardingView
          onComplete={handleCompleteOnboarding}
          onLoadDemo={handleLoadDemo}
          onCancel={org ? () => setCurrentTab('dashboard') : undefined}
          hasExistingOrg={!!org}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans flex flex-col md:flex-row">
      {/* SIDEBAR DE NAVEGAÇÃO ADMINISTRATIVA */}
      {currentTab !== 'booking' && (
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          org={org}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      )}

      {/* ÁREA PRINCIPAL DE CONTEÚDO */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#070B14]">
        {/* Cabeçalho Mobile */}
        {currentTab !== 'booking' && (
          <Header 
            org={org} 
            onOpenSidebar={() => setIsSidebarOpen(true)} 
          />
        )}

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

          {currentTab === 'booking' && (
            <TenantBookingView 
              org={org}
              services={services}
              barbers={barbers}
              appointments={appointments}
              onAddAppointment={handleAddAppointment}
              onBackToAdmin={() => setCurrentTab('dashboard')}
            />
          )}
        </div>
      </main>
    </div>
  );
}
