/**
 * Documentacion Nexxus - nexxus/app/metro.config.js
 * Capa: app.
 * Proposito: Modulo metro.config. Agrupa logica, tipos o configuracion usados por la app Nexxus.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { getDefaultConfig } desde expo/metro-config; agrega una dependencia externa necesaria para este modulo.
const { getDefaultConfig } = require('expo/metro-config');
// Importa path; usa utilidades de Node necesarias para scripts o configuracion local.
const path = require('path');

/**
 * Configuracion config. Reune valores que otras piezas consumen para evitar duplicacion y cambios dispersos.
 */
const config = getDefaultConfig(__dirname);

// Bloquear escaneo de carpetas fuera del frontend para mejorar rendimiento
config.resolver.blockList = [
  /\.\.\/backend\/.*/,
  /\.\.\/scripts\/.*/,
  /\.\.\/docs\/.*/,
  /\.\.\/config\/.*/,
];

// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
module.exports = config;
