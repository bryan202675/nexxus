// Equivalente a exports.askNexxusAI (nexxus/backend/index.js:1561).
// Simplificado respecto al original: se omiten los generadores de respuesta
// determinista sin IA (buildEmployeeAnswer/buildCompanyAnswer/buildGlobalAnswer,
// plantillas de texto largas usadas solo como fallback si Gemini no responde)
// -- aqui el contexto se arma igual pero la respuesta siempre pasa por Gemini,
// con un mensaje de error simple si la IA no esta disponible. Se conserva el
// parseo de tags [NOTIFICATION:..]/[TASK:..]/[EVENT:..] y el registro de
// ai_usage con costo estimado.
import { getCaller, isSuperAdmin, safeString, withHandler, writeAuditLog, HttpError, Caller } from "../_shared/nexxus.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
const GEMINI_PRICING: Record<string, { input: number; output: number }> = {
  "gemini-2.5-flash": { input: 0.30, output: 2.50 },
  "gemini-2.5-pro": { input: 1.25, output: 10.00 },
  default: { input: 0.10, output: 0.40 },
};

function computeCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = GEMINI_PRICING[model] || GEMINI_PRICING.default;
  return Math.round((((inputTokens || 0) / 1e6) * pricing.input + ((outputTokens || 0) / 1e6) * pricing.output) * 1e8) / 1e8;
}

const CANONICAL_ROLE = (rol: string) => ["admin", "admin_empresa", "jefe", "jefe_sector", "super_admin"].includes(rol);

async function buildContext(admin: SupabaseClient, caller: Caller): Promise<Record<string, unknown>> {
  if (isSuperAdmin(caller) && !caller.empresa_id) {
    const [{ data: empresas }, { data: usuarios }, { data: pagos }] = await Promise.all([
      admin.from("empresas").select("*").limit(50),
      admin.from("usuarios").select("*").limit(120),
      admin.from("payments").select("*").limit(80),
    ]);
    return { alcance: "plataforma", empresas, usuarios, pagos };
  }
  if (!caller.empresa_id) throw new HttpError(412, "Tu usuario no tiene empresa asociada.");
  if (CANONICAL_ROLE(caller.rol)) {
    const [tareas, asistencias, reportes, ausencias, nominas] = await Promise.all([
      admin.from("tareas").select("*").eq("empresa_id", caller.empresa_id).limit(80),
      admin.from("asistencias").select("*").eq("empresa_id", caller.empresa_id).limit(80),
      admin.from("reportes").select("*").eq("empresa_id", caller.empresa_id).limit(60),
      admin.from("solicitudes_ausencia").select("*").eq("empresa_id", caller.empresa_id).limit(60),
      admin.from("nominas").select("*").eq("empresa_id", caller.empresa_id).limit(60),
    ]);
    return {
      alcance: "empresa",
      tareas: tareas.data, asistencias: asistencias.data, reportes: reportes.data,
      ausencias: ausencias.data, nominas: nominas.data,
    };
  }
  const [tareas, ausencias, nominas] = await Promise.all([
    admin.from("tareas").select("*").eq("empresa_id", caller.empresa_id).eq("asignado_a", caller.id).limit(20),
    admin.from("solicitudes_ausencia").select("*").eq("empresa_id", caller.empresa_id).eq("usuario_id", caller.id).limit(12),
    admin.from("nominas").select("*").eq("empresa_id", caller.empresa_id).eq("usuario_id", caller.id).limit(12),
  ]);
  return { alcance: "personal", tareas: tareas.data, ausencias: ausencias.data, nominas: nominas.data };
}

async function callGemini(prompt: string, context: unknown, history: { rol: string; texto: string }[]) {
  if (!GEMINI_API_KEY) return null;
  const systemPrompt = `Eres el asistente de Nexxus (RRHH/nómina). Contexto en JSON: ${JSON.stringify(context).slice(0, 8000)}\n` +
    `Si corresponde, puedes emitir como texto literal las etiquetas [NOTIFICATION:tipo|titulo|mensaje], ` +
    `[TASK:prioridad|titulo|descripcion|asignado_a] o [EVENT:tipo|titulo|inicio|fin|descripcion] para que el sistema cree ese registro.`;
  const contents = [
    ...history.slice(-6).map((h) => ({ role: h.rol === "usuario" ? "user" : "model", parts: [{ text: h.texto }] })),
    { role: "user", parts: [{ text: prompt }] },
  ];
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: systemPrompt }] }, contents }),
  });
  if (!response.ok) {
    console.error("Gemini error", await response.text().catch(() => ""));
    return null;
  }
  const json = await response.json();
  const text = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join("") || "";
  const usage = json?.usageMetadata || {};
  return {
    text,
    model: GEMINI_MODEL,
    inputTokens: usage.promptTokenCount ?? null,
    outputTokens: usage.candidatesTokenCount ?? null,
    totalTokens: usage.totalTokenCount ?? null,
  };
}

async function applyActionTags(admin: SupabaseClient, caller: Caller, text: string): Promise<string> {
  let clean = text;
  let match: RegExpMatchArray | null;
  while ((match = clean.match(/\[NOTIFICATION:(\w+)\|([^|]+)\|([^\]]+)\]/))) {
    await admin.from("notificaciones").insert({
      usuario_id: caller.id, empresa_id: caller.empresa_id,
      titulo: safeString(match[2], 100), cuerpo: safeString(match[3], 300),
    }).select();
    clean = clean.replace(match[0], "").trim();
  }
  while ((match = clean.match(/\[TASK:([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/))) {
    const asignadoRaw = match[4].trim();
    await admin.from("tareas").insert({
      empresa_id: caller.empresa_id,
      titulo: safeString(match[2], 150),
      descripcion: safeString(match[3], 500),
      prioridad: match[1],
      asignado_a: asignadoRaw.toLowerCase() === "yo" || !asignadoRaw ? caller.id : asignadoRaw,
      creado_por: caller.id,
      estado: "pendiente",
    });
    clean = clean.replace(match[0], "").trim();
  }
  while ((match = clean.match(/\[EVENT:([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/))) {
    await admin.from("calendario_empresarial").insert({
      empresa_id: caller.empresa_id,
      titulo: safeString(match[2], 120),
      fecha_inicio: match[3],
      fecha_fin: match[4],
      descripcion: safeString(match[5], 400),
      tipo: match[1].toLowerCase().trim(),
    });
    clean = clean.replace(match[0], "").trim();
  }
  return clean;
}

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  const body = await req.json();
  const prompt = safeString(body?.prompt, 1200);
  if (!prompt) throw new HttpError(400, "Escribe una pregunta para la IA.");
  const history = Array.isArray(body?.history) ? body.history : [];

  const context = await buildContext(admin, caller);
  const startedAt = Date.now();
  const gemini = await callGemini(prompt, context, history);
  const latencyMs = Date.now() - startedAt;

  const respuesta = gemini ? await applyActionTags(admin, caller, gemini.text) : "El asistente de IA no está disponible en este momento.";

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
    costUsd: gemini ? computeCostUsd(gemini.model, gemini.inputTokens || 0, gemini.outputTokens || 0) : 0,
  };
}));
