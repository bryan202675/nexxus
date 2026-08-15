/**
 * EmptyState — estado vacio reutilizable (icono + texto + detalle opcional + accion
 * opcional). Reemplaza los bloques "sin datos" que cada pantalla dibujaba a mano.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
import BotonAnimado from '@/presentation/components/BotonAnimado';

type IconoFeather = React.ComponentProps<typeof Feather>['name'];

interface EmptyStateProps {
  icono: IconoFeather;
  titulo: string;
  detalle?: string;
  accionLabel?: string;
  onAccion?: () => void;
}

export default function EmptyState({ icono, titulo, detalle, accionLabel, onAccion }: EmptyStateProps) {
  const { colores, esOscuro } = useTemaMobile();

  return (
    <Animated.View entering={FadeIn.duration(300)} style={estilos.contenedor}>
      <View style={[estilos.iconoWrap, { backgroundColor: colores.vidrioSutil, borderColor: colores.borde }]}>
        <Feather name={icono} size={24} color={colores.textoSuave} />
      </View>
      <Text style={[estilos.titulo, { color: colores.texto }]}>{titulo}</Text>
      {detalle ? <Text style={[estilos.detalle, { color: colores.textoSuave }]}>{detalle}</Text> : null}
      {accionLabel && onAccion ? (
        <BotonAnimado
          style={[
            estilos.boton,
            { backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A' },
            SOMBRAS.suave,
          ]}
          onPress={onAccion}
          scaleTo={0.96}
        >
          <Text style={[estilos.botonTexto, { color: esOscuro ? '#0B0C1E' : '#FFFFFF' }]}>
            {accionLabel}
          </Text>
        </BotonAnimado>
      ) : null}
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ESPACIADO.xxl,
    paddingHorizontal: ESPACIADO.lg,
  },
  iconoWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: ESPACIADO.md,
  },
  titulo: {
    ...TIPOGRAFIA.leyenda,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  detalle: {
    ...TIPOGRAFIA.cuerpoPequeno,
    textAlign: 'center',
    marginTop: ESPACIADO.xs,
    maxWidth: 280,
    lineHeight: 18,
  },
  boton: {
    marginTop: ESPACIADO.lg,
    paddingHorizontal: ESPACIADO.xl,
    paddingVertical: 12,
    borderRadius: RADIOS.completo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonTexto: {
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: -0.1,
  },
});

