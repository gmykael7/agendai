export interface Env {
  AGENDAI_KV: KVNamespace;
}

export type CredentialRecord = {
  salt: string;
  hash: string;
  iterations: number;
};

export type SessionRecord = {
  email: string;
  expires_at: number;
};

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const PBKDF2_ITERATIONS = 100_000;

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const jsonResponse = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    ...corsHeaders,
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  },
});

export const normalizeEmail = (value: unknown) => String(value || '').trim().toLowerCase();
export const normalizeSlug = (value: unknown) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

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

const derivePasswordHash = async (password: string, salt: string, iterations: number) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    hash: 'SHA-256',
    salt: base64ToBytes(salt) as unknown as BufferSource,
    iterations,
  }, key, 256);
  return bytesToBase64(new Uint8Array(bits));
};

export const createCredential = async (password: string): Promise<CredentialRecord> => {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const salt = bytesToBase64(saltBytes);
  return {
    salt,
    hash: await derivePasswordHash(password, salt, PBKDF2_ITERATIONS),
    iterations: PBKDF2_ITERATIONS,
  };
};

const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

export const verifyCredential = async (password: string, credential: CredentialRecord) => {
  const calculated = await derivePasswordHash(password, credential.salt, credential.iterations || PBKDF2_ITERATIONS);
  return safeEqual(calculated, credential.hash);
};

export const stripSecrets = (org: any, publicView = false) => {
  if (!org) return org;
  const clean = { ...org };
  delete clean.password;
  delete clean.password_hash;
  delete clean.passwordHash;
  if (publicView) delete clean.email;
  return clean;
};

export const sanitizePrivate = (data: any) => {
  const org = stripSecrets(data.org, false);
  return {
    ...data,
    org,
    savedOrgs: Array.isArray(data.savedOrgs) ? data.savedOrgs.map((o: any) => stripSecrets(o, false)) : org ? [org] : [],
  };
};

export const sanitizePublic = (data: any) => {
  const org = stripSecrets(data.org, true);
  return {
    org,
    savedOrgs: org ? [org] : [],
    services: Array.isArray(data.services) ? data.services : [],
    barbers: Array.isArray(data.barbers) ? data.barbers.map((b: any) => ({ ...b, phone: '', commission_rate: 0 })) : [],
    appointments: Array.isArray(data.appointments)
      ? data.appointments.map((a: any) => ({ ...a, client_name: 'Reservado', client_phone: '', payment_method: undefined }))
      : [],
    clients: [],
    updated_at: data.updated_at,
  };
};

export const getBearerToken = (request: Request) => {
  const header = request.headers.get('Authorization') || '';
  return header.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || '';
};

export const getSessionEmail = async (request: Request, env: Env) => {
  const token = getBearerToken(request);
  if (!token) return null;
  const raw = await env.AGENDAI_KV.get(`session:${token}`);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as SessionRecord;
    if (!session.email || session.expires_at <= Date.now()) {
      await env.AGENDAI_KV.delete(`session:${token}`);
      return null;
    }
    return normalizeEmail(session.email);
  } catch {
    return null;
  }
};

export const createSession = async (env: Env, email: string) => {
  const random = new Uint8Array(32);
  crypto.getRandomValues(random);
  const token = bytesToBase64(random).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  const session: SessionRecord = { email, expires_at: Date.now() + SESSION_TTL_SECONDS * 1000 };
  await env.AGENDAI_KV.put(`session:${token}`, JSON.stringify(session), { expirationTtl: SESSION_TTL_SECONDS });
  return token;
};

export const storePayload = async (env: Env, data: any, previousSlug?: string) => {
  const clean = sanitizePrivate({ ...data, updated_at: new Date().toISOString() });
  const email = normalizeEmail(clean.org?.email);
  const slug = normalizeSlug(clean.org?.slug);
  if (!email || !slug) throw new Error('E-mail e slug são obrigatórios.');
  if (previousSlug && previousSlug !== slug) await env.AGENDAI_KV.delete(`slug:${previousSlug}`);
  const serialized = JSON.stringify(clean);
  await env.AGENDAI_KV.put(`user:${email}`, serialized);
  await env.AGENDAI_KV.put(`slug:${slug}`, serialized);
  return clean;
};

export const minutesFromTime = (value: string) => {
  const [h, m] = String(value || '').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const overlaps = (appointment: any, existing: any[]) => {
  const start = minutesFromTime(appointment.start_time);
  const end = start + Math.max(5, Number(appointment.duration_minutes || 30));
  return existing.some((item: any) => {
    if (item.status === 'canceled') return false;
    if (item.date !== appointment.date || item.barber_id !== appointment.barber_id) return false;
    const itemStart = minutesFromTime(item.start_time);
    const itemEnd = itemStart + Math.max(5, Number(item.duration_minutes || 30));
    return start < itemEnd && itemStart < end;
  });
};
