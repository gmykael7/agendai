import { Env, getSessionEmail, jsonResponse, normalizeEmail, normalizeSlug, sanitizePrivate, sanitizePublic, storePayload } from '../_shared';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  if (!context.env.AGENDAI_KV) return jsonResponse({ error: 'Binding AGENDAI_KV não configurado.' }, 503);
  const url = new URL(context.request.url);
  const email = normalizeEmail(url.searchParams.get('email'));
  const slug = normalizeSlug(url.searchParams.get('slug'));

  if (email) {
    const sessionEmail = await getSessionEmail(context.request, context.env);
    if (sessionEmail !== email) return jsonResponse({ error: 'Sessão inválida ou expirada.' }, 401);
    const raw = await context.env.AGENDAI_KV.get(`user:${email}`);
    if (!raw) return jsonResponse({ found: false }, 404);
    return jsonResponse(sanitizePrivate(JSON.parse(raw)));
  }

  if (slug) {
    const raw = await context.env.AGENDAI_KV.get(`slug:${slug}`);
    if (!raw) return jsonResponse({ found: false }, 404);
    return jsonResponse(sanitizePublic(JSON.parse(raw)));
  }

  return jsonResponse({ error: 'Informe email ou slug.' }, 400);
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!context.env.AGENDAI_KV) return jsonResponse({ error: 'Binding AGENDAI_KV não configurado.' }, 503);
  try {
    const body = await context.request.json() as any;
    const email = normalizeEmail(body.org?.email);
    const sessionEmail = await getSessionEmail(context.request, context.env);
    if (!email || sessionEmail !== email) return jsonResponse({ error: 'Não autorizado.' }, 401);

    const currentRaw = await context.env.AGENDAI_KV.get(`user:${email}`);
    const previousSlug = currentRaw ? normalizeSlug(JSON.parse(currentRaw).org?.slug) : undefined;
    const stored = await storePayload(context.env, body, previousSlug);
    return jsonResponse({ success: true, updated_at: stored.updated_at });
  } catch (error: any) {
    return jsonResponse({ error: error?.message || 'Falha ao salvar.' }, 500);
  }
};

export const onRequestOptions: PagesFunction = async () => jsonResponse({}, 204);
