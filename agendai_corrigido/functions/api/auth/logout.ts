import { Env, getBearerToken, jsonResponse } from '../../_shared';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const token = getBearerToken(context.request);
  if (token && context.env.AGENDAI_KV) await context.env.AGENDAI_KV.delete(`session:${token}`);
  return jsonResponse({ success: true });
};

export const onRequestOptions: PagesFunction = async () => jsonResponse({}, 204);
