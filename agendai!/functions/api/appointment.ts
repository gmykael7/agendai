// Cloudflare Pages / Workers Serverless Function: /api/appointment
export interface Env {
  AGENDAI_KV?: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const appointment = await context.request.json() as any;
    const orgIdOrSlug = (appointment.org_slug || appointment.org_id || '').toLowerCase().trim();

    if (!orgIdOrSlug) {
      return new Response(JSON.stringify({ error: 'org_id ou slug obrigatório' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    if (context.env.AGENDAI_KV) {
      const key = `slug:${orgIdOrSlug}`;
      const raw = await context.env.AGENDAI_KV.get(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const prevAppointments = parsed.appointments || [];
        const exists = prevAppointments.some((a: any) => a.id === appointment.id);
        if (!exists) {
          parsed.appointments = [appointment, ...prevAppointments];
          parsed.updated_at = new Date().toISOString();

          // Salva por slug e por email
          await context.env.AGENDAI_KV.put(key, JSON.stringify(parsed));
          if (parsed.org?.email) {
            await context.env.AGENDAI_KV.put(`user:${parsed.org.email.toLowerCase()}`, JSON.stringify(parsed));
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, timestamp: new Date().toISOString() }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
};
