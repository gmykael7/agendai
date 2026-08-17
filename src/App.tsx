import { useState, useEffect } from 'react';
import { 
  TabType, 
  Organization, 
  Service, 
  Barber, 
  Appointment 
} from './types';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './views/DashboardView';
import { ServicesView } from './views/ServicesView';
import { TeamView } from './views/TeamView';
import { SettingsView } from './views/SettingsView';
import { TenantBookingView } from './views/TenantBookingView';
import { AuthOnboardingView } from './views/AuthOnboardingView';
import { INITIAL_ORG, INITIAL_SERVICES, INITIAL_BARBERS, INITIAL_APPOINTMENTS } from './data/mockData';

const STORAGE_KEYS = {
  ORG: 'agendai_org',
  SERVICES: 'agendai_services',
  BARBERS: 'agendai_barbers',
  APPOINTMENTS: 'agendai_appointments',
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

  const [currentTab, setCurrentTab] = useState<TabType>(() => {
    const savedOrg = localStorage.getItem(STORAGE_KEYS.ORG);
    return savedOrg ? 'dashboard' : 'onboarding';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [realtimeActive, setRealtimeActive] = useState(true);

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

  // Simulação de atualizações em tempo real (Supabase Realtime)
  useEffect(() => {
    const interval = setInterval(() => {
      if (realtimeActive && org && Math.random() > 0.75) {
        console.log('Realtime Event: Channel active and listening for bookings.');
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [realtimeActive, org]);

  const handleAddAppointment = (newApp: Omit<Appointment, 'id'>) => {
    const created: Appointment = {
      ...newApp,
      id: 'app-' + Date.now(),
    };
    setAppointments((prev) => [created, ...prev]);
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
    setCurrentTab('dashboard');
  };

  const handleResetAll = () => {
    localStorage.clear();
    setOrg(null);
    setServices([]);
    setBarbers([]);
    setAppointments([]);
    setCurrentTab('onboarding');
  };

  // Se não houver organização cadastrada ou estiver na aba onboarding, renderiza onboarding
  if (!org || currentTab === 'onboarding') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-8 flex items-center justify-center">
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row">
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
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Cabeçalho Mobile */}
        {currentTab !== 'booking' && (
          <Header 
            org={org} 
            onOpenSidebar={() => setIsSidebarOpen(true)} 
          />
        )}

        {/* CONTEÚDO DA ABA ATIVA */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView 
              appointments={appointments}
              setAppointments={setAppointments}
              services={services}
              barbers={barbers}
              org={org}
              onNavigateToBooking={() => setCurrentTab('booking')}
              onNavigateToServices={() => setCurrentTab('services')}
              onNavigateToTeam={() => setCurrentTab('team')}
              realtimeActive={realtimeActive}
              setRealtimeActive={setRealtimeActive}
            />
          )}

          {currentTab === 'services' && (
            <ServicesView 
              services={services}
              setServices={setServices}
            />
          )}

          {currentTab === 'team' && (
            <TeamView 
              barbers={barbers}
              setBarbers={setBarbers}
              appointments={appointments}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView 
              org={org}
              setOrg={setOrg as React.Dispatch<React.SetStateAction<Organization>>}
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
