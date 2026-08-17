import { Organization, Service, Barber, Appointment, Client } from '../types';

export const INITIAL_ORG: Organization = {
  id: 'org-1',
  name: 'Barbearia Vanguarda',
  owner_name: 'Felipe Mateus',
  slug: 'barbearia-vanguarda',
  phone: '(84) 99999-8888',
  address: 'Rua Central, 120 - Centro',
  primary_color: '#10b981',
  open_hour: '08:00',
  close_hour: '20:00',
};

export const INITIAL_SERVICES: Service[] = [
  { id: '1', name: 'Corte Cabelo Executivo', price: 50.00, duration_minutes: 30, category: 'Cabelo', active: true },
  { id: '2', name: 'Barba Completa com Toalha Quente', price: 40.00, duration_minutes: 30, category: 'Barba', active: true },
  { id: '3', name: 'Combo Cabelo + Barba Premium', price: 80.00, duration_minutes: 60, category: 'Combos', active: true },
  { id: '4', name: 'Design de Sobrancelha Navalhada', price: 25.00, duration_minutes: 15, category: 'Estética', active: true },
];

export const INITIAL_BARBERS: Barber[] = [
  { 
    id: 'b1', 
    full_name: 'Lucas Silva (Mestre)', 
    role: 'Barbeiro Sénior', 
    commission_rate: 50, 
    phone: '(84) 98888-7777', 
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    active: true,
  },
  { 
    id: 'b2', 
    full_name: 'Gabriel Santos', 
    role: 'Especialista em Barba', 
    commission_rate: 45, 
    phone: '(84) 97777-6666', 
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    active: true,
  },
];

export const INITIAL_CLIENTS: Client[] = [
  { id: 'c1', name: 'Carlos Oliveira', phone: '(84) 99111-2222', total_visits: 5, total_spent: 250.00, last_visit: 'Hoje' },
  { id: 'c2', name: 'Roberto Mendes', phone: '(84) 99222-3333', total_visits: 3, total_spent: 240.00, last_visit: 'Hoje' },
  { id: 'c3', name: 'Eduardo Lima', phone: '(84) 99333-4444', total_visits: 2, total_spent: 80.00, last_visit: 'Ontem' },
  { id: 'c4', name: 'Marcos Vinicius', phone: '(84) 99444-5555', total_visits: 1, total_spent: 50.00, last_visit: '12/08/2026' },
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  { 
    id: 'a1', 
    client_name: 'Carlos Oliveira', 
    client_phone: '(84) 99111-2222', 
    service_id: '1', 
    service_name: 'Corte Cabelo Executivo', 
    barber_id: 'b1', 
    barber_name: 'Lucas Silva (Mestre)', 
    start_time: '10:00', 
    price: 50.00, 
    status: 'completed',
    payment_method: 'pix',
  },
  { 
    id: 'a2', 
    client_name: 'Roberto Mendes', 
    client_phone: '(84) 99222-3333', 
    service_id: '3', 
    service_name: 'Combo Cabelo + Barba Premium', 
    barber_id: 'b2', 
    barber_name: 'Gabriel Santos', 
    start_time: '14:00', 
    price: 80.00, 
    status: 'scheduled',
  },
  { 
    id: 'a3', 
    client_name: 'Eduardo Lima', 
    client_phone: '(84) 99333-4444', 
    service_id: '2', 
    service_name: 'Barba Completa com Toalha Quente', 
    barber_id: 'b1', 
    barber_name: 'Lucas Silva (Mestre)', 
    start_time: '15:30', 
    price: 40.00, 
    status: 'scheduled',
  },
];
