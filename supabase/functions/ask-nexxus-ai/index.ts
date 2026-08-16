// Equivalente a exports.askNexxusAI (nexxus/backend/index.js:1561).
// Simplificado respecto al original: se omiten los generadores de respuesta
// determinista sin IA (buildEmployeeAnswer/buildCompanyAnswer/buildGlobalAnswer,
// plantillas de texto largas usadas solo como fallback si Gemini no responde)
// -- aqui el contexto se arma igual pero la respuesta siempre pasa por Gemini,
// con un mensaje de error simple si la IA no esta disponible. Se conserva el
// parseo de tags [NOTIFICATION:..]/[TASK:..]/[EVENT:..] y el registro de
// ai_usage con costo estimado.
import {
  applyActionTags,
  buildAiContext,
  extractSensitiveActions,
  fetchGeminiConRotacion,
  getCaller,
  isCanonicalRole,
  safeString,
  withHandler,
  writeAuditLog,
  HttpError,
  SensitiveAiAction,
} from "../_shared/nexxus.ts";

const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-3.6-flash";
const GEMINI_PRICING: Record<string, { input: number; output: number }> = {
  "gemini-3.6-flash": { input: 0.75, output: 3.75 },
  "gemini-2.5-pro": { input: 1.25, output: 10.0 },
  default: { input: 0.1, output: 0.4 },
};

function computeCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = GEMINI_PRICING[model] || GEMINI_PRICING.default;
  return (
    Math.round(
      (((inputTokens || 0) / 1e6) * pricing.input +
        ((outputTokens || 0) / 1e6) * pricing.output) *
        1e8
    ) / 1e8
  );
}

async function callGemini(
  prompt: string,
  context: unknown,
  history: { rol: string; texto: string }[],
  puedeAprobar: boolean
) {
  const instruccionAprobacion = puedeAprobar
    ? ` Si el usuario pide aprobar o rechazar una solicitud de ausencia o interna que veas en el contexto (colección ` +
      `"ausencias" o "solicitudes"), NO la apruebes tú mismo: emite [APPROVE:coleccion|id|titulo] (coleccion es ` +
      `"solicitudes_ausencia" o "solicitudes_internas", id es el id real del registro en el contexto, titulo es un ` +
      `resumen breve) para que el sistema le muestre al usuario una tarjeta de confirmación explícita antes de ` +
      `aprobarla — nunca la des por aprobada en tu respuesta de texto.`
    : "";
  const systemPrompt =
    `Eres el asistente inteligente de Nexxus (plataforma empresarial de RRHH, nómina y gestión operativa). ` +
    `Redacta siempre en español profesional, conciso, amable y natural. ` +
    `Reglas de redacción obligatorias: ` +
    `1. No utilices líneas de separación con guiones como '---' ni '___'. ` +
    `2. No utilices almohadillas de títulos como '#', '##' o '###'. Escribe los títulos y encabezados de forma limpia o en negrita. ` +
    `3. Para destacar conceptos o estados importantes, usa negritas limpias (**término**). ` +
    `4. Para listas o puntos clave, usa viñetas con asterisco simple (* elemento) o numeradas (1. elemento). ` +
    `5. Ve directo al grano sin rodeos innecesarios ni formalismos excesivos. ` +
    `6. El contexto en JSON de abajo es la ÚNICA fuente de verdad sobre la empresa y el usuario: contiene ` +
    `TODO lo que tienes disponible para responder. Antes de decir que no tienes información, revisa cada ` +
    `campo del JSON con cuidado — casi siempre el dato que te piden ya está ahí. Si el usuario es jefe o admin, ` +
    `el campo "totalEmpleados" es el número EXACTO y real de personas en la empresa (contado directo en la ` +
    `base de datos) — úsalo siempre que te pregunten cuántos empleados hay, NUNCA cuentes elementos del ` +
    `arreglo "empleados" a mano, porque ese arreglo puede venir recortado por límites de tamaño y contarlo ` +
    `manualmente da un número menor al real. "empleados" trae el listado de personas de la empresa (nombre, ` +
    `correo, rol, estado) para buscar a alguien específico o cruzar ids con nombres, "empresa" trae los datos ` +
    `de la compañía. "nominas" trae el detalle completo de nómina de cada empleado (salario bruto y neto, ` +
    `ISSS, AFP, renta, otras deducciones, período, estado); "checkinsBienestar" trae los check-ins de ánimo ` +
    `del equipo (estado_animo, nota, fecha) para responder sobre bienestar, clima laboral o quién ha reportado ` +
    `malestar; "incidencias" son reportes de problemas, "evaluaciones" son evaluaciones de desempeño (puntaje, ` +
    `comentarios), "feedbacks" son comentarios libres del equipo. "tareas"/"asistencias"/"reportes"/` +
    `"ausencias"/"solicitudesInternas" son de TODA la empresa (no solo los tuyos): úsalos con confianza y en ` +
    `detalle para responder cualquier pregunta de resumen, conteo o listado de equipo (quién no ha marcado ` +
    `entrada hoy, cuántas solicitudes hay pendientes, quién es fulano, cómo va el bienestar del equipo, etc). ` +
    `Solo di que no tienes el dato si de verdad no aparece en el JSON. ` +
    `Contexto de la empresa y empleado en JSON: ${JSON.stringify(context).slice(0, 55000)}\n` +
    `Si corresponde, puedes emitir como texto literal las etiquetas [NOTIFICATION:tipo|titulo|mensaje] ` +
    `(tipo debe ser uno de: bienestar, tarea, aprobacion, general — usa siempre "bienestar" cuando el empleado ` +
    `exprese malestar, estrés, agotamiento o sobrecarga, o pida explícitamente avisarle a su jefe/RRHH sobre ` +
    `cómo se siente), [TASK:prioridad|titulo|descripcion|asignado_a], ` +
    `[EVENT:tipo|titulo|inicio|fin|descripcion], ` +
    `[REQUEST_AUSENCIA:tipo|fecha_inicio|fecha_fin|motivo] (tipo uno de: vacaciones, permiso, enfermedad, ` +
    `incapacidad, personal; fechas en formato YYYY-MM-DD) cuando el usuario pida solicitar una ausencia, ` +
    `[REQUEST_INTERNA:tipo|detalle] (tipo uno de: adelanto, permiso, capacitacion, compra, equipo) cuando pida ` +
    `crear una solicitud interna, [COMPLETE_TASK:id] (usa el id real de la tarea tal como aparece en el ` +
    `contexto) cuando el usuario diga que terminó una tarea que puedas identificar con claridad — si hay ` +
    `varias coincidencias posibles, pregunta cuál antes de marcarla, y [CLOCK_IN] / [CLOCK_OUT] cuando pida ` +
    `marcar su entrada o salida.` +
    instruccionAprobacion;
  const historial = history
    .slice(-6)
    .map(
      (h) =>
        `${h.rol === "usuario" ? "Usuario" : "Asistente"}: ${safeString(
          h.texto,
          2000
        )}`
    )
    .join("\n");
  const input = `${systemPrompt}${
    historial ? `\n\nHistorial:\n${historial}` : ""
  }\n\nUsuario: ${prompt}`;
  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/interactions";
  let response: Response;
  try {
    // `store: false` evita retener en Gemini el contexto interno de RR. HH. que enviamos por petición.
    response = await fetchGeminiConRotacion(endpoint, { model: GEMINI_MODEL, input, store: false });
  } catch (cause) {
    console.error("Gemini no disponible (sin claves configuradas o todas sin cuota)", cause);
    return null;
  }
  if (!response.ok) {
    console.error("Gemini error", await response.text().catch(() => ""));
    return null;
  }
  const json = await response.json();
  const text =
    typeof json?.output_text === "string"
      ? json.output_text
      : (json?.steps || [])
          .filter((step: { type?: string }) => step.type === "model_output")
          .flatMap(
            (step: { content?: { type?: string; text?: string }[] }) =>
              step.content || []
          )
          .filter(
            (content: { type?: string; text?: string }) =>
              content.type === "text"
          )
          .map((content: { text?: string }) => content.text || "")
          .join("\n");
  if (!text) {
    console.error("Gemini returned no text", JSON.stringify(json));
    return null;
  }
  const usage = json?.usage_metadata || json?.usageMetadata || {};
  return {
    text,
    model: GEMINI_MODEL,
    inputTokens: usage.prompt_token_count ?? usage.promptTokenCount ?? null,
    outputTokens:
      usage.candidates_token_count ?? usage.candidatesTokenCount ?? null,
    totalTokens: usage.total_token_count ?? usage.totalTokenCount ?? null,
  };
}

function toPlainText(text: string): string {
  return text
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*(?:---+|___+|\*\*\*+)\s*$/gm, "")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/(`{1,3})([^`]+)\1/g, "$2")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

Deno.serve(
  withHandler(async (req, admin) => {
    const caller = await getCaller(req, admin);
    const body = await req.json();
    const prompt = safeString(body?.prompt, 1200);
    if (!prompt) throw new HttpError(400, "Escribe una pregunta para la IA.");
    const history = Array.isArray(body?.history) ? body.history : [];

    const context = await buildAiContext(admin, caller);
    const startedAt = Date.now();
    const puedeAprobar = isCanonicalRole(caller.rol);
    const gemini = await callGemini(prompt, context, history, puedeAprobar);
    const latencyMs = Date.now() - startedAt;

    // Las acciones sensibles se extraen ANTES de aplicar los tags automaticos, para que nunca
    // lleguen a applyActionTags (que solo conoce NOTIFICATION/TASK/EVENT) ni se ejecuten solas.
    const { clean: textoSinAprobaciones, acciones: accionesSensibles } = gemini
      ? extractSensitiveActions(gemini.text)
      : { clean: "", acciones: [] as SensitiveAiAction[] };
    const respuesta = gemini
      ? toPlainText(await applyActionTags(admin, caller, textoSinAprobaciones))
      : "El asistente de IA no está disponible en este momento.";

    await admin.from("ai_usage").insert({
      empresa_id: caller.empresa_id,
      usuario_id: caller.id,
      modelo: gemini?.model || null,
      tokens_entrada: gemini?.inputTokens || 0,
      tokens_salida: gemini?.outputTokens || 0,
    });

    await writeAuditLog(admin, {
      empresaId: caller.empresa_id,
      actorId: caller.id,
      accion: "Consulta IA Nexxus",
      modulo: "IA",
      detalles: `${prompt.length} caracteres`,
      targetId: caller.id,
    });

    return {
      respuesta,
      provider: gemini ? "gemini" : "unavailable",
      latencyMs,
      costUsd: gemini
        ? computeCostUsd(
            gemini.model,
            gemini.inputTokens || 0,
            gemini.outputTokens || 0
          )
        : 0,
      // Doble candado: aunque el modelo alucine un tag [APPROVE:] para un rol sin permiso, nunca se
      // devuelve al cliente si puedeAprobar es falso (el prompt ya le pide no hacerlo, esto es el
      // respaldo del lado del servidor).
      accionesSensibles: puedeAprobar ? accionesSensibles : [],
    };
  })
);
