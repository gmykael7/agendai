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

export interface AuthResult {
  token: string;
  data: CloudSyncPayload;
}

const AUTH_TOKEN_KEY = 'agendai_auth_token';

export const getAuthToken = (): string => localStorage.getItem(AUTH_TOKEN_KEY) || '';

export const setAuthToken = (token: string) => {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAuthToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

const normalizePayload = (data: any): CloudSyncPayload => ({
  org: data?.org || null,
  savedOrgs: Array.isArray(data?.savedOrgs) ? data.savedOrgs : data?.org ? [data.org] : [],
  services: Array.isArray(data?.services) ? data.services : [],
  barbers: Array.isArray(data?.barbers) ? data.barbers : [],
  appointments: Array.isArray(data?.appointments) ? data.appointments : [],
  clients: Array.isArray(data?.clients) ? data.clients : [],
  updated_at: data?.updated_at,
});

const parseError = async (response: Response, fallback: string): Promise<Error> => {
  try {
    const data = await response.json() as any;
    return new Error(data?.error || fallback);
  } catch {
    return new Error(fallback);
  }
};

export const loginBarbershop = async (email: string, password: string): Promise<AuthResult> => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });

  if (!response.ok) throw await parseError(response, 'Não foi possível entrar.');
  const result = await response.json() as any;
  if (!result?.token || !result?.data?.org) throw new Error('Resposta de autenticação inválida.');

  setAuthToken(result.token);
  return { token: result.token, data: normalizePayload(result.data) };
};

export const registerBarbershop = async (
  payload: CloudSyncPayload,
  password: string
): Promise<AuthResult> => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload, password }),
  });

  if (!response.ok) throw await parseError(response, 'Não foi possível concluir o cadastro.');
  const result = await response.json() as any;
  if (!result?.token || !result?.data?.org) throw new Error('Resposta de cadastro inválida.');

  setAuthToken(result.token);
  return { token: result.token, data: normalizePayload(result.data) };
};

export const logoutBarbershop = async (): Promise<void> => {
  const token = getAuthToken();
  clearAuthToken();
  if (!token) return;
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // Logout local continua válido mesmo se a rede estiver indisponível.
  }
};

// Salva dados administrativos. O servidor exige uma sessão autenticada.
export const saveBarbershopToCloud = async (payload: CloudSyncPayload): Promise<boolean> => {
  const token = getAuthToken();
  if (!token || !payload.org?.email) return false;

  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 401) clearAuthToken();
    return response.ok;
  } catch (error) {
    console.debug('Falha ao salvar na nuvem:', error);
    return false;
  }
};

// E-mail = leitura privada (exige token). Slug = leitura pública sanitizada.
export const loadBarbershopFromCloud = async (
  emailOrSlug: string
): Promise<CloudSyncPayload | null> => {
  const clean = emailOrSlug.toLowerCase().trim();
  if (!clean) return null;

  const isEmail = clean.includes('@');
  const queryParam = isEmail
    ? `email=${encodeURIComponent(clean)}`
    : `slug=${encodeURIComponent(clean)}`;
  const token = getAuthToken();

  if (isEmail && !token) return null;

  try {
    const response = await fetch(`/api/sync?${queryParam}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...(isEmail && token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (response.status === 401) {
      clearAuthToken();
      return null;
    }
    if (!response.ok) return null;

    const data = await response.json() as any;
    if (!data?.org) return null;
    return normalizePayload(data);
  } catch (error) {
    console.debug('Falha ao consultar nuvem:', error);
    return null;
  }
};

// Novo agendamento do cliente. A rota é pública, mas o servidor valida conflito de horário.
export const pushAppointmentToCloud = async (
  appointment: Appointment,
  orgSlug?: string
): Promise<boolean> => {
  const targetSlug = (orgSlug || appointment.org_id || '').toLowerCase().trim();
  if (!targetSlug) return false;

  try {
    const response = await fetch('/api/appointment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...appointment,
        org_slug: targetSlug,
      }),
    });
    return response.ok;
  } catch (error) {
    console.debug('Erro ao enviar agendamento:', error);
    return false;
  }
};
