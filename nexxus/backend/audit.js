const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const { normalizeRole, tenantIdOf } = require("./security");

const actorNameOf = (actor = {}) => actor.nombre || actor.displayName || actor.correo || actor.email || "Sistema";

const auditPayload = ({
  actor = {},
  empresaId,
  accion,
  modulo,
  detalles = "",
  estado = "Success",
  targetId = null,
  metadata = {},
}) => {
  const tenantId = empresaId || tenantIdOf(actor) || null;
  const actorId = actor.id || actor.uid || "system";
  return {
    empresa_id: tenantId,
    empresaId: tenantId,
    usuario_id: actorId,
    usuarioId: actorId,
    usuarioNombre: actorNameOf(actor),
    rol: normalizeRole(actor.rol),
    accion,
    action: accion,
    modulo,
    module: modulo,
    detalles,
    estado,
    targetId,
    metadata,
    ipAddress: "Cloud Function",
    timestamp: new Date().toISOString(),
    createdAt: FieldValue.serverTimestamp(),
  };
};

const writeAuditLog = async (event) => {
  if (!event?.accion || !event?.modulo) return null;
  const payload = auditPayload(event);
  const ref = await admin.firestore().collection("audit_logs").add(payload);
  return { id: ref.id, ...payload };
};

module.exports = {
  auditPayload,
  writeAuditLog,
};
