// Cloudflare Worker Backend for AgendAI (Static Assets + authenticated KV API)
export interface Env {
  AGENDAI_KV?: {
    get: (key: string) => Promise<string | null>;
    put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
    delete?: (key: string) => Promise<void>;
  };
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
}

type StoredPayload = Record<string, any>;
type CredentialRecord = {
  salt: string;
  hash: string;
  iterations: number;
};

type SessionRecord = {
  email: string;
  expires_at: number;
};

// Fallback apenas para desenvolvimento quando o binding AGENDAI_KV não existe.
// Em produção, configure um namespace KV com binding AGENDAI_KV.
const memoryDb: Record<string, string> = {};
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const PBKDF2_ITERATIONS = 100_000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const jsonResponse = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    ...corsHeaders,
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  },
});

const normalizeEmail = (value: unknown) => String(value || '').trim().toLowerCase();
const normalizeSlug = (value: unknown) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

const dbGet = async (env: Env, key: string): Promise<string | null> => {
  if (env.AGENDAI_KV) {
    try {
      return await env.AGENDAI_KV.get(key);
    } catch (error) {
      console.error('Erro no KV get:', error);
    }
  }
  return memoryDb[key] || null;
};

const dbPut = async (env: Env, key: string, value: string, expirationTtl?: number): Promise<void> => {
  if (env.AGENDAI_KV) {
    try {
      await env.AGENDAI_KV.put(key, value, expirationTtl ? { expirationTtl } : undefined);
    } catch (error) {
      console.error('Erro no KV put:', error);
      throw error;
    }
  }
  memoryDb[key] = value;
};

const dbDelete = async (env: Env, key: string): Promise<void> => {
  if (env.AGENDAI_KV?.delete) {
    try {
      await env.AGENDAI_KV.delete(key);
    } catch (error) {
      console.error('Erro no KV delete:', error);
    }
  }
  delete memoryDb[key];
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary);
};

const base64ToBytes = (value: string): Uint8Array => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const derivePasswordHash = async (password: string, saltBase64: string, iterations: number): Promise<string> => {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: base64ToBytes(saltBase64) as unknown as BufferSource,
      iterations,
    },
    keyMaterial,
    256
  );
  return bytesToBase64(new Uint8Array(bits));
};

const createCredential = async (password: string): Promise<CredentialRecord> => {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const salt = bytesToBase64(saltBytes);
  return {
    salt,
    hash: await derivePasswordHash(password, salt, PBKDF2_ITERATIONS),
    iterations: PBKDF2_ITERATIONS,
  };
};

const safeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

const verifyCredential = async (password: string, credential: CredentialRecord): Promise<boolean> => {
  const calculated = await derivePasswordHash(password, credential.salt, credential.iterations || PBKDF2_ITERATIONS);
  return safeEqual(calculated, credential.hash);
};

const stripSecretsFromOrg = (org: any, publicView = false) => {
  if (!org) return org;
  const clean = { ...org };
  delete clean.password;
  delete clean.password_hash;
  delete clean.passwordHash;
  if (publicView) delete clean.email;
  return clean;
};

const sanitizePrivatePayload = (input: StoredPayload): StoredPayload => {
  const org = stripSecretsFromOrg(input.org, false);
  const savedOrgs = Array.isArray(input.savedOrgs)
    ? input.savedOrgs.map((item: any) => stripSecretsFromOrg(item, false))
    : org ? [org] : [];
  return {
    ...input,
    org,
    savedOrgs,
  };
};

const sanitizePublicPayload = (input: StoredPayload): StoredPayload => {
  const org = stripSecretsFromOrg(input.org, true);
  const barbers = Array.isArray(input.barbers)
    ? input.barbers.map((barber: any) => ({ ...barber, phone: '', commission_rate: 0 }))
    : [];
  const appointments = Array.isArray(input.appointments)
    ? input.appointments.map((appointment: any) => ({
        ...appointment,
        client_name: 'Reservado',
        client_phone: '',
        payment_method: undefined,
      }))
    : [];

  return {
    org,
    savedOrgs: org ? [org] : [],
    services: Array.isArray(input.services) ? input.services : [],
    barbers,
    appointments,
    clients: [],
    updated_at: input.updated_at,
  };
};

const createSession = async (env: Env, email: string): Promise<string> => {
  const random = new Uint8Array(32);
  crypto.getRandomValues(random);
  const token = bytesToBase64(random).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  const record: SessionRecord = {
    email,
    expires_at: Date.now() + SESSION_TTL_SECONDS * 1000,
  };
  await dbPut(env, `session:${token}`, JSON.stringify(record), SESSION_TTL_SECONDS);
  return token;
};

const getBearerToken = (request: Request): string | null => {
  const header = request.headers.get('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
};

const getSessionEmail = async (request: Request, env: Env): Promise<string | null> => {
  const token = getBearerToken(request);
  if (!token) return null;
  const raw = await dbGet(env, `session:${token}`);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as SessionRecord;
    if (!session.email || session.expires_at <= Date.now()) {
      await dbDelete(env, `session:${token}`);
      return null;
    }
    return normalizeEmail(session.email);
  } catch {
    return null;
  }
};

const storePayload = async (env: Env, payload: StoredPayload, previousSlug?: string): Promise<StoredPayload> => {
  const cleanPayload = sanitizePrivatePayload({
    ...payload,
    updated_at: new Date().toISOString(),
  });
  const email = normalizeEmail(cleanPayload.org?.email);
  const slug = normalizeSlug(cleanPayload.org?.slug);

  if (!email || !slug) throw new Error('E-mail e slug são obrigatórios.');

  if (previousSlug && previousSlug !== slug) {
    await dbDelete(env, `slug:${previousSlug}`);
  }

  const serialized = JSON.stringify(cleanPayload);
  await dbPut(env, `user:${email}`, serialized);
  await dbPut(env, `slug:${slug}`, serialized);
  return cleanPayload;
};

const minutesFromTime = (value: string): number => {
  const [h, m] = String(value || '').split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
};

const overlapsExistingAppointment = (appointment: any, existing: any[]): boolean => {
  const date = String(appointment.date || '');
  const barberId = String(appointment.barber_id || '');
  const start = minutesFromTime(appointment.start_time);
  const duration = Math.max(5, Number(appointment.duration_minutes || 30));
  const end = start + duration;

  return existing.some((item: any) => {
    if (item.status === 'canceled') return false;
    if (String(item.date || '') !== date) return false;
    if (String(item.barber_id || '') !== barberId) return false;
    const itemStart = minutesFromTime(item.start_time);
    const itemDuration = Math.max(5, Number(item.duration_minutes || 30));
    return start < itemStart + itemDuration && itemStart < end;
  });
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname.startsWith('/api/') && !env.AGENDAI_KV) {
      return jsonResponse({ error: 'Banco seguro não configurado. Crie um Cloudflare KV e vincule-o como AGENDAI_KV.' }, 503);
    }

    // Cadastro: cria a conta apenas se e-mail e slug ainda não existirem.
    if (url.pathname === '/api/auth/register' && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const payload = body.payload || body.data || body;
        const password = String(body.password || '').trim();
        const email = normalizeEmail(payload.org?.email);
        const slug = normalizeSlug(payload.org?.slug);

        if (!email || !email.includes('@') || !slug) {
          return jsonResponse({ error: 'Informe um e-mail válido e um slug.' }, 400);
        }
        if (password.length < 6) {
          return jsonResponse({ error: 'A senha deve ter no mínimo 6 caracteres.' }, 400);
        }

        const existingEmail = await dbGet(env, `user:${email}`);
        const existingSlug = await dbGet(env, `slug:${slug}`);
        if (existingEmail) return jsonResponse({ error: 'Este e-mail já possui cadastro.' }, 409);
        if (existingSlug) return jsonResponse({ error: 'Este link/slug já está em uso.' }, 409);

        const credential = await createCredential(password);
        await dbPut(env, `auth:${email}`, JSON.stringify(credential));
        const stored = await storePayload(env, payload);
        const token = await createSession(env, email);

        return jsonResponse({ success: true, token, data: stored }, 201);
      } catch (error: any) {
        return jsonResponse({ error: error?.message || 'Falha ao criar cadastro.' }, 500);
      }
    }

    // Login: a senha é validada no servidor; o frontend nunca recebe senha/hash.
    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const email = normalizeEmail(body.email);
        const password = String(body.password || '');
        if (!email || !password) return jsonResponse({ error: 'E-mail e senha são obrigatórios.' }, 400);

        const rawData = await dbGet(env, `user:${email}`);
        if (!rawData) return jsonResponse({ error: 'Cadastro não encontrado.' }, 401);

        let data = JSON.parse(rawData) as StoredPayload;
        const rawCredential = await dbGet(env, `auth:${email}`);
        let valid = false;

        if (rawCredential) {
          valid = await verifyCredential(password, JSON.parse(rawCredential) as CredentialRecord);
        } else {
          // Migração automática de cadastros antigos que guardavam a senha no objeto org.
          const legacyPassword = String(data.org?.password || '');
          if (legacyPassword && safeEqual(legacyPassword, password)) {
            valid = true;
            const credential = await createCredential(password);
            await dbPut(env, `auth:${email}`, JSON.stringify(credential));
            const previousSlug = normalizeSlug(data.org?.slug);
            data = await storePayload(env, data, previousSlug);
          }
        }

        if (!valid) return jsonResponse({ error: 'E-mail ou senha incorretos.' }, 401);

        data = sanitizePrivatePayload(data);
        const token = await createSession(env, email);
        return jsonResponse({ success: true, token, data });
      } catch (error: any) {
        return jsonResponse({ error: error?.message || 'Falha ao autenticar.' }, 500);
      }
    }

    if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
      const token = getBearerToken(request);
      if (token) await dbDelete(env, `session:${token}`);
      return jsonResponse({ success: true });
    }

    // Leitura pública por slug ou privada por e-mail.
    if (url.pathname === '/api/sync' && request.method === 'GET') {
      const email = normalizeEmail(url.searchParams.get('email'));
      const slug = normalizeSlug(url.searchParams.get('slug'));
      if (!email && !slug) return jsonResponse({ error: 'Informe email ou slug para consultar.' }, 400);

      if (email) {
        const sessionEmail = await getSessionEmail(request, env);
        if (!sessionEmail || sessionEmail !== email) {
          return jsonResponse({ error: 'Sessão inválida ou expirada.' }, 401);
        }
        const raw = await dbGet(env, `user:${email}`);
        if (!raw) return jsonResponse({ found: false }, 404);
        return jsonResponse(sanitizePrivatePayload(JSON.parse(raw)));
      }

      const raw = await dbGet(env, `slug:${slug}`);
      if (!raw) return jsonResponse({ found: false }, 404);
      return jsonResponse(sanitizePublicPayload(JSON.parse(raw)));
    }

    // Salvamento administrativo: exige sessão autenticada da mesma conta.
    if (url.pathname === '/api/sync' && request.method === 'POST') {
      try {
        const body = await request.json() as StoredPayload;
        const email = normalizeEmail(body.org?.email);
        const sessionEmail = await getSessionEmail(request, env);
        if (!sessionEmail || !email || sessionEmail !== email) {
          return jsonResponse({ error: 'Não autorizado.' }, 401);
        }

        const currentRaw = await dbGet(env, `user:${email}`);
        const previousSlug = currentRaw ? normalizeSlug(JSON.parse(currentRaw).org?.slug) : undefined;
        const stored = await storePayload(env, body, previousSlug);
        return jsonResponse({ success: true, updated_at: stored.updated_at });
      } catch (error: any) {
        return jsonResponse({ error: error?.message || 'Falha ao salvar.' }, 500);
      }
    }

    // Agendamento público: aceita novo horário, mas valida estrutura e conflito no servidor.
    if (url.pathname === '/api/appointment' && request.method === 'POST') {
      try {
        const appointment = await request.json() as any;
        const orgSlug = normalizeSlug(appointment.org_slug || appointment.org_id);
        if (!orgSlug) return jsonResponse({ error: 'Slug da barbearia é obrigatório.' }, 400);
        if (!appointment.id || !appointment.date || !appointment.start_time || !appointment.barber_id) {
          return jsonResponse({ error: 'Dados obrigatórios do agendamento não foram informados.' }, 400);
        }
        if (!String(appointment.client_name || '').trim() || !String(appointment.client_phone || '').trim()) {
          return jsonResponse({ error: 'Nome e telefone do cliente são obrigatórios.' }, 400);
        }

        const raw = await dbGet(env, `slug:${orgSlug}`);
        if (!raw) return jsonResponse({ error: 'Barbearia não encontrada.' }, 404);
        const current = JSON.parse(raw) as StoredPayload;
        const previousAppointments = Array.isArray(current.appointments) ? current.appointments : [];

        if (previousAppointments.some((item: any) => item.id === appointment.id)) {
          return jsonResponse({ success: true, duplicate: true });
        }
        if (overlapsExistingAppointment(appointment, previousAppointments)) {
          return jsonResponse({ error: 'Este horário acabou de ser reservado. Escolha outro horário.' }, 409);
        }

        const cleanAppointment = {
          ...appointment,
          org_slug: undefined,
          status: ['scheduled', 'in_progress', 'completed', 'canceled'].includes(appointment.status)
            ? appointment.status
            : 'scheduled',
          created_at: appointment.created_at || new Date().toISOString(),
        };
        current.appointments = [cleanAppointment, ...previousAppointments];
        const email = normalizeEmail(current.org?.email);
        const stored = await storePayload(env, current, orgSlug);
        if (email) await dbPut(env, `user:${email}`, JSON.stringify(stored));

        return jsonResponse({ success: true, timestamp: new Date().toISOString() }, 201);
      } catch (error: any) {
        return jsonResponse({ error: error?.message || 'Falha ao registrar agendamento.' }, 500);
      }
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response('App carregado', { headers: { 'Content-Type': 'text/plain' } });
  }
};
