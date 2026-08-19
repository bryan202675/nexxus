// Convierte el layout+path semántico de una ruta (ej. "/admin" + "empresa-resumen") en un
// segmento de URL opaco y estable (ej. "/admin/7c3a1f2b"), para que la barra de direcciones no
// describa en texto plano qué módulo se está viendo. FNV-1a: determinista (mismo input -> mismo
// código siempre, sin necesidad de mantener un mapa a mano) y sin dependencias -- no es
// criptografía, solo evita que la ruta "hable" por sí sola.
function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function routeSegment(layout: string, path: string): string {
  return fnv1a(`${layout}/${path}`).toString(16).padStart(8, "0");
}

export function routeUrl(layout: string, path: string): string {
  return `${layout}/${routeSegment(layout, path)}`;
}
