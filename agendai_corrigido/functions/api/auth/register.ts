import { Env, createCredential, createSession, jsonResponse, normalizeEmail, normalizeSlug, storePayload } from '../../_shared';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!context.env.AGENDAI_KV) return jsonResponse({ error: 'Binding AGENDAI_KV não configurado.' }, 503);
  try {
    const body = await context.request.json() as any;
    const payload = body.payload || body.data || body;
    const password = String(body.password || '').trim();
    const email = normalizeEmail(payload.org?.email);
    const slug = normalizeSlug(payload.org?.slug);

    if (!email || !email.includes('@') || !slug || password.length < 6) {
      return jsonResponse({ error: 'E-mail, slug e senha de no mínimo 6 caracteres são obrigatórios.' }, 400);
    }
    if (await context.env.AGENDAI_KV.get(`user:${email}`)) return jsonResponse({ error: 'Este e-mail já possui cadastro.' }, 409);
    if (await context.env.AGENDAI_KV.get(`slug:${slug}`)) return jsonResponse({ error: 'Este link/slug já está em uso.' }, 409);

    await context.env.AGENDAI_KV.put(`auth:${email}`, JSON.stringify(await createCredential(password)));
    const data = await storePayload(context.env, payload);
    const token = await createSession(context.env, email);
    return jsonResponse({ success: true, token, data }, 201);
  } catch (error: any) {
    return jsonResponse({ error: error?.message || 'Falha ao criar cadastro.' }, 500);
  }
};

export const onRequestOptions: PagesFunction = async () => jsonResponse({}, 204);
