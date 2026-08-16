import { buildAiContext, getCaller, HttpError, withHandler } from '../_shared/nexxus.ts';

const apiKey = Deno.env.get('GEMINI_API_KEY') || '';
const model = Deno.env.get('GEMINI_MODEL') || 'gemini-3.6-flash';
const groqApiKey = Deno.env.get('GROQ_API_KEY') || '';
const groqModel = Deno.env.get('GROQ_STT_MODEL') || 'whisper-large-v3';

function extractText(value: unknown): string {
  const json = value as {
    output_text?: unknown;
    steps?: { type?: string; content?: { type?: string; text?: string }[] }[];
  };
  if (typeof json?.output_text === 'string') return json.output_text.trim();
  const text = (json?.steps || [])
    .filter((step) => step.type === 'model_output')
    .flatMap((step) => step.content || [])
    .filter((content) => content.type === 'text')
    .map((content) => content.text || '')
    .join('\n');
  return text.trim();
}

function decodeBase64(value: string): Uint8Array {
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  } catch {
    throw new HttpError(400, 'El audio está corrupto o tiene un formato inválido.');
  }
}

// Groq es una optimización opcional de velocidad, no una dependencia dura: si falla por
// cualquier motivo (clave inválida, red, etc.) se cae de vuelta a que Gemini transcriba el
// audio directamente (ver más abajo) en lugar de cortar toda la llamada de voz.
async function transcribeWithGroq(audio: { data: string; mimeType: string }): Promise<string | null> {
  if (!groqApiKey) return null;
  const form = new FormData();
  form.append('file', new File([decodeBase64(audio.data)], 'nexxus-voice.m4a', { type: audio.mimeType || 'audio/mp4' }));
  form.append('model', groqModel);
  form.append('language', 'es');
  let response: Response;
  try {
    response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqApiKey}` },
      body: form,
    });
  } catch (cause) {
    console.error('Groq transcription network error, cayendo a Gemini', cause);
    return null;
  }
  if (!response.ok) {
    console.error('Groq transcription error, cayendo a Gemini', await response.text().catch(() => ''));
    return null;
  }
  const result = await response.json().catch(() => null) as { text?: unknown } | null;
  return typeof result?.text === 'string' ? result.text.trim() : null;
}

function buildVoiceSystemPrompt(nombre: string, rol: string, context: unknown): string {
  return (
    `Eres Nexxus Brain, el asistente inteligente integrado dentro de Nexxus (plataforma empresarial de RRHH, ` +
    `nómina y gestión operativa). Tu objetivo es ayudar al usuario a hacer su trabajo rápido y de forma natural. ` +
    `Estás hablando por voz con ${nombre}, cuyo rol es ${rol}. ` +
    `Reglas de esta conversación de voz: ` +
    `1. Responde siempre en español, de forma profesional, natural, cercana y directa. ` +
    `2. Sé breve: 1 a 3 frases, como en una llamada real, nunca un párrafo largo. ` +
    `3. Nunca leas estructuras JSON en voz alta, ni menciones APIs, bases de datos o "herramientas internas". ` +
    `Nunca digas frases como "he consultado la base de datos". ` +
    `4. Nunca inventes información de la empresa: usa solo los datos reales que se te dan en el contexto. ` +
    `Si no tienes el dato, dilo con naturalidad. ` +
    `5. El contexto incluye "fechaActual": úsala para saber qué significa "hoy" al hablar de tareas ` +
    `(compara con el campo fecha_limite de cada tarea). Cada tarea trae "creado_por_nombre" con el nombre de ` +
    `quien la asignó, y el contexto incluye "notificaciones" recientes del usuario. ` +
    `Contexto real del usuario y su empresa en JSON: ${JSON.stringify(context).slice(0, 4000)}`
  );
}

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!apiKey) throw new HttpError(503, 'La IA de voz no está configurada.');
  const body = await req.json();
  const audio = body?.audio;
  if (typeof audio?.data !== 'string' || !audio.data || audio.data.length > 12_000_000) {
    throw new HttpError(400, 'El audio es inválido o demasiado largo.');
  }

  const transcripcion = await transcribeWithGroq(audio);
  const mimeType = typeof audio.mimeType === 'string' && audio.mimeType ? audio.mimeType : 'audio/m4a';
  const context = await buildAiContext(admin, caller);
  const systemPrompt = buildVoiceSystemPrompt(caller.nombre, caller.rol, context);

  type InteractionInput =
    | { type: 'text'; text: string }
    | { type: 'audio'; data: string; mime_type: string };
  const input: InteractionInput[] = [{
    type: 'text',
    text: transcripcion
      ? `${systemPrompt}\n\nDevuelve SOLO JSON válido con las claves transcripcion y respuesta. Transcripción del usuario: ${transcripcion}`
      : `${systemPrompt}\n\nTranscribe el audio adjunto y responde como Nexxus Brain. Devuelve SOLO JSON válido con las claves transcripcion y respuesta.`,
  }];
  if (!transcripcion) input.push({ type: 'audio', data: audio.data, mime_type: mimeType === 'audio/mp4' ? 'audio/m4a' : mimeType });

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      model,
      store: false,
      input,
      // "minimal" evita que el modelo gaste tiempo/tokens "pensando" antes de responder --
      // para una respuesta de voz corta y conversacional no hace falta razonamiento profundo,
      // y esto reduce la latencia notablemente (medido: ~200 thought tokens de más por turno).
      generation_config: { thinking_level: 'minimal' },
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: {
          type: 'object',
          properties: { transcripcion: { type: 'string' }, respuesta: { type: 'string' } },
          required: ['transcripcion', 'respuesta'],
          additionalProperties: false,
        },
      },
    }),
  });
  if (!response.ok) {
    console.error('Gemini voice-turn error', response.status, await response.text().catch(() => ''));
    throw new HttpError(502, 'No pudimos procesar el audio.');
  }
  const json = await response.json();
  const raw = extractText(json);
  let parsed: { transcripcion: string; respuesta: string } | null = null;
  try {
    const candidate = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ''));
    if (typeof candidate.transcripcion === 'string' && typeof candidate.respuesta === 'string') parsed = candidate;
  } catch { /* parsed queda null, se maneja abajo */ }
  if (!parsed) {
    console.error('Gemini voice-turn respuesta inválida', JSON.stringify(json).slice(0, 2000));
    throw new HttpError(502, 'La IA devolvió una respuesta de voz inválida.');
  }

  const usage = json?.usage_metadata || json?.usageMetadata || {};
  await admin.from('ai_usage').insert({
    empresa_id: caller.empresa_id,
    usuario_id: caller.id,
    modelo: model,
    tokens_entrada: usage.prompt_token_count ?? usage.promptTokenCount ?? 0,
    tokens_salida: usage.candidates_token_count ?? usage.candidatesTokenCount ?? 0,
  });

  return parsed;
}));
