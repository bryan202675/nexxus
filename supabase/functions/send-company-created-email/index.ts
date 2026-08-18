// Envía el correo de confirmación justo después de crear la empresa (paso 3 del registro
// self-service, crearCuentaYEmpresa en apps/dashboard/src/services/registro.ts). A diferencia
// de send-welcome-email, aquí la fila de "usuarios" ya existe (se crea en el paso 3, antes de
// llamar a esta función), así que getCaller funciona normal. Todos los datos (empresa, plan)
// se leen del propio caller/empresa en la base -- nunca del body -- para que solo se pueda
// disparar este correo sobre la empresa real del usuario autenticado.
import { getCaller, HttpError, withHandler } from "../_shared/nexxus.ts";
import { sendEmail } from "../_shared/gmail.ts";
import { plantillaEmpresaCreada } from "../_shared/emailTemplates.ts";

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!caller.empresa_id) throw new HttpError(412, "Tu usuario no tiene empresa asociada.");

  const { data: empresa } = await admin
    .from("empresas")
    .select("nombre, codigo, plan_id")
    .eq("id", caller.empresa_id)
    .maybeSingle();
  if (!empresa) throw new HttpError(404, "No se encontró la empresa.");

  let planNombre = "";
  if (empresa.plan_id) {
    const { data: plan } = await admin.from("planes").select("nombre").eq("id", empresa.plan_id).maybeSingle();
    planNombre = plan?.nombre || "";
  }

  const { subject, html } = plantillaEmpresaCreada({
    nombreAdmin: caller.nombre,
    nombreEmpresa: empresa.nombre,
    codigoEmpresa: empresa.codigo,
    plan: planNombre,
  });

  try {
    await sendEmail(caller.correo, subject, html);
  } catch (sendError) {
    console.error("[send-company-created-email] No se pudo enviar el correo:", sendError);
    return { ok: false };
  }

  return { ok: true };
}));
