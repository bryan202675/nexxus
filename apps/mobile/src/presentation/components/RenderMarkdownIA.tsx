import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';

const Text = AdminTranslatedText;

interface Props {
  texto: string;
  estiloBase?: any;
}

/**
 * RenderMarkdownIA
 * Parsea y renderiza texto proveniente de la IA en componentes nativos elegantes,
 * eliminando caracteres crudos de Markdown (***, ###, ---, etc.) y convirtiéndolos
 * en encabezados tipográficos, viñetas formateadas, negritas y divisores sutiles.
 */
export default function RenderMarkdownIA({ texto, estiloBase }: Props) {
  const { colores, esOscuro } = useTemaMobile();
  const estilos = crearEstilos(colores, esOscuro);

  if (!texto) return null;

  // Divide el texto por saltos de línea para procesar bloques
  const lineas = texto.split('\n');
  const bloques: React.ReactNode[] = [];

  const parseInline = (lineaTexto: string, keyPrefix: string) => {
    // Regex para detectar **negrita**, *cursiva*, `codigo`
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_|`[^`]+`)/g;
    const partes = lineaTexto.split(regex);

    return partes.map((parte, index) => {
      if (!parte) return null;

      // Negrita: **texto** o __texto__
      if ((parte.startsWith('**') && parte.endsWith('**')) || (parte.startsWith('__') && parte.endsWith('__'))) {
        const contenido = parte.slice(2, -2);
        return (
          <Text key={`${keyPrefix}-bold-${index}`} style={estilos.negrita}>
            {contenido}
          </Text>
        );
      }

      // Cursiva: *texto* o _texto_
      if ((parte.startsWith('*') && parte.endsWith('*')) || (parte.startsWith('_') && parte.endsWith('_'))) {
        const contenido = parte.slice(1, -1);
        return (
          <Text key={`${keyPrefix}-italic-${index}`} style={estilos.cursiva}>
            {contenido}
          </Text>
        );
      }

      // Código inline: `codigo`
      if (parte.startsWith('`') && parte.endsWith('`')) {
        const contenido = parte.slice(1, -1);
        return (
          <Text key={`${keyPrefix}-code-${index}`} style={estilos.codigoInline}>
            {contenido}
          </Text>
        );
      }

      // Texto normal
      return (
        <Text key={`${keyPrefix}-txt-${index}`} style={estiloBase || estilos.textoNormal}>
          {parte}
        </Text>
      );
    });
  };

  lineas.forEach((lineaCruda, i) => {
    const linea = lineaCruda.trim();

    // Líneas vacías
    if (!linea) {
      bloques.push(<View key={`spacer-${i}`} style={estilos.espaciador} />);
      return;
    }

    // Separadores horizontales (---, ___, ***)
    if (/^(\-{3,}|\_{3,}|\*{3,})$/.test(linea)) {
      bloques.push(<View key={`divider-${i}`} style={estilos.divisor} />);
      return;
    }

    // Encabezados (#, ##, ###, ####)
    if (/^#{1,4}\s+/.test(linea)) {
      const contenidoLimpio = linea.replace(/^#{1,4}\s+/, '');
      bloques.push(
        <View key={`heading-${i}`} style={estilos.bloqueEncabezado}>
          <Text style={estilos.textoEncabezado}>{parseInline(contenidoLimpio, `h-${i}`)}</Text>
        </View>
      );
      return;
    }

    // Viñetas desordenadas (* item, - item, • item)
    if (/^(\*|\-|\•)\s+/.test(linea)) {
      const contenidoLimpio = linea.replace(/^(\*|\-|\•)\s+/, '');
      bloques.push(
        <View key={`bullet-${i}`} style={estilos.filaViñeta}>
          <View style={estilos.puntoViñeta} />
          <Text style={[estiloBase || estilos.textoNormal, estilos.flexTexto]}>
            {parseInline(contenidoLimpio, `b-${i}`)}
          </Text>
        </View>
      );
      return;
    }

    // Listas ordenadas (1. item, 2. item, etc.)
    const matchOrdenada = linea.match(/^(\d+)\.\s+(.+)$/);
    if (matchOrdenada) {
      const numero = matchOrdenada[1];
      const contenidoLimpio = matchOrdenada[2];
      bloques.push(
        <View key={`num-${i}`} style={estilos.filaViñeta}>
          <Text style={estilos.numeroLista}>{numero}.</Text>
          <Text style={[estiloBase || estilos.textoNormal, estilos.flexTexto]}>
            {parseInline(contenidoLimpio, `n-${i}`)}
          </Text>
        </View>
      );
      return;
    }

    // Párrafo normal
    bloques.push(
      <Text key={`p-${i}`} style={[estiloBase || estilos.textoNormal, estilos.parrafo]}>
        {parseInline(linea, `p-${i}`)}
      </Text>
    );
  });

  return <View style={estilos.contenedor}>{bloques}</View>;
}

function crearEstilos(c: any, esOscuro: boolean) {
  return StyleSheet.create({
    contenedor: {
      width: '100%',
    },
    textoNormal: {
      fontSize: 14.5,
      lineHeight: 22,
      color: c.texto,
      fontWeight: '400',
    },
    negrita: {
      fontWeight: '800',
      color: c.texto,
    },
    cursiva: {
      fontStyle: 'italic',
      color: c.textoSecundario,
    },
    codigoInline: {
      fontFamily: 'monospace',
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      paddingHorizontal: 4,
      borderRadius: 4,
      fontSize: 13,
      color: esOscuro ? '#A78BFA' : '#7C3AED',
    },
    parrafo: {
      marginBottom: 6,
    },
    espaciador: {
      height: 4,
    },
    divisor: {
      height: 1,
      backgroundColor: c.borde,
      marginVertical: 8,
      opacity: 0.6,
    },
    bloqueEncabezado: {
      marginTop: 8,
      marginBottom: 6,
    },
    textoEncabezado: {
      fontSize: 15,
      fontWeight: '900',
      color: c.texto,
      letterSpacing: -0.2,
      lineHeight: 22,
    },
    filaViñeta: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 5,
      paddingLeft: 2,
    },
    puntoViñeta: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: esOscuro ? '#A78BFA' : '#7C3AED',
      marginTop: 8,
      marginRight: 8,
    },
    numeroLista: {
      fontSize: 14,
      fontWeight: '800',
      color: esOscuro ? '#A78BFA' : '#7C3AED',
      marginRight: 6,
      minWidth: 16,
    },
    flexTexto: {
      flex: 1,
    },
  });
}
