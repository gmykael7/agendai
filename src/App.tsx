import { useState, useEffect } from 'react';
import { 
  TabType, 
  Organization, 
  Service, 
  Barber, 
  Appointment 
} from './types';
import { 
  INITIAL_ORG, 
  INITIAL_SERVICES, 
  INITIAL_BARBERS, 
  INITIAL_APPOINTMENTS 
} from './data/mockData';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './views/DashboardView';
import { ServicesAndCommissionsView } from './views/ServicesAndCommissionsView';
import { TenantBookingView } from './views/TenantBookingView';
import { AuthOnboardingView } from './views/AuthOnboardingView';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [org, setOrg] = useState<Organization>(INITIAL_ORG);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [barbers, setBarbers] = useState<Barber[]>(INITIAL_BARBERS);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [realtimeActive, setRealtimeActive] = useState(true);

  // Simulação de atualizações em tempo real (Supabase Realtime)
  useEffect(() => {
    const interval = setInterval(() => {
      if (realtimeActive && Math.random() > 0.7) {
        console.log('Realtime Event Received: New Booking Created');
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [realtimeActive]);

  const handleAddAppointment = (newApp: Omit<Appointment, 'id'>) => {
    const created: Appointment = {
      ...newApp,
      id: 'app-' + Date.now(),
    };
    setAppointments((prev) => [created, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row">
      {/* SIDEBAR DE NAVEGAÇÃO ADMINISTRATIVA */}
      {currentTab !== 'booking' && currentTab !== 'onboarding' && (
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
        {/* Cabeçalho Mobile com Botão Hamburger */}
        {currentTab !== 'booking' && currentTab !== 'onboarding' && (
          <Header 
            org={org} 
            onOpenSidebar={() => setIsSidebarOpen(true)} 
          />
        )}

        {/* NAVEGAÇÃO DE CONTEÚDO BASEADA NA TAB ATIVA */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView 
              appointments={appointments}
              setAppointments={setAppointments}
              realtimeActive={realtimeActive}
              setRealtimeActive={setRealtimeActive}
            />
          )}

          {currentTab === 'services' && (
            <ServicesAndCommissionsView 
              services={services}
              setServices={setServices}
              barbers={barbers}
              setBarbers={setBarbers}
              appointments={appointments}
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

          {currentTab === 'onboarding' && (
            <AuthOnboardingView 
              onComplete={(newOrg) => {
                setOrg(newOrg);
                setCurrentTab('dashboard');
              }}
              onCancel={() => setCurrentTab('dashboard')}
            />
          )}
        </div>
      </main>
    </div>
  );
}
