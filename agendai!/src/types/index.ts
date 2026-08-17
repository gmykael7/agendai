export interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  category: string;
  active: boolean;
}

export interface Barber {
  id: string;
  full_name: string;
  role: string;
  commission_rate: number;
  avatar_url?: string;
  phone: string;
  active?: boolean;
}

export interface Appointment {
  id: string;
  client_name: string;
  client_phone: string;
  service_id: string;
  service_name: string;
  barber_id: string;
  barber_name: string;
  start_time: string;
  price: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'canceled';
  payment_method?: 'pix' | 'credit' | 'debit' | 'cash';
  date?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  total_visits: number;
  total_spent: number;
  last_visit?: string;
  notes?: string;
}

export interface CashTransaction {
  id: string;
  type: 'income' | 'expense' | 'commission';
  amount: number;
  description: string;
  payment_method: 'pix' | 'credit' | 'debit' | 'cash';
  date: string;
  time: string;
  appointment_id?: string;
  barber_id?: string;
}

export interface Organization {
  id: string;
  name: string;
  owner_name?: string;
  email?: string;
  password?: string;
  slug: string;
  phone: string;
  address?: string;
  primary_color: string;
  open_hour?: string;
  close_hour?: string;
}

export type TabType = 
  | 'dashboard' 
  | 'atendimentos' 
  | 'agenda' 
  | 'caixa' 
  | 'clientes' 
  | 'ajustes' 
  | 'booking' 
  | 'auth';
