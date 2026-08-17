import { Env, CredentialRecord, createCredential, createSession, jsonResponse, normalizeEmail, normalizeSlug, sanitizePrivate, storePayload, verifyCredential } from '../../_shared';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!context.env.AGENDAI_KV) return jsonResponse({ error: 'Binding AGENDAI_KV não configurado.' }, 503);
  try {
    const body = await context.request.json() as any;
    const email = normalizeEmail(body.email);
    const password = String(body.password || '');
    const raw = await context.env.AGENDAI_KV.get(`user:${email}`);
    if (!raw) return jsonResponse({ error: 'Cadastro não encontrado.' }, 401);

    let data = JSON.parse(raw);
    const rawCredential = await context.env.AGENDAI_KV.get(`auth:${email}`);
    let valid = false;
    if (rawCredential) {
      valid = await verifyCredential(password, JSON.parse(rawCredential) as CredentialRecord);
    } else if (data.org?.password && data.org.password === password) {
      valid = true;
      await context.env.AGENDAI_KV.put(`auth:${email}`, JSON.stringify(await createCredential(password)));
      data = await storePayload(context.env, data, normalizeSlug(data.org?.slug));
    }

    if (!valid) return jsonResponse({ error: 'E-mail ou senha incorretos.' }, 401);
    const token = await createSession(context.env, email);
    return jsonResponse({ success: true, token, data: sanitizePrivate(data) });
  } catch (error: any) {
    return jsonResponse({ error: error?.message || 'Falha ao autenticar.' }, 500);
  }
};

export const onRequestOptions: PagesFunction = async () => jsonResponse({}, 204);
