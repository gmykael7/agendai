import { Organization, Service, Barber, Appointment } from '../types';

export const INITIAL_ORG: Organization = {
  id: 'org-1',
  name: 'Barbearia Vanguarda',
  slug: 'barbearia-vanguarda',
  phone: '(11) 99999-8888',
  primary_color: '#d97706',
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
    phone: '(11) 98888-7777', 
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250' 
  },
  { 
    id: 'b2', 
    full_name: 'Gabriel Santos', 
    role: 'Especialista em Barba', 
    commission_rate: 45, 
    phone: '(11) 97777-6666', 
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250' 
  },
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  { 
    id: 'a1', 
    client_name: 'Carlos Oliveira', 
    client_phone: '11911112222', 
    service_id: '1', 
    service_name: 'Corte Cabelo Executivo', 
    barber_id: 'b1', 
    barber_name: 'Lucas Silva (Mestre)', 
    start_time: '10:00', 
    price: 50.00, 
    status: 'completed' 
  },
  { 
    id: 'a2', 
    client_name: 'Roberto Mendes', 
    client_phone: '11922223333', 
    service_id: '3', 
    service_name: 'Combo Cabelo + Barba Premium', 
    barber_id: 'b2', 
    barber_name: 'Gabriel Santos', 
    start_time: '11:00', 
    price: 80.00, 
    status: 'scheduled' 
  },
  { 
    id: 'a3', 
    client_name: 'Eduardo Lima', 
    client_phone: '11933334444', 
    service_id: '2', 
    service_name: 'Barba Completa com Toalha Quente', 
    barber_id: 'b1', 
    barber_name: 'Lucas Silva (Mestre)', 
    start_time: '14:30', 
    price: 40.00, 
    status: 'scheduled' 
  },
];
