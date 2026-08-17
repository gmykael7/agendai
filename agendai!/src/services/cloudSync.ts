import { Organization, Service, Barber, Appointment, Client } from '../types';

export interface CloudSyncPayload {
  org: Organization | null;
  savedOrgs: Organization[];
  services: Service[];
  barbers: Barber[];
  appointments: Appointment[];
  clients: Client[];
  updated_at?: string;
}

// Chave no localStorage para configurações de nuvem
const CLOUD_CONFIG_KEY = 'agendai_cloud_config';

export interface CloudConfig {
  autoSyncEnabled: boolean;
  cloudProvider: 'cloudflare' | 'custom_api';
  customApiUrl?: string;
  lastSyncedAt?: string;
}

export const getCloudConfig = (): CloudConfig => {
  const saved = localStorage.getItem(CLOUD_CONFIG_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {}
  }
  return {
    autoSyncEnabled: true,
    cloudProvider: 'cloudflare',
  };
};

export const saveCloudConfig = (config: Partial<CloudConfig>) => {
  const current = getCloudConfig();
  const next = { ...current, ...config };
  localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(next));
  return next;
};

// 1. Salvar dados da barbearia na nuvem (Cloudflare Functions / Cloudflare KV)
export const saveBarbershopToCloud = async (payload: CloudSyncPayload): Promise<boolean> => {
  const email = payload.org?.email?.toLowerCase().trim();
  const slug = payload.org?.slug?.toLowerCase().trim();

  if (!email && !slug) {
    return false;
  }

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      saveCloudConfig({ lastSyncedAt: new Date().toISOString() });
      return true;
    }
  } catch (err) {
    // Caso esteja rodando sem o backend Cloudflare ativo no momento, armazena no cache local
    console.debug('Cloudflare /api/sync indisponível localmente, dados salvos no navegador.', err);
  }

  return false;
};

// 2. Carregar dados da barbearia da nuvem por e-mail ou slug
export const loadBarbershopFromCloud = async (
  emailOrSlug: string
): Promise<CloudSyncPayload | null> => {
  const clean = emailOrSlug.toLowerCase().trim();
  if (!clean) return null;

  const isEmail = clean.includes('@');
  const queryParam = isEmail ? `email=${encodeURIComponent(clean)}` : `slug=${encodeURIComponent(clean)}`;

  try {
    const res = await fetch(`/api/sync?${queryParam}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

    if (res.ok) {
      const data = await res.json() as any;
      if (data && data.org) {
        return {
          org: data.org,
          savedOrgs: Array.isArray(data.savedOrgs) ? data.savedOrgs : [data.org],
          services: Array.isArray(data.services) ? data.services : [],
          barbers: Array.isArray(data.barbers) ? data.barbers : [],
          appointments: Array.isArray(data.appointments) ? data.appointments : [],
          clients: Array.isArray(data.clients) ? data.clients : [],
          updated_at: data.updated_at,
        };
      }
    }
  } catch (err) {
    console.debug('Falha ao consultar /api/sync na nuvem:', err);
  }

  return null;
};

// 3. Enviar novo agendamento do cliente direto para a nuvem
export const pushAppointmentToCloud = async (
  appointment: Appointment,
  orgSlug?: string
): Promise<boolean> => {
  try {
    const res = await fetch('/api/appointment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...appointment,
        org_slug: orgSlug || appointment.org_id,
      }),
    });

    return res.ok;
  } catch (err) {
    console.debug('Erro ao enviar agendamento para Cloudflare:', err);
    return false;
  }
};
