const admin = require("firebase-admin");

const email = process.env.NEXXUS_SUPER_ADMIN_EMAIL;
const password = process.env.NEXXUS_SUPER_ADMIN_PASSWORD;
const displayName = process.env.NEXXUS_SUPER_ADMIN_NAME || "Nexxus Super Admin";
const rotatePassword = process.env.NEXXUS_SUPER_ADMIN_ROTATE_PASSWORD === "true";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{14,}$/;

if (!email || !password) {
  console.error("Set NEXXUS_SUPER_ADMIN_EMAIL and NEXXUS_SUPER_ADMIN_PASSWORD before running this script.");
  process.exit(1);
}

if (!EMAIL_PATTERN.test(email)) {
  console.error("NEXXUS_SUPER_ADMIN_EMAIL must be a valid email address.");
  process.exit(1);
}

if (!PASSWORD_PATTERN.test(password)) {
  console.error("NEXXUS_SUPER_ADMIN_PASSWORD must be at least 14 characters and include uppercase, lowercase, number and symbol.");
  process.exit(1);
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
      source: "seed-super-admin",
    },
    ipAddress: "Local seed script",
    timestamp: new Date().toISOString(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`Super admin ready for ${email}. Password was read from the environment and was not printed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
