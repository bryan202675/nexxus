/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/gestionPlantillaHelpers.ts
 * Capa: presentacion.
 * Proposito: Helpers puros de fecha/normalizacion/importacion CSV de empleados, extraidos de GestionPlantilla.tsx.
 * Dependencias clave: SedeCatalogo/FilaImportacionEmpleado (gestionPlantillaTypes).
 * Consideracion de mantenimiento: preservar las firmas exportadas, las consumen GestionPlantilla y sus subcomponentes.
 */

import { SedeCatalogo, FilaImportacionEmpleado } from './gestionPlantillaTypes';

/**
 * Declaracion obtenerFecha. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const obtenerFecha = (valor: any): Date | null => {
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!valor) return null;
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (typeof valor?.toDate === 'function') return valor.toDate();
  // Calcula fecha; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const fecha = new Date(valor);
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

/**
 * Declaracion mismoDia. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const mismoDia = (fecha: Date | null) => {
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!fecha) return false;
  // Calcula hoy; normaliza fechas para comparaciones, filtros o etiquetas visibles.
  const hoy = new Date();
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth() && fecha.getDate() === hoy.getDate();
};

/**
 * Declaracion porcentaje. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const porcentaje = (valor: number, total: number) => total > 0 ? Math.round((valor / total) * 100) : 0;
/**
 * Declaracion normalizarSalarioUSD. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const normalizarSalarioUSD = (valor: string) => valor.replace(/[^\d.,]/g, '').split(/[.,]/)[0].replace(/\D/g, '');
export const COLUMNAS_IMPORTACION_EMPLEADOS = ['nombre_completo', 'usuario', 'password', 'cargo', 'departamento', 'sede', 'telefono', 'salario_base', 'rol_operativo', 'jefe_usuario'];
export const EJEMPLO_IMPORTACION_EMPLEADOS_BASE = ['Juan Pérez', 'juan.perez', '123456', 'EMPLEADO', 'GENERAL', '', '+50377777777', '365', 'EMPLEADO', 'SIN_JEFE'];
export const normalizarCodigoImportacion = (valor: any) => String(valor || '').trim().toUpperCase();
export const normalizarUsuarioImportacion = (valor: any) => String(valor || '').trim().toLowerCase();
export const normalizarCatalogoImportacion = (valor: any) => String(valor || '').trim().toLowerCase();
export const escaparCsv = (valor: any) => `"${String(valor ?? '').replace(/"/g, '""')}"`;
export const crearPasswordTemporalImportacion = () => `Nx${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
export const crearCsvPlantillaEmpleados = (sedes: SedeCatalogo[] = []) => {
  const sedesActivas = sedes.filter((sede) => sede.id !== 'global' && sede.nombre && sede.activo !== false && sede.activa !== false);
  const filas = sedesActivas.length
    ? sedesActivas.map((sede, indice) => {
      const usuario = (sede.nombre || `sede_${indice + 1}`).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.').replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
      return [`Empleado ${indice + 1}`, `empleado.${usuario || indice + 1}`, '123456', 'EMPLEADO', 'GENERAL', sede.nombre || '', '+50377777777', '365', 'EMPLEADO', 'SIN_JEFE'];
    })
    : [EJEMPLO_IMPORTACION_EMPLEADOS_BASE.map((valor, indice) => indice === 5 ? 'SEDE_CENTRAL' : valor)];
  return [
    COLUMNAS_IMPORTACION_EMPLEADOS.join(','),
    ...filas.map((fila) => fila.map(escaparCsv).join(',')),
  ].join('\n');
};
export const parsearCsvPlantillaEmpleados = (contenido: string) => {
  const filas: string[][] = [];
  let celda = '';
  let fila: string[] = [];
  let entreComillas = false;
  for (let i = 0; i < contenido.length; i++) {
    const char = contenido[i];
    const siguiente = contenido[i + 1];
    if (char === '"' && entreComillas && siguiente === '"') {
      celda += '"';
      i++;
    } else if (char === '"') {
      entreComillas = !entreComillas;
    } else if (char === ',' && !entreComillas) {
      fila.push(celda);
      celda = '';
    } else if ((char === '\n' || char === '\r') && !entreComillas) {
      if (char === '\r' && siguiente === '\n') i++;
      fila.push(celda);
      if (fila.some((valor) => valor.trim())) filas.push(fila);
      fila = [];
      celda = '';
    } else {
      celda += char;
    }
  }
  fila.push(celda);
  if (fila.some((valor) => valor.trim())) filas.push(fila);
  const encabezados = (filas.shift() || []).map((valor) => normalizarCodigoImportacion(valor).toLowerCase());
  return filas.map((valores) => Object.fromEntries(COLUMNAS_IMPORTACION_EMPLEADOS.map((columna) => {
    const indice = columna === 'sede'
      ? [encabezados.indexOf('sede'), encabezados.indexOf('sede_nombre'), encabezados.indexOf('sede_codigo')].find((valor) => valor >= 0) ?? -1
      : encabezados.indexOf(columna);
    return [columna, indice >= 0 ? String(valores[indice] || '').trim() : ''];
  })) as FilaImportacionEmpleado);
};
/**
 * Declaracion conTiempoLimite. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
export const conTiempoLimite = async <T,>(promesa: Promise<T>, milisegundos = 25000): Promise<T> => {
  // Declara temporizador; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  let temporizador: ReturnType<typeof setTimeout>;
  // Declara limite; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const limite = new Promise<T>((_, rechazar) => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    temporizador = setTimeout(() => rechazar(new Error('La operación tardó demasiado. Verifica tu conexión y vuelve a intentar.')), milisegundos);
  });
  // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
  try {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return await Promise.race([promesa, limite]);
  } finally {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    clearTimeout(temporizador!);
  }
};
