// Equivalente a exports.completeTrainingModule (nexxus/backend/index.js:680).
import { getCaller, sameCompany, safeString, withHandler, writeAuditLog, HttpError } from "../_shared/nexxus.ts";

// Codigo de certificado verificable a simple vista: NX-<prefijo curso>-<año>-<sufijo aleatorio>.
function generarCodigoCertificado(cursoId: string): string {
  const prefijoCurso = cursoId.replace(/-/g, "").slice(0, 6).toUpperCase();
  const anio = new Date().getFullYear();
  const sufijo = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `NX-${prefijoCurso}-${anio}-${sufijo}`;
}

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!caller.empresa_id) throw new HttpError(412, "Tu usuario no tiene empresa asociada.");

  const body = await req.json();
  const cursoId = safeString(body?.cursoId, 120);
  const moduloIndex = Number(body?.moduloIndex);
  if (!cursoId || !Number.isInteger(moduloIndex) || moduloIndex < 0) {
    throw new HttpError(400, "Curso o módulo inválido.");
  }

  const { data: curso, error: cursoError } = await admin.from("cursos").select("*").eq("id", cursoId).maybeSingle();
  if (cursoError) throw new HttpError(500, cursoError.message);
  if (!curso) throw new HttpError(404, "No se encontró el curso.");
  if (!sameCompany(caller, curso.empresa_id)) throw new HttpError(403, "No puedes acceder a cursos de otra empresa.");

  const modules = Array.isArray(curso.contenido?.modulos) ? curso.contenido.modulos : [];
  if (moduloIndex >= modules.length) throw new HttpError(400, "El módulo indicado no existe en este curso.");

  const { data: previous } = await admin
    .from("capacitacion_avances")
    .select("*")
    .eq("curso_id", cursoId)
    .eq("empleado_id", caller.id)
    .maybeSingle();

  const completedModules = Array.from(new Set([
    ...(Array.isArray(previous?.progreso_modulos) ? previous.progreso_modulos : []),
    moduloIndex,
  ])).filter((i) => Number.isInteger(i) && i >= 0 && i < modules.length).sort((a, b) => a - b);

  const progreso = modules.length ? Math.round((completedModules.length / modules.length) * 100) : 0;
  const completado = modules.length > 0 && completedModules.length >= modules.length;

  // El certificado se emite una sola vez (idempotente): si ya existia un codigo antes de este
  // upsert, se conserva -- completar el ultimo modulo dos veces no debe generar dos certificados.
  const yaTeniaCertificado = Boolean(previous?.certificado_codigo);
  const emiteCertificadoAhora = completado && !yaTeniaCertificado;
  const certificadoCodigo = yaTeniaCertificado
    ? previous!.certificado_codigo
    : (emiteCertificadoAhora ? generarCodigoCertificado(cursoId) : null);
  const certificadoEmitidoAt = yaTeniaCertificado
    ? previous!.certificado_emitido_at
    : (emiteCertificadoAhora ? new Date().toISOString() : null);

  const { data: result, error: upsertError } = await admin.from("capacitacion_avances").upsert({
    empresa_id: caller.empresa_id,
    curso_id: cursoId,
    empleado_id: caller.id,
    progreso,
    completado,
    progreso_modulos: completedModules,
    certificado_codigo: certificadoCodigo,
    certificado_emitido_at: certificadoEmitidoAt,
  }, { onConflict: "curso_id,empleado_id" }).select("*").single();
  if (upsertError) throw new HttpError(500, upsertError.message);

  if (completado) {
    await writeAuditLog(admin, {
      empresaId: caller.empresa_id,
      actorId: caller.id,
      accion: emiteCertificadoAhora ? "Curso completado (certificado emitido)" : "Curso completado",
      modulo: "Capacitación",
      detalles: safeString(curso.titulo, 180),
      targetId: cursoId,
    });
  }

  return { ...result, updatedAt: new Date().toISOString() };
}));
