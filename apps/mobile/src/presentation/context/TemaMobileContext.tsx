/**
 * Documentacion Nexxus - apps/mobile/src/presentation/context/TemaMobileContext.tsx
 * Capa: presentacion.
 * Proposito: Contexto de React. Agrupa estado compartido, suscripciones y acciones para que las pantallas no consulten datos de forma aislada.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
// Importa { Appearance } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { Appearance } from 'react-native';
// Importa AsyncStorage desde @react-native-async-storage/async-storage; agrega una dependencia externa necesaria para este modulo.
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Describe la forma tipada ModoTemaMobile; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
export type ModoTemaMobile = 'oscuro' | 'claro';

/**
 * Componente CLAVE_TEMA. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const CLAVE_TEMA = '@nexxus_tema_mobile';

/**
 * Define el contrato de datos TemaMobile; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface TemaMobile {
  modo: ModoTemaMobile;
  esOscuro: boolean;
  cambiarModo: (modo: ModoTemaMobile) => Promise<void>;
  alternarModo: () => Promise<void>;
  colores: {
    fondo: string;
    fondoProfundo: string;
    texto: string;
    textoSecundario: string;
    textoSuave: string;
    vidrio: string;
    vidrioFuerte: string;
    borde: string;
    bordeFuerte: string;
    sombra: string;
    primario: string;
    primarioClaro: string;
    secundario: string;
  };
  blurTint: 'dark' | 'light';
  intensidadBlur: number;
  gradienteFondo: readonly [string, string, string];
}

/**
 * Declaracion paletas. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const paletas = {
  oscuro: {
    fondo: '#070712',
    fondoProfundo: '#02030A',
    texto: '#F8FAFF',
    textoSecundario: 'rgba(232,238,255,0.72)',
    textoSuave: 'rgba(232,238,255,0.48)',
    vidrio: 'rgba(255,255,255,0.075)',
    vidrioFuerte: 'rgba(255,255,255,0.13)',
    borde: 'rgba(255,255,255,0.12)',
    bordeFuerte: 'rgba(255,255,255,0.2)',
    sombra: '#0F0A2A',
    primario: '#7C3AED',
    primarioClaro: '#A78BFA',
    secundario: '#38BDF8',
  },
  claro: {
    fondo: '#EEF2FF',
    fondoProfundo: '#F8FAFF',
    texto: '#111827',
    textoSecundario: 'rgba(15,23,42,0.68)',
    textoSuave: 'rgba(15,23,42,0.48)',
    vidrio: 'rgba(255,255,255,0.58)',
    vidrioFuerte: 'rgba(255,255,255,0.78)',
    borde: 'rgba(92,70,180,0.16)',
    bordeFuerte: 'rgba(92,70,180,0.26)',
    sombra: '#7C65D1',
    primario: '#6D28D9',
    primarioClaro: '#8B5CF6',
    secundario: '#2563EB',
  },
} as const;

/**
 * Componente ContextoTemaMobile. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const ContextoTemaMobile = createContext<TemaMobile | null>(null);

/**
 * Componente ProveedorTemaMobile. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export function ProveedorTemaMobile({ children }: { children: ReactNode }) {
  // Inicializa [modo, setModo]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [modo, setModo] = useState<ModoTemaMobile>(() => (Appearance.getColorScheme() === 'light' ? 'claro' : 'oscuro'));

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    AsyncStorage.getItem(CLAVE_TEMA)
      .then((guardado) => {
        // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
        if (guardado === 'oscuro' || guardado === 'claro') setModo(guardado);
      })
      .catch(() => undefined);
  }, []);

  // Inicializa valor; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const valor = useMemo<TemaMobile>(() => {
    // Declara colores; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const colores = paletas[modo];
    // Declara cambiarModo; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const cambiarModo = async (nuevoModo: ModoTemaMobile) => {
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setModo(nuevoModo);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      await AsyncStorage.setItem(CLAVE_TEMA, nuevoModo);
    };

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return {
      modo,
      esOscuro: modo === 'oscuro',
      cambiarModo,
      alternarModo: () => cambiarModo(modo === 'oscuro' ? 'claro' : 'oscuro'),
      colores,
      blurTint: modo === 'oscuro' ? 'dark' : 'light',
      intensidadBlur: modo === 'oscuro' ? 24 : 34,
      gradienteFondo: modo === 'oscuro'
        ? ['#070712', '#11102A', '#02030A']
        : ['#F8FAFF', '#EEF2FF', '#E0E7FF'],
    };
  }, [modo]);

  // Devuelve el JSX que React Native renderiza en pantalla.
  return <ContextoTemaMobile.Provider value={valor}>{children}</ContextoTemaMobile.Provider>;
}

/**
 * Hook useTemaMobile. Expone estado derivado y acciones reutilizables para componentes React.
 */
export function useTemaMobile() {
  // Inicializa contexto; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const contexto = useContext(ContextoTemaMobile);
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!contexto) throw new Error('useTemaMobile debe usarse dentro de ProveedorTemaMobile');
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return contexto;
}
