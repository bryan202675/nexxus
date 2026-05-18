/**
 * Documentacion Nexxus - nexxus/app/src/presentation/components/MarcaNexxus.tsx
 * Capa: presentacion.
 * Proposito: Componente reutilizable de interfaz. Encapsula una pieza visual o interactiva para mantener consistencia entre pantallas.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React desde React; habilita componentes, hooks y tipos base para esta pieza.
import React from 'react';
// Importa { View, Text, StyleSheet } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { View, Text, StyleSheet } from 'react-native';
// Importa { COLORES }; reutiliza tokens visuales y constantes comunes del sistema de diseno.
import { COLORES } from '@/shared/constants/diseno';

/**
 * Define el contrato de datos Props; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface Props {
  tamano?: number;
}

/**
 * Componente MarcaNexxus. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function MarcaNexxus({ tamano = 32 }: Props) {
  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
    <View style={estilos.contenedor}>
      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
      <Text style={[estilos.logoN, { fontSize: tamano }]}>N</Text>
      {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
      <Text style={[estilos.nombre, { fontSize: tamano }]}>exxus</Text>
    </View>
  );
}

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // contenedor: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  contenedor: {
    // flexDirection decide si los hijos se ordenan en fila o columna.
    flexDirection: 'row',
    // alignItems alinea los hijos en el eje transversal del contenedor.
    alignItems: 'center',
  },
  // logoN: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  logoN: {
    // fontWeight define el peso visual del texto.
    fontWeight: '900',
    // color define el color del texto o icono.
    color: COLORES.primario,
  },
  // nombre: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  nombre: {
    // fontWeight define el peso visual del texto.
    fontWeight: '700',
    // color define el color del texto o icono.
    color: COLORES.texto,
  },
});
