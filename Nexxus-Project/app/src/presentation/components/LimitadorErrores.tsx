import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';

interface Estado {
  hayError: boolean;
  mensaje: string;
  stack: string;
}

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class LimitadorErrores extends React.Component<Props, Estado> {
  constructor(props: Props) {
    super(props);
    this.state = { hayError: false, mensaje: '', stack: '' };
  }

  static getDerivedStateFromError(error: Error): Estado {
    return {
      hayError: true,
      mensaje: error?.message || 'Error desconocido',
      stack: error?.stack || '',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[LimitadorErrores] Error capturado:', error, info);
  }

  reiniciar = () => {
    this.setState({ hayError: false, mensaje: '', stack: '' });
  };

  render() {
    if (this.state.hayError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={estilos.contenedor}>
          <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
            <View style={estilos.icono}>
              <MaterialIcons name="error-outline" size={64} color={COLORES.error} />
            </View>
            <Text style={estilos.titulo}>Algo salió mal</Text>
            <Text style={estilos.subtitulo}>
              Ocurrió un error inesperado en esta sección. La aplicación se puede recuperar.
            </Text>
            <View style={estilos.tarjetaError}>
              <Text style={estilos.textoError} numberOfLines={4}>
                {this.state.mensaje}
              </Text>
            </View>
            <TouchableOpacity style={estilos.boton} onPress={this.reiniciar} activeOpacity={0.85}>
              <MaterialIcons name="refresh" size={20} color={COLORES.textoInverso} />
              <Text style={estilos.textoBoton}>Reintentar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ESPACIADO.xl,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icono: {
    marginBottom: ESPACIADO.lg,
  },
  titulo: {
    ...TIPOGRAFIA.tituloSeccion,
    color: COLORES.texto,
    marginBottom: ESPACIADO.sm,
    textAlign: 'center',
  },
  subtitulo: {
    ...TIPOGRAFIA.cuerpo,
    color: COLORES.textoSecundario,
    textAlign: 'center',
    marginBottom: ESPACIADO.xl,
    lineHeight: 22,
  },
  tarjetaError: {
    width: '100%',
    backgroundColor: `${COLORES.error}10`,
    borderRadius: RADIOS.md,
    padding: ESPACIADO.md,
    borderWidth: 1,
    borderColor: `${COLORES.error}30`,
    marginBottom: ESPACIADO.xl,
  },
  textoError: {
    fontSize: 12,
    color: COLORES.error,
    fontFamily: 'monospace',
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.xs,
    backgroundColor: COLORES.primario,
    paddingVertical: ESPACIADO.md,
    paddingHorizontal: ESPACIADO.xl,
    borderRadius: RADIOS.lg,
  },
  textoBoton: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORES.textoInverso,
  },
});
