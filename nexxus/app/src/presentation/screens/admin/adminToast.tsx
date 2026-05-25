/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/admin/adminToast.tsx
 * Capa: presentacion.
 * Proposito: Pantalla o utilidad del panel administrativo. Coordina datos empresariales reales y los presenta para decisiones de gestion.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { createContext, useCallback, useContext, useEffect, useMemo } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
// Importa { Alert, Platform } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { Alert, Platform } from 'react-native';
// Importa type { SileoOptions, SileoState } desde sileo; agrega una dependencia externa necesaria para este modulo.
import type { SileoOptions, SileoState } from 'sileo';
// Importa { useAdminAppearance }; reutiliza codigo local de Nexxus para evitar duplicar logica o estilos.
import { useAdminAppearance } from './adminTheme';

/**
 * Describe la forma tipada SileoModule; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type SileoModule = typeof import('sileo');

/**
 * Declaracion sileoModule. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
let sileoModule: SileoModule | null = null;

/**
 * Declaracion getSileoModule. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const getSileoModule = () => {
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (Platform.OS !== 'web') return null;
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!sileoModule) {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    sileoModule = require('sileo');
  }
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return sileoModule;
};

/**
 * Describe la forma tipada AdminToastKind; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type AdminToastKind = 'success' | 'error' | 'warning' | 'info';

/**
 * Describe la forma tipada AdminToastPayload; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type AdminToastPayload = {
  title: string;
  description?: string;
  duration?: number;
};

/**
 * Describe la forma tipada AdminToastContextValue; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type AdminToastContextValue = {
  notify: (kind: AdminToastKind, payload: AdminToastPayload) => void;
  success: (payload: AdminToastPayload) => void;
  error: (payload: AdminToastPayload) => void;
  warning: (payload: AdminToastPayload) => void;
  info: (payload: AdminToastPayload) => void;
};

/**
 * Componente AdminToastContext. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const AdminToastContext = createContext<AdminToastContextValue>({
  notify: (_kind, payload) => Alert.alert(payload.title, payload.description),
  success: (payload) => Alert.alert(payload.title, payload.description),
  error: (payload) => Alert.alert(payload.title, payload.description),
  warning: (payload) => Alert.alert(payload.title, payload.description),
  info: (payload) => Alert.alert(payload.title, payload.description),
});

/**
 * Componente ADMIN_TOAST_CSS. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const ADMIN_TOAST_CSS = `
[data-sileo-header] {
  align-items: center !important;
  min-height: 34px !important;
  height: auto !important;
  padding: 8px 14px 6px !important;
}
[data-sileo-header-stack],
[data-sileo-header-inner] {
  align-items: center !important;
  min-height: 20px !important;
  height: auto !important;
}
[data-sileo-badge] {
  transform: none !important;
}
.nx-admin-toast-title {
  font-family: Avenir Next, Satoshi, Segoe UI, sans-serif !important;
  font-size: 12.5px !important;
  line-height: 14px !important;
  font-weight: 700 !important;
  letter-spacing: 0 !important;
  text-transform: none !important;
  display: inline-flex !important;
  align-items: center !important;
  min-height: 18px !important;
  height: auto !important;
  padding: 0 !important;
  overflow: visible !important;
  transform: none !important;
}
[data-sileo-title] {
  line-height: 14px !important;
  overflow: visible !important;
  display: flex !important;
  align-items: center !important;
}
.nx-admin-toast-description {
  font-family: Avenir Next, Satoshi, Segoe UI, sans-serif !important;
  font-size: 12px !important;
  line-height: 17px !important;
  letter-spacing: 0 !important;
  box-sizing: border-box !important;
  padding: 4px 14px 12px !important;
  min-height: 30px !important;
  overflow: visible !important;
}
.nx-admin-toast-button {
  font-family: Avenir Next, Satoshi, Segoe UI, sans-serif !important;
  font-weight: 700 !important;
}
html[data-nexxus-admin-theme="dark"] [data-sileo-toast] {
  filter: drop-shadow(0 18px 38px rgba(0, 0, 0, 0.36));
}
html[data-nexxus-admin-theme="dark"] .nx-admin-toast-title {
  color: #F8FBFF !important;
}
html[data-nexxus-admin-theme="dark"] .nx-admin-toast-description {
  color: rgba(248, 251, 255, 0.70) !important;
}
html[data-nexxus-admin-theme="light"] [data-sileo-toast] {
  filter: drop-shadow(0 18px 34px rgba(65, 45, 120, 0.16));
}
html[data-nexxus-admin-theme="light"] .nx-admin-toast-title {
  color: #17122B !important;
}
html[data-nexxus-admin-theme="light"] .nx-admin-toast-description {
  color: rgba(23, 18, 43, 0.66) !important;
}
`;

/**
 * Declaracion stateFor. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const stateFor = (kind: AdminToastKind): SileoState => kind;

/**
 * Componente AdminToastProvider. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  // Inicializa { theme }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme } = useAdminAppearance();

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (document.getElementById('nx-admin-toast-css')) return;
    // Declara style; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const style = document.createElement('style');
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    style.id = 'nx-admin-toast-css';
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    style.textContent = ADMIN_TOAST_CSS;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    document.head.appendChild(style);
  }, []);

  // Inicializa notify; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const notify = useCallback<AdminToastContextValue['notify']>((kind, payload) => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (Platform.OS !== 'web') {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      Alert.alert(payload.title, payload.description);
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return;
    }

    // Declara options; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const options: SileoOptions = {
      title: payload.title,
      description: payload.description,
      type: stateFor(kind),
      duration: payload.duration ?? (kind === 'error' ? 7200 : 5200),
      fill: theme.isDark ? 'rgba(15, 11, 34, 0.96)' : 'rgba(255, 255, 255, 0.98)',
      roundness: 14,
      styles: {
        title: 'nx-admin-toast-title',
        description: 'nx-admin-toast-description',
        button: 'nx-admin-toast-button',
      },
    };

    // Declara module; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const module = getSileoModule();
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!module) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      Alert.alert(payload.title, payload.description);
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return;
    }

    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    module.sileo[kind](options);
  }, [theme.isDark]);

  // Inicializa value; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const value = useMemo<AdminToastContextValue>(() => ({
    notify,
    success: (payload) => notify('success', payload),
    error: (payload) => notify('error', payload),
    warning: (payload) => notify('warning', payload),
    info: (payload) => notify('info', payload),
  }), [notify]);

  // Declara SileoToaster; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const SileoToaster = Platform.OS === 'web' ? getSileoModule()?.Toaster : null;

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Proveedor de contexto; entrega estado o servicios compartidos a sus componentes hijos.
    <AdminToastContext.Provider value={value}>
      {children}
      {SileoToaster ? (
        // SileoToaster renderiza una pieza visual reutilizable dentro de esta pantalla.
        <SileoToaster
          position="top-right"
          offset={{ top: 96, right: 24 }}
          theme={theme.isDark ? 'dark' : 'light'}
          options={{
            fill: theme.isDark ? 'rgba(15, 11, 34, 0.96)' : 'rgba(255, 255, 255, 0.98)',
            roundness: 14,
            styles: {
              title: 'nx-admin-toast-title',
              description: 'nx-admin-toast-description',
              button: 'nx-admin-toast-button',
            },
          }}
        />
      ) : null}
    </AdminToastContext.Provider>
  );
}

/**
 * Hook useAdminToast. Expone estado derivado y acciones reutilizables para componentes React.
 */
export const useAdminToast = () => useContext(AdminToastContext);
