import {
  applyActionTags,
  buildAiContext,
  extractSensitiveActions,
  fetchGeminiConRotacion,
  getCaller,
  isCanonicalRole,
  HttpError,
  withHandler,
} from '../_shared/nexxus.ts';

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

function buildVoiceSystemPrompt(nombre: string, rol: string, context: unknown, puedeAprobar: boolean): string {
  const instruccionAprobacion = puedeAprobar
    ? `10. Si te piden aprobar o rechazar una solicitud de ausencia o interna que veas en el contexto, NO la ` +
      `apruebes tú mismo: incluye [APPROVE:coleccion|id|titulo] (coleccion es "solicitudes_ausencia" o ` +
      `"solicitudes_internas", id es el id real del contexto, titulo un resumen breve) y dile al usuario que ` +
      `le vas a mostrar una tarjeta para confirmar — nunca digas que ya quedó aprobada. `
    : `10. No puedes aprobar ni rechazar solicitudes por voz: si te lo piden, explica con naturalidad que esa ` +
      `acción se debe confirmar desde la app. `;
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
    `6. Si el usuario te pide avisarle a su jefe o RRHH cómo se siente, o expresa malestar, estrés o ` +
    `agotamiento, incluye en tu respuesta hablada la etiqueta [NOTIFICATION:bienestar|titulo breve|mensaje] y ` +
    `dile de forma natural que ya avisaste — nunca leas la etiqueta en voz alta, es invisible para el usuario. ` +
    `7. Si te pide solicitar una ausencia (vacaciones, permiso, incapacidad, etc.), primero confirma verbalmente ` +
    `el tipo y las fechas, y solo cuando las tengas claras incluye ` +
    `[REQUEST_AUSENCIA:tipo|fecha_inicio|fecha_fin|motivo] (tipo uno de: vacaciones, permiso, enfermedad, ` +
    `incapacidad, personal; fechas en formato YYYY-MM-DD, usando fechaActual como referencia para fechas relativas ` +
    `como "mañana" o "el viernes"). ` +
    `8. Si te pide crear una solicitud interna (adelanto, compra, equipo, capacitación, permiso), incluye ` +
    `[REQUEST_INTERNA:tipo|detalle] (tipo uno de: adelanto, permiso, capacitacion, compra, equipo). ` +
    `9. Si dice que ya terminó una tarea y la identificas con claridad en el contexto, incluye ` +
    `[COMPLETE_TASK:id] con el id real de esa tarea (si hay varias que podrían ser, pregunta cuál antes de ` +
    `marcarla). Si te pide marcar su entrada o salida, incluye [CLOCK_IN] o [CLOCK_OUT] según corresponda y ` +
    `confírmaselo de forma natural. ` +
    instruccionAprobacion +
    `11. Si ${nombre} es jefe o admin, el contexto trae datos de toda la empresa (tareas, asistencias, ` +
    `ausencias, nóminas, reportes): úsalo con confianza para dar resúmenes de equipo si te lo pide (cuántas ` +
    `tareas pendientes hay, quién no ha marcado entrada hoy, etc). ` +
    `Contexto real del usuario y su empresa en JSON: ${JSON.stringify(context).slice(0, 4000)}`
  );
}

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  const body = await req.json();
  const audio = body?.audio;
  if (typeof audio?.data !== 'string' || !audio.data || audio.data.length > 12_000_000) {
    throw new HttpError(400, 'El audio es inválido o demasiado largo.');
  }

  const transcripcion = await transcribeWithGroq(audio);
  const mimeType = typeof audio.mimeType === 'string' && audio.mimeType ? audio.mimeType : 'audio/m4a';
  const context = await buildAiContext(admin, caller);
  const puedeAprobar = isCanonicalRole(caller.rol);
  const systemPrompt = buildVoiceSystemPrompt(caller.nombre, caller.rol, context, puedeAprobar);

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

  const response = await fetchGeminiConRotacion('https://generativelanguage.googleapis.com/v1beta/interactions', {
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

  // [APPROVE:...] nunca se lee en voz alta ni se ejecuta solo -- se extrae aparte y, si el rol
  // puede aprobar, se devuelve para que el cliente muestre una tarjeta de confirmación (igual
  // que el chat de texto); si no puede, se descarta (respaldo de servidor, el prompt ya se lo pide).
  const { clean: respuestaSinAprobaciones, acciones } = extractSensitiveActions(parsed.respuesta);
  parsed.respuesta = await applyActionTags(admin, caller, respuestaSinAprobaciones);
  const accionesSensibles = puedeAprobar ? acciones : [];
  // Si el modelo devolvió la respuesta hablada compuesta solo por etiquetas (sin nada de
  // texto natural alrededor), applyActionTags las recorta todas y queda vacía -- Speech.speak('')
  // en el cliente no siempre dispara onDone, dejando la llamada congelada sin sonido ni avance.
  if (!parsed.respuesta.trim()) parsed.respuesta = 'Listo, ya quedó.';

  const usage = json?.usage_metadata || json?.usageMetadata || {};
  await admin.from('ai_usage').insert({
    empresa_id: caller.empresa_id,
    usuario_id: caller.id,
    modelo: model,
    tokens_entrada: usage.prompt_token_count ?? usage.promptTokenCount ?? 0,
    tokens_salida: usage.candidates_token_count ?? usage.candidatesTokenCount ?? 0,
  });

  return { ...parsed, accionesSensibles };
}));
