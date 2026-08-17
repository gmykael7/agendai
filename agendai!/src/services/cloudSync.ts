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

// Global Cloud Sync Backup Endpoint (CORS-friendly public cloud store)
const GLOBAL_CLOUD_URL = 'https://api.restful-api.dev/objects';

export interface CloudConfig {
  autoSyncEnabled: boolean;
  cloudProvider: 'cloudflare' | 'global_cloud';
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

// Gera chave única normalizada para o e-mail ou slug
const getSanitizedKey = (identifier: string): string => {
  return identifier
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_');
};

// 1. SALVAR DADOS DA BARBEARIA NA NUVEM
export const saveBarbershopToCloud = async (payload: CloudSyncPayload): Promise<boolean> => {
  const email = payload.org?.email?.toLowerCase().trim();
  const slug = payload.org?.slug?.toLowerCase().trim();

  if (!email && !slug) {
    return false;
  }

  const payloadWithMeta: CloudSyncPayload = {
    ...payload,
    updated_at: new Date().toISOString(),
  };

  let savedLocally = false;
  let savedGlobally = false;

  // A. Tentativa 1: Endpoint /api/sync (Vite Server Middleware ou Cloudflare Functions)
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payloadWithMeta),
    });

    if (res.ok) {
      savedLocally = true;
    }
  } catch (err) {
    console.debug('Endpoint /api/sync indisponível no momento:', err);
  }

  // B. Tentativa 2: Backup em Nuvem Global via Storage REST (Acessível de qualquer 4G/5G/Wi-Fi)
  try {
    const key = `agendai_app_${getSanitizedKey(email || slug || 'default')}`;
    const remotePayload = {
      name: key,
      data: payloadWithMeta,
    };

    // Armazena ID do objeto remoto salvo no localStorage para updates
    const existingObjectId = localStorage.getItem(`agendai_cloud_id_${key}`);

    if (existingObjectId) {
      const updateRes = await fetch(`${GLOBAL_CLOUD_URL}/${existingObjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(remotePayload),
      });
      if (updateRes.ok) savedGlobally = true;
    } else {
      const createRes = await fetch(GLOBAL_CLOUD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(remotePayload),
      });
      if (createRes.ok) {
        const createdObj = await createRes.json() as any;
        if (createdObj && createdObj.id) {
          localStorage.setItem(`agendai_cloud_id_${key}`, createdObj.id);
          savedGlobally = true;
        }
      }
    }
  } catch (err) {
    console.debug('Falha no backup em nuvem global:', err);
  }

  if (savedLocally || savedGlobally) {
    saveCloudConfig({ lastSyncedAt: payloadWithMeta.updated_at });
    return true;
  }

  return false;
};

// 2. CARREGAR DADOS DA BARBEARIA DA NUVEM POR E-MAIL OU SLUG
export const loadBarbershopFromCloud = async (
  emailOrSlug: string
): Promise<CloudSyncPayload | null> => {
  const clean = emailOrSlug.toLowerCase().trim();
  if (!clean) return null;

  const isEmail = clean.includes('@');
  const queryParam = isEmail ? `email=${encodeURIComponent(clean)}` : `slug=${encodeURIComponent(clean)}`;

  let localCandidate: CloudSyncPayload | null = null;
  let globalCandidate: CloudSyncPayload | null = null;

  // A. Tentativa 1: Endpoint /api/sync
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
        localCandidate = {
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
    console.debug('Falha ao consultar /api/sync:', err);
  }

  // B. Tentativa 2: Consulta à Nuvem Global por ID salvo ou chave
  try {
    const key = `agendai_app_${getSanitizedKey(clean)}`;
    const savedObjectId = localStorage.getItem(`agendai_cloud_id_${key}`);

    if (savedObjectId) {
      const remoteRes = await fetch(`${GLOBAL_CLOUD_URL}/${savedObjectId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (remoteRes.ok) {
        const remoteData = await remoteRes.json() as any;
        if (remoteData && remoteData.data && remoteData.data.org) {
          globalCandidate = remoteData.data;
        }
      }
    }
  } catch (err) {
    console.debug('Falha ao consultar nuvem global:', err);
  }

  // Retorna a versão mais recente entre local e global
  if (localCandidate && globalCandidate) {
    const localTime = new Date(localCandidate.updated_at || 0).getTime();
    const globalTime = new Date(globalCandidate.updated_at || 0).getTime();
    return globalTime > localTime ? globalCandidate : localCandidate;
  }

  return localCandidate || globalCandidate || null;
};

// 3. ENVIAR NOVO AGENDAMENTO DO CLIENTE DIRETO PARA A NUVEM
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
    console.debug('Erro ao enviar agendamento para /api/appointment:', err);
    return false;
  }
};
