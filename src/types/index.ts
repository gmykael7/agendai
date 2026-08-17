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
  status: 'scheduled' | 'completed' | 'canceled';
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  phone: string;
  primary_color: string;
}

export type TabType = 'dashboard' | 'services' | 'booking' | 'onboarding';
