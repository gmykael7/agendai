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

// Gera chave única normalizada para o e-mail ou slug
export const getSanitizedKey = (identifier: string): string => {
  if (!identifier) return 'default';
  return identifier
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_');
};

// Endpoints da Nuvem Global Pública (CORS aberto, persistência permanente em nuvem)
const GLOBAL_KV_URL_1 = 'https://kv.val.run';

// 1. SALVAR DADOS DA BARBEARIA NA NUVEM (SALVA NO LOCAL E NA NUVEM GLOBAL)
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

  const payloadString = JSON.stringify(payloadWithMeta);

  let savedSuccess = false;

  // A. Servidor Local / Cloudflare Worker (/api/sync)
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payloadString,
    });
    if (res.ok) {
      savedSuccess = true;
    }
  } catch (err) {
    console.debug('Endpoint /api/sync local offline:', err);
  }

  // B. Nuvem Global 1 (kv.val.run) - Salva por e-mail e por slug
  try {
    if (email) {
      const emailKey = `agendai_${getSanitizedKey(email)}`;
      await fetch(`${GLOBAL_KV_URL_1}/${emailKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payloadString,
      });
      savedSuccess = true;
    }

    if (slug) {
      const slugKey = `agendai_slug_${getSanitizedKey(slug)}`;
      await fetch(`${GLOBAL_KV_URL_1}/${slugKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payloadString,
      });
      savedSuccess = true;
    }
  } catch (err) {
    console.debug('Falha ao salvar no kv.val.run:', err);
  }

  return savedSuccess;
};

// 2. CARREGAR DADOS DA BARBEARIA DA NUVEM POR E-MAIL OU SLUG
export const loadBarbershopFromCloud = async (
  emailOrSlug: string
): Promise<CloudSyncPayload | null> => {
  const clean = emailOrSlug.toLowerCase().trim();
  if (!clean) return null;

  const isEmail = clean.includes('@');
  const queryParam = isEmail ? `email=${encodeURIComponent(clean)}` : `slug=${encodeURIComponent(clean)}`;
  const key = isEmail ? `agendai_${getSanitizedKey(clean)}` : `agendai_slug_${getSanitizedKey(clean)}`;

  // A. Tentativa 1: Endpoint /api/sync (Vite Local ou Cloudflare Pages Function)
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
    console.debug('Consulta /api/sync local não respondeu:', err);
  }

  // B. Tentativa 2: Nuvem Global (kv.val.run)
  try {
    const res = await fetch(`${GLOBAL_KV_URL_1}/${key}`, {
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
    console.debug('Falha ao consultar kv.val.run:', err);
  }

  // C. Tentativa 3: Se procurou por slug e falhou, tenta procurar por email sanitizado ou vice-versa
  if (!isEmail) {
    try {
      const res = await fetch(`${GLOBAL_KV_URL_1}/agendai_${getSanitizedKey(clean)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json() as any;
        if (data && data.org) return data;
      }
    } catch {}
  }

  return null;
};

// 3. ENVIAR NOVO AGENDAMENTO DO CLIENTE DIRETO PARA A NUVEM
export const pushAppointmentToCloud = async (
  appointment: Appointment,
  orgSlug?: string
): Promise<boolean> => {
  const targetSlug = (orgSlug || appointment.org_id || '').toLowerCase().trim();

  // A. Salva via /api/appointment
  try {
    await fetch('/api/appointment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...appointment,
        org_slug: targetSlug,
      }),
    });
  } catch (err) {
    console.debug('Erro ao enviar via /api/appointment:', err);
  }

  // B. Atualiza a nuvem global diretamente com o novo agendamento
  if (targetSlug) {
    try {
      const currentData = await loadBarbershopFromCloud(targetSlug);
      if (currentData && currentData.org) {
        const prevAppointments = currentData.appointments || [];
        if (!prevAppointments.some(a => a.id === appointment.id)) {
          const updatedAppointments = [appointment, ...prevAppointments];
          await saveBarbershopToCloud({
            ...currentData,
            appointments: updatedAppointments,
          });
          return true;
        }
      }
    } catch (err) {
      console.debug('Erro ao persistir agendamento na nuvem global:', err);
    }
  }

  return false;
};
