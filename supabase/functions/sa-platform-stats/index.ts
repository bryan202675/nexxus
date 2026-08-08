// Equivalente a exports.saPlatformStats (nexxus/backend/index.js:1748).
import { getCaller, isSuperAdmin, withHandler, HttpError } from "../_shared/nexxus.ts";

const ROLE_ALIAS_GROUPS: Record<string, string[]> = {
  super_admin: ["super_admin"],
  admin_empresa: ["admin_empresa"],
  jefe: ["jefe", "jefe_sector"],
  empleado: ["empleado", "psicologo"],
};

Deno.serve(withHandler(async (req, admin) => {
  const caller = await getCaller(req, admin);
  if (!isSuperAdmin(caller)) throw new HttpError(403, "Solo el super admin puede ver las estadísticas de la plataforma.");

  const hace30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const count = async (builder: PromiseLike<{ count: number | null }>) => (await builder).count ?? 0;

  const [
    empresasTotal,
    empresasActivas,
    empresasBaneadas,
    usuariosTotal,
    usuariosActivos,
    empresasNuevas30d,
    usuariosNuevos30d,
  ] = await Promise.all([
    count(admin.from("empresas").select("id", { count: "exact", head: true })),
    count(admin.from("empresas").select("id", { count: "exact", head: true }).eq("baneado", false)),
    count(admin.from("empresas").select("id", { count: "exact", head: true }).eq("baneado", true)),
    count(admin.from("usuarios").select("id", { count: "exact", head: true })),
    count(admin.from("usuarios").select("id", { count: "exact", head: true }).eq("estado_activo", true)),
    count(admin.from("empresas").select("id", { count: "exact", head: true }).gte("created_at", hace30d)),
    count(admin.from("usuarios").select("id", { count: "exact", head: true }).gte("created_at", hace30d)),
  ]);

  const porRol: Record<string, number> = {};
  for (const [role, aliases] of Object.entries(ROLE_ALIAS_GROUPS)) {
    porRol[role] = await count(admin.from("usuarios").select("id", { count: "exact", head: true }).in("rol", aliases));
  }

  const { data: empresasPorPlan } = await admin.from("empresas").select("plan_id");
  const porPlan: Record<string, number> = {};
  for (const row of empresasPorPlan || []) {
    const key = row.plan_id || "Sin plan";
    porPlan[key] = (porPlan[key] || 0) + 1;
  }

  const { data: pagos } = await admin.from("payments").select("monto, estado, created_at").eq("estado", "confirmado");
  let ingresosTotales = 0;
  let ingresos30d = 0;
  for (const pago of pagos || []) {
    const monto = Number(pago.monto) || 0;
    ingresosTotales += monto;
    if (pago.created_at >= hace30d) ingresos30d += monto;
  }

  return {
    empresasTotal, empresasActivas, empresasBaneadas,
    usuariosTotal, usuariosActivos,
    porRol, porPlan,
    empresasNuevas30d, usuariosNuevos30d,
    ingresosTotales, ingresos30d,
  };
}));
