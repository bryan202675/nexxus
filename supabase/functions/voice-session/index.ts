import { getCaller, HttpError, withHandler } from '../_shared/nexxus.ts';

const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || '';
const liveModel = Deno.env.get('GEMINI_LIVE_MODEL') || 'gemini-3.1-flash-live-preview';

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!geminiApiKey) throw new HttpError(503, 'La sesión de voz no está configurada.');

  const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const newSessionExpireTime = new Date(Date.now() + 60 * 1000).toISOString();
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/auth_tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiApiKey },
    body: JSON.stringify({
      uses: 1,
      expireTime,
      newSessionExpireTime,
      liveConnectConstraints: {
        model: `models/${liveModel}`,
        config: {
          responseModalities: ['AUDIO'],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          sessionResumption: {},
          systemInstruction: {
            parts: [{ text: `Eres Nexxus, un asistente empresarial claro y amable. Responde en español. Usuario: ${caller.nombre}. Rol: ${caller.rol}. No ejecutes acciones sensibles sin confirmación explícita.` }],
          },
        },
      },
    }),
  });
  if (!response.ok) {
    console.error('Gemini auth token error', await response.text().catch(() => ''));
    throw new HttpError(502, 'No se pudo abrir la sesión de voz.');
  }
  const payload = await response.json() as { name?: string; expireTime?: string };
  if (!payload.name) throw new HttpError(502, 'Gemini no devolvió un token de voz.');
  return {
    token: payload.name,
    expireTime: payload.expireTime || expireTime,
    model: liveModel,
    websocketUrl: 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained',
    context: { usuarioId: caller.id, empresaId: caller.empresa_id, rol: caller.rol },
  };
}));
