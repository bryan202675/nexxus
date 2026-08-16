import { getCaller, HttpError, withHandler } from '../_shared/nexxus.ts';

const apiKey = Deno.env.get('GEMINI_API_KEY') || '';
const model = Deno.env.get('GEMINI_MODEL') || 'gemini-3.6-flash';
const groqApiKey = Deno.env.get('GROQ_API_KEY') || '';
const groqModel = Deno.env.get('GROQ_STT_MODEL') || 'whisper-large-v3';

function extractText(value: unknown): string {
  const text = typeof value === 'object' && value ? (value as { output_text?: unknown }).output_text : '';
  return typeof text === 'string' ? text.trim() : '';
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
  } catch {
    throw new HttpError(502, 'No pudimos conectar con el servicio de transcripción.');
  }
  if (!response.ok) {
    console.error('Groq transcription error', await response.text().catch(() => ''));
    throw new HttpError(502, 'No pudimos transcribir tu mensaje de voz.');
  }
  const result = await response.json().catch(() => null) as { text?: unknown } | null;
  return typeof result?.text === 'string' ? result.text.trim() : null;
}

Deno.serve(withHandler(async (req, admin) => {
  await getCaller(req, admin);
  if (!apiKey) throw new HttpError(503, 'La IA de voz no está configurada.');
  const body = await req.json(); const audio = body?.audio;
  if (typeof audio?.data !== 'string' || !audio.data || audio.data.length > 12_000_000) throw new HttpError(400, 'El audio es inválido o demasiado largo.');
  const transcripcion = await transcribeWithGroq(audio);
  const mimeType = typeof audio.mimeType === 'string' && audio.mimeType ? audio.mimeType : 'audio/m4a';
  type InteractionInput =
    | { type: 'text'; text: string }
    | { type: 'audio'; data: string; mime_type: string };
  const input: InteractionInput[] = [{ type: 'text', text: transcripcion
    ? `Responde como Nexxus en español, conciso. Devuelve SOLO JSON válido con las claves transcripcion y respuesta. Transcripción del usuario: ${transcripcion}`
    : 'Transcribe el audio y responde como Nexxus, en español, conciso. Devuelve SOLO JSON válido con las claves transcripcion y respuesta.' }];
  if (!transcripcion) input.push({ type: 'audio', data: audio.data, mime_type: mimeType === 'audio/mp4' ? 'audio/m4a' : mimeType });
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, body: JSON.stringify({ model, store: false, input, response_format: { type: 'text', mime_type: 'application/json', schema: { type: 'object', properties: { transcripcion: { type: 'string' }, respuesta: { type: 'string' } }, required: ['transcripcion', 'respuesta'], additionalProperties: false } } }) });
  if (!response.ok) throw new HttpError(502, 'No pudimos procesar el audio.');
  const raw = extractText(await response.json());
  try { const parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, '')); if (typeof parsed.transcripcion === 'string' && typeof parsed.respuesta === 'string') return parsed; } catch {}
  throw new HttpError(502, 'La IA devolvió una respuesta de voz inválida.');
}));
