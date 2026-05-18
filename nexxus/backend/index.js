/**
 * Documentacion Nexxus - nexxus/backend/index.js
 * Capa: backend.
 * Proposito: Backend Firebase Functions. Expone acciones seguras del servidor, valida permisos y escribe datos administrativos en Firebase.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { onCall, HttpsError } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
const { onCall, HttpsError } = require("firebase-functions/v2/https");
// Importa admin desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
const admin = require("firebase-admin");

// Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
if (!admin.apps.length) {
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  admin.initializeApp();
}

/**
 * crearEmpresaAdmin: Funcion callable invocada desde la app. Valida contexto, consulta o escribe Firebase y devuelve solo la informacion que la UI necesita.
 */
exports.crearEmpresaAdmin = onCall({ cors: true }, async (request) => {
  // Declara { nombreEmpresa, nombreAdmin, correoAdmin, contrasenaAdmin, giroActividad, tamanoEquipo }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { nombreEmpresa, nombreAdmin, correoAdmin, contrasenaAdmin, giroActividad, tamanoEquipo } = request.data;
  
  // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
  try {
    // Declara userRecord; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const userRecord = await admin.auth().createUser({
      email: correoAdmin,
      password: contrasenaAdmin,
      displayName: nombreAdmin,
    });

    // Generar un código de acceso de empresa único (ej. NEX-4927)
    let codigo = '';
    // Declara unico; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let unico = false;
    // Declara prefix; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const prefix = (nombreEmpresa || 'EMP').replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'EMP';
    // Declara attempts; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let attempts = 0;
    // Repite el bloque hasta cumplir la condicion; se usa para buscar o construir un valor valido.
    while (!unico && attempts < 10) {
      // Declara num; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const num = Math.floor(1000 + Math.random() * 9000);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      codigo = `${prefix}-${num}`;
      // Prepara dup; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
      const dup = await admin.firestore().collection('empresas').where('codigo', '==', codigo).get();
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (dup.empty) {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        unico = true;
      }
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      attempts++;
    }

    // Prepara empresaRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const empresaRef = admin.firestore().collection('empresas').doc();
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await empresaRef.set({
      id: empresaRef.id,
      nombre: nombreEmpresa,
      codigo: codigo || `${prefix}-1111`,
      giro: giroActividad || '',
      tamanoEquipo: tamanoEquipo || '',
      adminId: userRecord.uid,
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
      estado_activo: true
    });

    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
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

    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await admin.firestore().collection('logs').add({
      empresa_id: empresaRef.id,
      usuario_id: userRecord.uid,
      accion: 'CREAR_EMPRESA_ADMIN',
      modulo: 'AUTH',
      fecha: admin.firestore.FieldValue.serverTimestamp()
    });

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return { success: true, empresaId: empresaRef.id };
  } catch (error) {
    // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
    throw new HttpsError("internal", "Error interno al crear la empresa: " + error.message);
  }
});

/**
 * crearUsuarioEmpresa: Funcion callable invocada desde la app. Valida contexto, consulta o escribe Firebase y devuelve solo la informacion que la UI necesita.
 */
exports.crearUsuarioEmpresa = onCall({ cors: true }, async (request) => {
  // Declara { auth, data }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { auth, data } = request;

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!auth) {
    // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
    throw new HttpsError('unauthenticated', 'Usuario no autenticado.');
  }
  
  // Prepara callerDoc; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const callerDoc = await admin.firestore().collection('usuarios').doc(auth.uid).get();
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!callerDoc.exists) {
    // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
    throw new HttpsError('permission-denied', 'No se encontró el usuario.');
  }

  // Declara callerData; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const callerData = callerDoc.data();
  // Declara rolCaller; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const rolCaller = String(callerData.rol || '').toLowerCase();
  // Declara modulosCaller; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const modulosCaller = Array.isArray(callerData.permisos?.modulos) ? callerData.permisos.modulos : [];
  // Declara puedeCrearUsuarios; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const puedeCrearUsuarios = rolCaller === 'admin' || modulosCaller.includes('admin') || modulosCaller.includes('plantilla');
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!puedeCrearUsuarios) {
    // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
    throw new HttpsError('permission-denied', 'Solo los administradores pueden crear usuarios.');
  }

  // Declara { nombre, correo, contrasena, rol, departamento_id, empleado }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { nombre, correo, contrasena, rol, departamento_id, empleado } = data;
  // Declara empresa_id; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const empresa_id = callerData.empresa_id || callerData.empresaId;

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!empresa_id) {
    // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
    throw new HttpsError('failed-precondition', 'El administrador no tiene empresa asignada.');
  }

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!nombre || !correo || !contrasena || !rol) {
    // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
    throw new HttpsError('invalid-argument', 'Nombre, correo, contraseña y rol son obligatorios.');
  }

  // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
  try {
    // Declara userRecord; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const userRecord = await admin.auth().createUser({
      email: correo,
      password: contrasena,
      displayName: nombre,
    });

    // Declara datosEmpleado; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const datosEmpleado = empleado && typeof empleado === 'object' ? empleado : {};
    // Declara departamentoNombre; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const departamentoNombre = datosEmpleado.departamento || departamento_id || 'General';

    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
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

    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await admin.firestore().collection('logs').add({
      empresa_id: empresa_id,
      empresaId: empresa_id,
      usuario_id: auth.uid,
      accion: 'CREAR_USUARIO',
      modulo: 'AUTH',
      detalles: userRecord.uid,
      fecha: admin.firestore.FieldValue.serverTimestamp()
    });

    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
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

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return { success: true, uid: userRecord.uid };
  } catch (error) {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (error.code === 'auth/email-already-exists') {
      // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
      throw new HttpsError('already-exists', 'Ya existe un usuario con ese correo.');
    }
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (error.code === 'auth/invalid-password') {
      // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
      throw new HttpsError('invalid-argument', 'La contraseña no cumple los requisitos mínimos.');
    }
    // Interrumpe el flujo con un error controlado para que la capa superior lo maneje.
    throw new HttpsError("internal", "Error al crear el usuario: " + error.message);
  }
});

// Importa { onDocumentCreated, onDocumentUpdated } desde Firebase; habilita autenticacion, Firestore, Storage, Functions o mensajeria segun el modulo.
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");

/**
 * Declaracion obtenerTokensPush. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
async function obtenerTokensPush(usuariosIds) {
  // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
  try {
    // Prepara tokensQuery; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const tokensQuery = admin.firestore().collection('push_tokens')
      .where('usuario_id', 'in', usuariosIds.slice(0, 10))
      .where('activo', '==', true);
    
    // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const snapshot = await tokensQuery.get();
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return snapshot.docs.map(doc => doc.data().token);
  } catch (error) {
    // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
    console.error('Error al obtener tokens:', error);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return [];
  }
}

/**
 * Declaracion enviarPushNotification. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
async function enviarPushNotification(tokens, titulo, cuerpo, datos = {}) {
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!tokens || tokens.length === 0) return;

  // Calcula mensajes; transforma la lista original en datos listos para renderizar o guardar.
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

  // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
  try {
    // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
    await Promise.all(
      mensajes.map(mensaje => admin.messaging().send(mensaje))
    );
    // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
    console.log(`${mensajes.length} notificaciones push enviadas`);
  } catch (error) {
    // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
    console.error('Error al enviar push notifications:', error);
  }
}

/**
 * onAnuncioCreado: Trigger Firestore al crear documento. Valida contexto, consulta o escribe Firebase y devuelve solo la informacion que la UI necesita.
 */
exports.onAnuncioCreado = onDocumentCreated("anuncios/{anuncioId}", async (event) => {
  // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const snapshot = event.data;
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!snapshot) return;

  // Declara anuncio; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const anuncio = snapshot.data();
  // Declara anuncioId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const anuncioId = event.params.anuncioId;
  // Declara { titulo, contenido, tipo, destinatarios, empresaId, empresa_id, adminId }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { titulo, contenido, tipo, destinatarios, empresaId, empresa_id, adminId } = anuncio;
  // Declara targetEmpresaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const targetEmpresaId = empresaId || empresa_id;
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!targetEmpresaId) return;

  // Declara usuariosIds; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  let usuariosIds = [];

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (tipo === "global" || tipo === "empresa") {
    // Prepara snapshotUsuarios; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const snapshotUsuarios = await admin.firestore().collection("usuarios")
      .where("empresaId", "==", targetEmpresaId)
      .get();
    
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    snapshotUsuarios.forEach(doc => {
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (doc.id !== adminId) {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        usuariosIds.push(doc.id);
      }
    });
  } else if (tipo === "privado" && Array.isArray(destinatarios)) {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    usuariosIds = destinatarios;
  }

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (usuariosIds.length === 0) return;

  // Declara loteNotificaciones; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const loteNotificaciones = admin.firestore().batch();
  // Declara ahora; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const ahora = admin.firestore.FieldValue.serverTimestamp();

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  usuariosIds.forEach(uid => {
    // Declara notifId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const notifId = `anuncio_${uid}_${anuncioId}`;
    // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const docRef = admin.firestore().collection("notificaciones").doc(notifId);
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
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

  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
  await loteNotificaciones.commit();

  // Declara tokens; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const tokens = await obtenerTokensPush(usuariosIds);
  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
  await enviarPushNotification(tokens, 'Nuevo Anuncio', titulo, {
    tipo: 'anuncio',
    anuncioId: anuncioId,
    empresaId: targetEmpresaId
  });

  // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
  try {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (tipo === "global") {
       // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
       await admin.messaging().send({
          topic: `anuncios_${targetEmpresaId}`,
          notification: { title: titulo, body: contenido }
       });
    }
  } catch (error) {
    // Registra informacion de diagnostico para entender errores o eventos durante desarrollo/operacion.
    console.error("Error FCM:", error);
  }
});

/**
 * onTareaCreada: Trigger Firestore al crear documento. Valida contexto, consulta o escribe Firebase y devuelve solo la informacion que la UI necesita.
 */
exports.onTareaCreada = onDocumentCreated("tareas/{tareaId}", async (event) => {
  // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const snapshot = event.data;
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!snapshot) return;

  // Declara tarea; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const tarea = snapshot.data();
  // Declara tareaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const tareaId = event.params.tareaId;
  // Declara { titulo, descripcion, asignado_a, asignado_por_nombre, empresaId }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { titulo, descripcion, asignado_a, asignado_por_nombre, empresaId } = tarea;

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!asignado_a) return;

  // Declara notifId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const notifId = `tarea_creada_${tareaId}`;
  // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const docRef = admin.firestore().collection("notificaciones").doc(notifId);
  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
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

  // Declara tokens; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const tokens = await obtenerTokensPush([asignado_a]);
  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
  await enviarPushNotification(tokens, 'Nueva Tarea', `${asignado_por_nombre || 'Tu jefe'} te asignó: "${titulo}"`, {
    tipo: 'tarea',
    tareaId: tareaId,
    empresaId: empresaId || ''
  });
});

/**
 * onTareaActualizada: Trigger Firestore al actualizar documento. Valida contexto, consulta o escribe Firebase y devuelve solo la informacion que la UI necesita.
 */
exports.onTareaActualizada = onDocumentUpdated("tareas/{tareaId}", async (event) => {
  // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const snapshot = event.data;
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!snapshot) return;

  // Declara before; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const before = snapshot.before.data();
  // Declara after; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const after = snapshot.after.data();
  // Declara tareaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const tareaId = event.params.tareaId;

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (after.estado === 'completada') return;

  // Declara huboCambios; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const huboCambios = 
    before.titulo !== after.titulo || 
    before.descripcion !== after.descripcion || 
    before.prioridad !== after.prioridad;

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!huboCambios) return;

  // Declara { asignado_a, empresaId, titulo }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { asignado_a, empresaId, titulo } = after;
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!asignado_a) return;

  // Declara notifId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const notifId = `tarea_modificada_${tareaId}`;
  // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const docRef = admin.firestore().collection("notificaciones").doc(notifId);
  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
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

  // Declara tokens; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const tokens = await obtenerTokensPush([asignado_a]);
  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
  await enviarPushNotification(tokens, 'Tarea Actualizada', `La tarea "${titulo}" ha sido modificada`, {
    tipo: 'tarea_modificada',
    tareaId: tareaId,
    empresaId: empresaId || ''
  });
});

/**
 * onSolicitudAusenciaCreada: Trigger Firestore al crear documento. Valida contexto, consulta o escribe Firebase y devuelve solo la informacion que la UI necesita.
 */
exports.onSolicitudAusenciaCreada = onDocumentCreated("solicitudes_ausencia/{solicitudId}", async (event) => {
  // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const snapshot = event.data;
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!snapshot) return;

  // Declara solicitud; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const solicitud = snapshot.data();
  // Declara solicitudId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const solicitudId = event.params.solicitudId;
  // Declara { usuario_id, usuario_nombre, tipo, fecha_inicio, fecha_fin, empresaId }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { usuario_id, usuario_nombre, tipo, fecha_inicio, fecha_fin, empresaId } = solicitud;

  // Prepara adminSnapshot; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const adminSnapshot = await admin.firestore().collection("usuarios")
    .where("empresaId", "==", empresaId)
    .where("rol", "==", "admin")
    .get();

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (adminSnapshot.empty) return;

  // Declara loteNotificaciones; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const loteNotificaciones = admin.firestore().batch();
  // Declara ahora; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const ahora = admin.firestore.FieldValue.serverTimestamp();

  // Declara adminsIds; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const adminsIds = [];
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  adminSnapshot.forEach(doc => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    adminsIds.push(doc.id);
    // Declara notifId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const notifId = `solicitud_${doc.id}_${solicitudId}`;
    // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
    const docRef = admin.firestore().collection("notificaciones").doc(notifId);
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
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

  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
  await loteNotificaciones.commit();

  // Declara tokens; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const tokens = await obtenerTokensPush(adminsIds);
  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
  await enviarPushNotification(tokens, 'Nueva Solicitud', `${usuario_nombre} solicitó ${tipo}`, {
    tipo: 'solicitud_ausencia',
    solicitudId: solicitudId,
    empresaId: empresaId
  });
});

/**
 * onSolicitudAusenciaActualizada: Trigger Firestore al actualizar documento. Valida contexto, consulta o escribe Firebase y devuelve solo la informacion que la UI necesita.
 */
exports.onSolicitudAusenciaActualizada = onDocumentUpdated("solicitudes_ausencia/{solicitudId}", async (event) => {
  // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const snapshot = event.data;
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!snapshot) return;

  // Declara before; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const before = snapshot.before.data();
  // Declara after; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const after = snapshot.after.data();

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (before.estado === after.estado) return;

  // Declara { usuario_id, usuario_nombre, tipo, estado, empresaId }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { usuario_id, usuario_nombre, tipo, estado, empresaId } = after;

  // Declara notifId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const notifId = `solicitud_resp_${event.params.solicitudId}`;
  // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const docRef = admin.firestore().collection("notificaciones").doc(notifId);
  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
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

  // Declara tokens; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const tokens = await obtenerTokensPush([usuario_id]);
  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
  await enviarPushNotification(tokens, 'Solicitud Actualizada', `Tu solicitud de ${tipo} ha sido ${estado}`, {
    tipo: 'solicitud_ausencia_respuesta',
    estado: estado
  });
});

/**
 * onCitaPsicologoCreada: Trigger Firestore al crear documento. Valida contexto, consulta o escribe Firebase y devuelve solo la informacion que la UI necesita.
 */
exports.onCitaPsicologoCreada = onDocumentCreated("usuarios/{uid}/citas/{citaId}", async (event) => {
  // Declara snapshot; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const snapshot = event.data;
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!snapshot) return;

  // Declara cita; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const cita = snapshot.data();
  // Declara citaId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const citaId = event.params.citaId;
  // Declara { especialista, fecha, horario, usuario_nombre }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { especialista, fecha, horario, usuario_nombre } = cita;

  // Prepara psicologoSnapshot; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const psicologoSnapshot = await admin.firestore().collection("usuarios")
    .where("nombre", "==", especialista)
    .where("rol", "==", "psicologo")
    .get();

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (psicologoSnapshot.empty) return;

  // Declara psicologoId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const psicologoId = psicologoSnapshot.docs[0].id;

  // Declara notifId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const notifId = `cita_psicologo_${citaId}`;
  // Prepara docRef; construye la referencia o consulta Firebase que se usara para leer/escribir datos.
  const docRef = admin.firestore().collection("notificaciones").doc(notifId);
  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
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

  // Declara tokens; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const tokens = await obtenerTokensPush([psicologoId]);
  // Ejecuta una operacion asincrona; normalmente lee, escribe o sincroniza datos antes de continuar.
  await enviarPushNotification(tokens, 'Nueva Cita', `${usuario_nombre} agendó una cita`, {
    tipo: 'cita_psicologo',
    citaId: citaId
  });
});
