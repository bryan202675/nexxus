/**
 * Documentacion Nexxus - nexxus/app/src/types/declarations.d.ts
 * Capa: app.
 * Proposito: Modulo declarations.d. Agrupa logica, tipos o configuracion usados por la app Nexxus.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

declare module 'react-native-web' {
  // Declara unstable_createElement; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  export const unstable_createElement: any;
}

declare module '*.css';
