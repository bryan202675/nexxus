/**
 * Documentacion Nexxus - nexxus/app/index.ts
 * Capa: app.
 * Proposito: Punto de entrada o barril de exportaciones. Conecta este modulo con el resto del proyecto.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { registerRootComponent } desde expo; agrega una dependencia externa necesaria para este modulo.
import { registerRootComponent } from 'expo';

// Importa App; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import App from './App';



// Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
registerRootComponent(App);
