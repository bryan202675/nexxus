import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ModoTemaMobile = 'oscuro' | 'claro';

const CLAVE_TEMA = '@nexxus_tema_mobile';

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

const ContextoTemaMobile = createContext<TemaMobile | null>(null);

export function ProveedorTemaMobile({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState<ModoTemaMobile>(() => (Appearance.getColorScheme() === 'light' ? 'claro' : 'oscuro'));

  useEffect(() => {
    AsyncStorage.getItem(CLAVE_TEMA)
      .then((guardado) => {
        if (guardado === 'oscuro' || guardado === 'claro') setModo(guardado);
      })
      .catch(() => undefined);
  }, []);

  const valor = useMemo<TemaMobile>(() => {
    const colores = paletas[modo];
    const cambiarModo = async (nuevoModo: ModoTemaMobile) => {
      setModo(nuevoModo);
      await AsyncStorage.setItem(CLAVE_TEMA, nuevoModo);
    };

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

  return <ContextoTemaMobile.Provider value={valor}>{children}</ContextoTemaMobile.Provider>;
}

export function useTemaMobile() {
  const contexto = useContext(ContextoTemaMobile);
  if (!contexto) throw new Error('useTemaMobile debe usarse dentro de ProveedorTemaMobile');
  return contexto;
}
