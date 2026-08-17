// Cloudflare Pages / Workers Serverless Function: /api/sync
export interface Env {
  AGENDAI_KV?: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const email = url.searchParams.get('email')?.toLowerCase().trim();
  const slug = url.searchParams.get('slug')?.toLowerCase().trim();

  if (!email && !slug) {
    return new Response(JSON.stringify({ error: 'Informe email ou slug para consultar' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }

  try {
    if (context.env.AGENDAI_KV) {
      let data: string | null = null;
      if (email) {
        data = await context.env.AGENDAI_KV.get(`user:${email}`);
      }
      if (!data && slug) {
        data = await context.env.AGENDAI_KV.get(`slug:${slug}`);
      }

      if (data) {
        return new Response(data, {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
          }
        });
      }
    }

    return new Response(JSON.stringify({ found: false }), {
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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as any;
    const email = (body.org?.email || body.email || '').toLowerCase().trim();
    const slug = (body.org?.slug || body.slug || '').toLowerCase().trim();

    if (!email && !slug) {
      return new Response(JSON.stringify({ error: 'Email ou slug obrigatório para salvar na nuvem' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    const payloadWithMeta = {
      ...body,
      updated_at: new Date().toISOString(),
    };
    const payloadStr = JSON.stringify(payloadWithMeta);

    if (context.env.AGENDAI_KV) {
      if (email) {
        await context.env.AGENDAI_KV.put(`user:${email}`, payloadStr);
      }
      if (slug) {
        await context.env.AGENDAI_KV.put(`slug:${slug}`, payloadStr);
      }
    }

    return new Response(JSON.stringify({ success: true, updated_at: payloadWithMeta.updated_at }), {
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
};
