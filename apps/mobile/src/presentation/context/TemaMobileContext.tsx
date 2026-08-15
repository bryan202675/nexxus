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
import { TEMAS_MOVILES } from '@/shared/constants/diseno';

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
    // Escala unica de "vidrio esmerilado": de mas sutil (chips/micro-iconos) a mas
    // presente (modales/hero). Consumir SIEMPRE esta escala en vez de redefinir rgba
    // locales por pantalla -- esa duplicacion fue la causa raiz de que el glass se
    // viera con 3 tonalidades distintas cruzando pantallas (auditoria Fase R0).
    vidrioSutil: string;
    vidrio: string;
    vidrioFuerte: string;
    vidrioProfundo: string;
    borde: string;
    bordeSutil: string;
    bordeFuerte: string;
    bordeFocus: string;
    superficie: string;
    superficieElevada: string;
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
const paletas = TEMAS_MOVILES;

/**
 * Componente ContextoTemaMobile. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const ContextoTemaMobile = createContext<TemaMobile | null>(null);

/**
 * Componente ProveedorTemaMobile. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export function ProveedorTemaMobile({ children }: { children: ReactNode }) {
  // Inicializa [modo, setModo]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [modo, setModo] = useState<ModoTemaMobile>('oscuro');

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    AsyncStorage.getItem(CLAVE_TEMA)
      .then((guardado) => {
        // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
        if (guardado === 'oscuro' || guardado === 'claro') {
          setModo(guardado);
        }
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
      gradienteFondo: colores.gradienteFondo,
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
