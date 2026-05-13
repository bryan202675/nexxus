import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORES } from '@/shared/constants/diseno';

interface Props {
  tamano?: number;
}

export default function MarcaNexxus({ tamano = 32 }: Props) {
  return (
    <View style={estilos.contenedor}>
      <Text style={[estilos.logoN, { fontSize: tamano }]}>N</Text>
      <Text style={[estilos.nombre, { fontSize: tamano }]}>exxus</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoN: {
    fontWeight: '900',
    color: COLORES.primario,
  },
  nombre: {
    fontWeight: '700',
    color: COLORES.texto,
  },
});
