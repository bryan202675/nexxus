const admin = require("firebase-admin");
const { INTERNAL_PASSWORD_ALGORITHM, hashInternalPassword } = require("../passwords");

const email = process.env.NEXXUS_SUPER_ADMIN_EMAIL;
const password = process.env.NEXXUS_SUPER_ADMIN_PASSWORD;
const displayName = process.env.NEXXUS_SUPER_ADMIN_NAME || "Nexxus Super Admin";
const rotatePassword = process.env.NEXXUS_SUPER_ADMIN_ROTATE_PASSWORD === "true";
const allowWeakSuperAdminPassword = process.env.NEXXUS_ALLOW_WEAK_SUPER_ADMIN_PASSWORD === "true";

// Credencial de acceso al panel (login empresarial sin código de empresa, ver backend/index.js).
const workspaceUser = String(process.env.NEXXUS_SUPER_ADMIN_USER || "").trim().toLowerCase();
const workspacePassword = process.env.NEXXUS_SUPER_ADMIN_WORKSPACE_PASSWORD || "";
const rotateWorkspacePassword = process.env.NEXXUS_SUPER_ADMIN_ROTATE_WORKSPACE_PASSWORD === "true";
const allowWeakWorkspacePassword = process.env.NEXXUS_ALLOW_WEAK_WORKSPACE_PASSWORD === "true";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{14,}$/;
// El usuario de acceso al panel puede ser un nombre simple (jdoe) o un correo (nexxusadmin@nexxus.com).
const WORKSPACE_USER_PATTERN = /^[a-z0-9._-]{3,60}$|^[a-z0-9._%+-]{1,64}@[a-z0-9.-]+\.[a-z]{2,}$/;

if (!email || !password) {
  console.error("Set NEXXUS_SUPER_ADMIN_EMAIL and NEXXUS_SUPER_ADMIN_PASSWORD before running this script.");
  process.exit(1);
}

if (!EMAIL_PATTERN.test(email)) {
  console.error("NEXXUS_SUPER_ADMIN_EMAIL must be a valid email address.");
  process.exit(1);
}

let weakSuperAdminPassword = false;
if (!PASSWORD_PATTERN.test(password)) {
  if (!allowWeakSuperAdminPassword) {
    console.error("NEXXUS_SUPER_ADMIN_PASSWORD must be at least 14 characters and include uppercase, lowercase, number and symbol. Set NEXXUS_ALLOW_WEAK_SUPER_ADMIN_PASSWORD=true to override (not recommended for a super admin account).");
    process.exit(1);
  }
  weakSuperAdminPassword = true;
  console.warn("⚠️  NEXXUS_ALLOW_WEAK_SUPER_ADMIN_PASSWORD=true: usando una contraseña débil para la cuenta de Firebase Auth con privilegios totales sobre la plataforma. Rótala pronto.");
}

let weakWorkspacePassword = false;
if (workspaceUser || workspacePassword) {
  if (!workspaceUser || !workspacePassword) {
    console.error("Set both NEXXUS_SUPER_ADMIN_USER and NEXXUS_SUPER_ADMIN_WORKSPACE_PASSWORD, or neither.");
    process.exit(1);
  }
  if (!WORKSPACE_USER_PATTERN.test(workspaceUser)) {
    console.error("NEXXUS_SUPER_ADMIN_USER must be 3-60 chars: lowercase letters, digits, dot, underscore or hyphen.");
    process.exit(1);
  }
  if (!PASSWORD_PATTERN.test(workspacePassword)) {
    if (!allowWeakWorkspacePassword) {
      console.error("NEXXUS_SUPER_ADMIN_WORKSPACE_PASSWORD must be at least 14 characters and include uppercase, lowercase, number and symbol. Set NEXXUS_ALLOW_WEAK_WORKSPACE_PASSWORD=true to override (not recommended for a super admin account).");
      process.exit(1);
    }
    weakWorkspacePassword = true;
    console.warn("⚠️  NEXXUS_ALLOW_WEAK_WORKSPACE_PASSWORD=true: usando una contraseña de acceso débil para una cuenta con privilegios totales sobre la plataforma. Rótala pronto desde Configuración en el panel.");
  }
}

if (!admin.apps.length) {
  admin.initializeApp();
}

async function main() {
  let userRecord;
  let created = false;
  try {
    userRecord = await admin.auth().getUserByEmail(email);
  } catch (error) {
    if (error.code !== "auth/user-not-found") throw error;
    userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      emailVerified: true,
    });
    created = true;
  }

  if (!created && rotatePassword) {
    userRecord = await admin.auth().updateUser(userRecord.uid, {
      password,
      displayName,
      emailVerified: true,
    });
  } else if (!created && userRecord.displayName !== displayName) {
    userRecord = await admin.auth().updateUser(userRecord.uid, { displayName });
  }

  await admin.auth().setCustomUserClaims(userRecord.uid, {
    rol: "super_admin",
    role: "super_admin",
  });

  const workspaceFields = {};
  const willSetWorkspaceCredential = workspaceUser && workspacePassword && (created || rotateWorkspacePassword);
  if (willSetWorkspaceCredential) {
    workspaceFields.usuarioInterno = workspaceUser;
    workspaceFields.codigoEmpresa = null;
    workspaceFields.empresaId = null;
    workspaceFields.empresa_id = null;
    workspaceFields.passwordInternoHash = hashInternalPassword(workspacePassword);
    workspaceFields.passwordHashAlgorithm = INTERNAL_PASSWORD_ALGORITHM;
    workspaceFields.passwordUpdatedAt = admin.firestore.FieldValue.serverTimestamp();
    workspaceFields.passwordInterno = admin.firestore.FieldValue.delete();
    workspaceFields.passwordInicial = admin.firestore.FieldValue.delete();
  } else if (workspaceUser) {
    // Ya existe la credencial de acceso y no se pidió rotarla: solo mantenemos el usuario interno.
    workspaceFields.usuarioInterno = workspaceUser;
  }

  await admin.firestore().collection("usuarios").doc(userRecord.uid).set({
    id: userRecord.uid,
    nombre: displayName,
    correo: email,
    rol: "super_admin",
    role: "super_admin",
    activo: true,
    estado_activo: true,
    racha: 0,
    superAdmin: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    ...workspaceFields,
  }, { merge: true });

  await admin.firestore().collection("audit_logs").add({
    empresaId: null,
    empresa_id: null,
    usuarioId: userRecord.uid,
    usuario_id: userRecord.uid,
    usuarioNombre: displayName,
    rol: "super_admin",
    accion: created ? "Creación de super admin" : rotatePassword ? "Rotación de super admin" : "Actualización de super admin",
    action: created ? "Creación de super admin" : rotatePassword ? "Rotación de super admin" : "Actualización de super admin",
    modulo: "Seguridad",
    module: "Seguridad",
    detalles: `Cuenta super_admin preparada para ${email}. La contraseña fue leída desde el entorno y no fue registrada.`,
    estado: "Success",
    targetId: userRecord.uid,
    metadata: {
      created,
      rotatedPassword: rotatePassword,
      workspaceCredentialSet: Boolean(willSetWorkspaceCredential),
      weakWorkspacePassword,
      weakSuperAdminPassword,
      source: "seed-super-admin",
    },
    ipAddress: "Local seed script",
    timestamp: new Date().toISOString(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`Super admin ready for ${email}. Password was read from the environment and was not printed.`);
  if (willSetWorkspaceCredential) {
    console.log(`Workspace login ready for usuario "${workspaceUser}" (sin código de empresa). Password was read from the environment and was not printed.`);
  } else if (workspaceUser) {
    console.log(`Workspace login unchanged for usuario "${workspaceUser}" (usa NEXXUS_SUPER_ADMIN_ROTATE_WORKSPACE_PASSWORD=true para rotar la contraseña).`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
