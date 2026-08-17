import { Env, jsonResponse, normalizeEmail, normalizeSlug, overlaps, storePayload } from '../_shared';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!context.env.AGENDAI_KV) return jsonResponse({ error: 'Binding AGENDAI_KV não configurado.' }, 503);
  try {
    const appointment = await context.request.json() as any;
    const slug = normalizeSlug(appointment.org_slug || appointment.org_id);
    if (!slug || !appointment.id || !appointment.date || !appointment.start_time || !appointment.barber_id) {
      return jsonResponse({ error: 'Dados obrigatórios do agendamento não foram informados.' }, 400);
    }

    const raw = await context.env.AGENDAI_KV.get(`slug:${slug}`);
    if (!raw) return jsonResponse({ error: 'Barbearia não encontrada.' }, 404);
    const current = JSON.parse(raw);
    const existing = Array.isArray(current.appointments) ? current.appointments : [];

    if (existing.some((a: any) => a.id === appointment.id)) return jsonResponse({ success: true, duplicate: true });
    if (overlaps(appointment, existing)) return jsonResponse({ error: 'Este horário acabou de ser reservado. Escolha outro horário.' }, 409);

    current.appointments = [{ ...appointment, org_slug: undefined, status: appointment.status || 'scheduled' }, ...existing];
    const stored = await storePayload(context.env, current, slug);
    const email = normalizeEmail(stored.org?.email);
    if (email) await context.env.AGENDAI_KV.put(`user:${email}`, JSON.stringify(stored));
    return jsonResponse({ success: true }, 201);
  } catch (error: any) {
    return jsonResponse({ error: error?.message || 'Falha ao registrar agendamento.' }, 500);
  }
};

export const onRequestOptions: PagesFunction = async () => jsonResponse({}, 204);
