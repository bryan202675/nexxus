const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.crearEmpresaAdmin = onCall({ cors: true }, async (request) => {
  const { nombreEmpresa, nombreAdmin, correoAdmin, contrasenaAdmin, giroActividad, tamanoEquipo } = request.data;
  
  try {
    const userRecord = await admin.auth().createUser({
      email: correoAdmin,
      password: contrasenaAdmin,
      displayName: nombreAdmin,
    });

    const empresaRef = admin.firestore().collection('empresas').doc();
    await empresaRef.set({
      id: empresaRef.id,
      nombre: nombreEmpresa,
      giro: giroActividad || '',
      tamanoEquipo: tamanoEquipo || '',
      adminId: userRecord.uid,
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
      estado_activo: true
    });

    await admin.firestore().collection('usuarios').doc(userRecord.uid).set({
      id: userRecord.uid,
      empresa_id: empresaRef.id,
      empresaId: empresaRef.id,
      empresaNombre: nombreEmpresa,
      nombre: nombreAdmin,
      correo: correoAdmin,
      rol: 'admin',
      departamento: 'Dirección General',
      estado_activo: true,
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp()
    });

    await admin.firestore().collection('logs').add({
      empresa_id: empresaRef.id,
      usuario_id: userRecord.uid,
      accion: 'CREAR_EMPRESA_ADMIN',
      modulo: 'AUTH',
      fecha: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, empresaId: empresaRef.id };
  } catch (error) {
    throw new HttpsError("internal", "Error interno al crear la empresa: " + error.message);
  }
});

exports.crearUsuarioEmpresa = onCall({ cors: true }, async (request) => {
  const { auth, data } = request;

  if (!auth) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado.');
  }
  
  const callerDoc = await admin.firestore().collection('usuarios').doc(auth.uid).get();
  if (!callerDoc.exists) {
    throw new HttpsError('permission-denied', 'No se encontró el usuario.');
  }

  const callerData = callerDoc.data();
  const rolCaller = String(callerData.rol || '').toLowerCase();
  const modulosCaller = Array.isArray(callerData.permisos?.modulos) ? callerData.permisos.modulos : [];
  const puedeCrearUsuarios = rolCaller === 'admin' || modulosCaller.includes('admin') || modulosCaller.includes('plantilla');
  if (!puedeCrearUsuarios) {
    throw new HttpsError('permission-denied', 'Solo los administradores pueden crear usuarios.');
  }

  const { nombre, correo, contrasena, rol, departamento_id, empleado } = data;
  const empresa_id = callerData.empresa_id || callerData.empresaId;

  if (!empresa_id) {
    throw new HttpsError('failed-precondition', 'El administrador no tiene empresa asignada.');
  }

  if (!nombre || !correo || !contrasena || !rol) {
    throw new HttpsError('invalid-argument', 'Nombre, correo, contraseña y rol son obligatorios.');
  }

  try {
    const userRecord = await admin.auth().createUser({
      email: correo,
      password: contrasena,
      displayName: nombre,
    });

    const datosEmpleado = empleado && typeof empleado === 'object' ? empleado : {};
    const departamentoNombre = datosEmpleado.departamento || departamento_id || 'General';

    await admin.firestore().collection('usuarios').doc(userRecord.uid).set({
      ...datosEmpleado,
      id: userRecord.uid,
      empresa_id: empresa_id,
      empresaId: empresa_id,
      nombre: nombre,
      correo: correo,
      rol: rol,
      departamento_id: datosEmpleado.departamentoId || departamento_id || null,
      departamentoId: datosEmpleado.departamentoId || null,
      departamento: departamentoNombre,
      estado_activo: true,
      activo: true,
      eliminado: false,
      estado_onboarding: 'pendiente',
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await admin.firestore().collection('logs').add({
      empresa_id: empresa_id,
      empresaId: empresa_id,
      usuario_id: auth.uid,
      accion: 'CREAR_USUARIO',
      modulo: 'AUTH',
      detalles: userRecord.uid,
      fecha: admin.firestore.FieldValue.serverTimestamp()
    });

    await admin.firestore().collection('audit_logs').add({
      empresa_id: empresa_id,
      empresaId: empresa_id,
      usuarioId: auth.uid,
      usuarioNombre: callerData.nombre || callerData.correo || 'Administrador',
      rol: callerData.rol || 'admin',
      accion: 'Creación de Empleado',
      modulo: 'Plantilla',
      detalles: `${nombre} · ${correo}`,
      estado: 'Success',
      ipAddress: 'Cloud Function',
      timestamp: new Date().toISOString()
    });

    return { success: true, uid: userRecord.uid };
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Ya existe un usuario con ese correo.');
    }
    if (error.code === 'auth/invalid-password') {
      throw new HttpsError('invalid-argument', 'La contraseña no cumple los requisitos mínimos.');
    }
    throw new HttpsError("internal", "Error al crear el usuario: " + error.message);
  }
});

const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");

async function obtenerTokensPush(usuariosIds) {
  try {
    const tokensQuery = admin.firestore().collection('push_tokens')
      .where('usuario_id', 'in', usuariosIds.slice(0, 10))
      .where('activo', '==', true);
    
    const snapshot = await tokensQuery.get();
    return snapshot.docs.map(doc => doc.data().token);
  } catch (error) {
    console.error('Error al obtener tokens:', error);
    return [];
  }
}

async function enviarPushNotification(tokens, titulo, cuerpo, datos = {}) {
  if (!tokens || tokens.length === 0) return;

  const mensajes = tokens.map(token => ({
    token: token,
    notification: {
      title: titulo,
      body: cuerpo,
    },
    data: datos,
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'default',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
        },
      },
    },
  }));

  try {
    await Promise.all(
      mensajes.map(mensaje => admin.messaging().send(mensaje))
    );
    console.log(`${mensajes.length} notificaciones push enviadas`);
  } catch (error) {
    console.error('Error al enviar push notifications:', error);
  }
}

exports.onAnuncioCreado = onDocumentCreated("anuncios/{anuncioId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const anuncio = snapshot.data();
  const anuncioId = event.params.anuncioId;
  const { titulo, contenido, tipo, destinatarios, empresaId, empresa_id, adminId } = anuncio;
  const targetEmpresaId = empresaId || empresa_id;
  if (!targetEmpresaId) return;

  let usuariosIds = [];

  if (tipo === "global" || tipo === "empresa") {
    const snapshotUsuarios = await admin.firestore().collection("usuarios")
      .where("empresaId", "==", targetEmpresaId)
      .get();
    
    snapshotUsuarios.forEach(doc => {
      if (doc.id !== adminId) {
        usuariosIds.push(doc.id);
      }
    });
  } else if (tipo === "privado" && Array.isArray(destinatarios)) {
    usuariosIds = destinatarios;
  }

  if (usuariosIds.length === 0) return;

  const loteNotificaciones = admin.firestore().batch();
  const ahora = admin.firestore.FieldValue.serverTimestamp();

  usuariosIds.forEach(uid => {
    const notifId = `anuncio_${uid}_${anuncioId}`;
    const docRef = admin.firestore().collection("notificaciones").doc(notifId);
    loteNotificaciones.set(docRef, {
      id: notifId,
      usuario_id: uid,
      titulo: `Nuevo anuncio: ${titulo}`,
      mensaje: contenido,
      leida: false,
      fecha: ahora,
      anuncio_id: anuncioId,
      empresaId: targetEmpresaId,
      tipo: 'anuncio'
    });
  });

  await loteNotificaciones.commit();

  const tokens = await obtenerTokensPush(usuariosIds);
  await enviarPushNotification(tokens, 'Nuevo Anuncio', titulo, {
    tipo: 'anuncio',
    anuncioId: anuncioId,
    empresaId: targetEmpresaId
  });

  try {
    if (tipo === "global") {
       await admin.messaging().send({
          topic: `anuncios_${targetEmpresaId}`,
          notification: { title: titulo, body: contenido }
       });
    }
  } catch (error) {
    console.error("Error FCM:", error);
  }
});

exports.onTareaCreada = onDocumentCreated("tareas/{tareaId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const tarea = snapshot.data();
  const tareaId = event.params.tareaId;
  const { titulo, descripcion, asignado_a, asignado_por_nombre, empresaId } = tarea;

  if (!asignado_a) return;

  const notifId = `tarea_creada_${tareaId}`;
  const docRef = admin.firestore().collection("notificaciones").doc(notifId);
  await docRef.set({
    id: notifId,
    usuario_id: asignado_a,
    titulo: `Nueva tarea asignada`,
    mensaje: `${asignado_por_nombre || 'Tu jefe'} te asignó: "${titulo}". ${descripcion || ''}`.trim(),
    tipo: "tarea",
    leida: false,
    fecha: admin.firestore.FieldValue.serverTimestamp(),
    tarea_id: tareaId,
    empresaId: empresaId || '',
  });

  const tokens = await obtenerTokensPush([asignado_a]);
  await enviarPushNotification(tokens, 'Nueva Tarea', `${asignado_por_nombre || 'Tu jefe'} te asignó: "${titulo}"`, {
    tipo: 'tarea',
    tareaId: tareaId,
    empresaId: empresaId || ''
  });
});

exports.onTareaActualizada = onDocumentUpdated("tareas/{tareaId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const before = snapshot.before.data();
  const after = snapshot.after.data();
  const tareaId = event.params.tareaId;

  if (after.estado === 'completada') return;

  const huboCambios = 
    before.titulo !== after.titulo || 
    before.descripcion !== after.descripcion || 
    before.prioridad !== after.prioridad;

  if (!huboCambios) return;

  const { asignado_a, empresaId, titulo } = after;
  if (!asignado_a) return;

  const notifId = `tarea_modificada_${tareaId}`;
  const docRef = admin.firestore().collection("notificaciones").doc(notifId);
  await docRef.set({
    id: notifId,
    usuario_id: asignado_a,
    titulo: `Tarea modificada`,
    mensaje: `La tarea "${titulo}" ha sido modificada por el administrador. Por favor, revisa los cambios.`,
    tipo: "tarea_modificada",
    leida: false,
    fecha: admin.firestore.FieldValue.serverTimestamp(),
    tarea_id: tareaId,
    empresaId: empresaId || '',
  });

  const tokens = await obtenerTokensPush([asignado_a]);
  await enviarPushNotification(tokens, 'Tarea Actualizada', `La tarea "${titulo}" ha sido modificada`, {
    tipo: 'tarea_modificada',
    tareaId: tareaId,
    empresaId: empresaId || ''
  });
});

exports.onSolicitudAusenciaCreada = onDocumentCreated("solicitudes_ausencia/{solicitudId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const solicitud = snapshot.data();
  const solicitudId = event.params.solicitudId;
  const { usuario_id, usuario_nombre, tipo, fecha_inicio, fecha_fin, empresaId } = solicitud;

  const adminSnapshot = await admin.firestore().collection("usuarios")
    .where("empresaId", "==", empresaId)
    .where("rol", "==", "admin")
    .get();

  if (adminSnapshot.empty) return;

  const loteNotificaciones = admin.firestore().batch();
  const ahora = admin.firestore.FieldValue.serverTimestamp();

  const adminsIds = [];
  adminSnapshot.forEach(doc => {
    adminsIds.push(doc.id);
    const notifId = `solicitud_${doc.id}_${solicitudId}`;
    const docRef = admin.firestore().collection("notificaciones").doc(notifId);
    loteNotificaciones.set(docRef, {
      id: notifId,
      usuario_id: doc.id,
      titulo: `Nueva solicitud de ausencia`,
      mensaje: `${usuario_nombre} solicitó ${tipo} del ${fecha_inicio} al ${fecha_fin}`,
      tipo: "solicitud_ausencia",
      leida: false,
      fecha: ahora,
      solicitud_id: solicitudId,
      empresaId: empresaId,
    });
  });

  await loteNotificaciones.commit();

  const tokens = await obtenerTokensPush(adminsIds);
  await enviarPushNotification(tokens, 'Nueva Solicitud', `${usuario_nombre} solicitó ${tipo}`, {
    tipo: 'solicitud_ausencia',
    solicitudId: solicitudId,
    empresaId: empresaId
  });
});

exports.onSolicitudAusenciaActualizada = onDocumentUpdated("solicitudes_ausencia/{solicitudId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const before = snapshot.before.data();
  const after = snapshot.after.data();

  if (before.estado === after.estado) return;

  const { usuario_id, usuario_nombre, tipo, estado, empresaId } = after;

  const notifId = `solicitud_resp_${event.params.solicitudId}`;
  const docRef = admin.firestore().collection("notificaciones").doc(notifId);
  await docRef.set({
    id: notifId,
    usuario_id: usuario_id,
    titulo: `Solicitud ${estado === 'aprobada' ? 'aprobada' : 'rechazada'}`,
    mensaje: `Tu solicitud de ${tipo} ha sido ${estado === 'aprobada' ? 'aprobada' : 'rechazada'} por el administrador.`,
    tipo: "solicitud_ausencia_respuesta",
    leida: false,
    fecha: admin.firestore.FieldValue.serverTimestamp(),
    solicitud_id: event.params.solicitudId,
    empresaId: empresaId,
  });

  const tokens = await obtenerTokensPush([usuario_id]);
  await enviarPushNotification(tokens, 'Solicitud Actualizada', `Tu solicitud de ${tipo} ha sido ${estado}`, {
    tipo: 'solicitud_ausencia_respuesta',
    estado: estado
  });
});

exports.onCitaPsicologoCreada = onDocumentCreated("usuarios/{uid}/citas/{citaId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const cita = snapshot.data();
  const citaId = event.params.citaId;
  const { especialista, fecha, horario, usuario_nombre } = cita;

  const psicologoSnapshot = await admin.firestore().collection("usuarios")
    .where("nombre", "==", especialista)
    .where("rol", "==", "psicologo")
    .get();

  if (psicologoSnapshot.empty) return;

  const psicologoId = psicologoSnapshot.docs[0].id;

  const notifId = `cita_psicologo_${citaId}`;
  const docRef = admin.firestore().collection("notificaciones").doc(notifId);
  await docRef.set({
    id: notifId,
    usuario_id: psicologoId,
    titulo: `Nueva cita agendada`,
    mensaje: `${usuario_nombre} agendó una cita contigo para el ${fecha} a las ${horario}`,
    tipo: "cita_psicologo",
    leida: false,
    fecha: admin.firestore.FieldValue.serverTimestamp(),
    cita_id: citaId,
  });

  const tokens = await obtenerTokensPush([psicologoId]);
  await enviarPushNotification(tokens, 'Nueva Cita', `${usuario_nombre} agendó una cita`, {
    tipo: 'cita_psicologo',
    citaId: citaId
  });
});
