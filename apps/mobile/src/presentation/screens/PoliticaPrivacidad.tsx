import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import { ESPACIADO, RADIOS, SOMBRAS } from '@/shared/constants/diseno';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

const SECCIONES_PRIVACIDAD = [
  {
    icon: 'shield' as const,
    title: 'Protección y Confidencialidad',
    body: 'Nexxus procesa tu información de cuenta y actividad exclusivamente para las funciones laborales y operativas autorizadas por tu empresa.',
    tag: 'Cifrado E2E',
  },
  {
    icon: 'database' as const,
    title: 'Gestión y Gobernanza de Datos',
    body: 'Tu empresa define los registros operativos almacenados (asistencia, tareas, solicitudes). Solo personas con permisos estrictos tienen acceso.',
    tag: 'Acceso RBAC',
  },
  {
    icon: 'lock' as const,
    title: 'Acceso y Control de Sesiones',
    body: 'Todas las conexiones están protegidas con tokens seguros y puedes auditar y cerrar sesiones activas desde el módulo de Configuración.',
    tag: 'Sesiones Seguras',
  },
  {
    icon: 'bell' as const,
    title: 'Notificaciones y Avisos',
    body: 'Tú controlas los canales de comunicación y alertas. Los avisos urgentes se despachan bajo protocolos de cumplimiento empresarial.',
    tag: 'Preferencias',
  },
] as const;

const DERECHOS_ARCO = [
  { label: 'Acceso', desc: 'Consulta tus datos' },
  { label: 'Rectificación', desc: 'Actualiza información' },
  { label: 'Cancelación', desc: 'Baja de registros' },
  { label: 'Oposición', desc: 'Límites de uso' },
];

export default function PoliticaPrivacidad() {
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const estilos = crearEstilos(colores, esOscuro);

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View pointerEvents="none" style={estilos.fondoAbsoluto}><FondoMobilePremium /></View>
      <NavbarEnterprise titulo="Privacidad" subtitulo="Políticas y gobernanza de datos" mostrarAtras />

      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero Card de Seguridad */}
        <Animated.View
          entering={FadeInDown.duration(260).easing(Easing.out(Easing.quad))}
          style={estilos.heroCard}
        >
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.heroContent}>
            <View style={estilos.heroIconBadge}>
              <Feather name="shield" size={26} color={esOscuro ? '#93C5FD' : '#2563EB'} />
            </View>
            <View style={estilos.heroTextos}>
              <Text style={estilos.heroTitulo}>Tu información, protegida</Text>
              <Text style={estilos.heroSubtitulo}>
                Conoce las directivas de seguridad y cómo resguardamos tus datos en el ecosistema Nexxus Enterprise.
              </Text>
            </View>
          </BlurView>
        </Animated.View>

        {/* Sección de Pilares de Privacidad */}
        <Text style={estilos.seccionLabel}>PILARES DE PRIVACIDAD</Text>
        <View style={estilos.listaSecciones}>
          {SECCIONES_PRIVACIDAD.map((sec, idx) => (
            <Animated.View
              key={sec.title}
              entering={FadeInDown.duration(260).delay((idx + 1) * 35).easing(Easing.out(Easing.quad))}
              style={estilos.tarjetaPilar}
            >
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.pilarContent}>
                <View style={estilos.pilarHeader}>
                  <View style={estilos.pilarIcono}>
                    <Feather name={sec.icon} size={18} color={esOscuro ? '#93C5FD' : '#2563EB'} />
                  </View>
                  <View style={estilos.pilarBadge}>
                    <Text style={estilos.pilarBadgeTexto}>{sec.tag}</Text>
                  </View>
                </View>
                <Text style={estilos.pilarTitulo}>{sec.title}</Text>
                <Text style={estilos.pilarCuerpo}>{sec.body}</Text>
              </BlurView>
            </Animated.View>
          ))}
        </View>

        {/* Derechos de Usuario */}
        <Text style={estilos.seccionLabel}>TUS DERECHOS ARCO</Text>
        <Animated.View
          entering={FadeInDown.duration(260).delay(180).easing(Easing.out(Easing.quad))}
          style={estilos.gridDerechos}
        >
          {DERECHOS_ARCO.map((der) => (
            <View key={der.label} style={estilos.tarjetaDerecho}>
              <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.derechoContent}>
                <MaterialIcons name="verified-user" size={16} color="#10B981" />
                <Text style={estilos.derechoLabel}>{der.label}</Text>
                <Text style={estilos.derechoDesc}>{der.desc}</Text>
              </BlurView>
            </View>
          ))}
        </Animated.View>

        {/* Nota Final de Contacto */}
        <Animated.View
          entering={FadeInDown.duration(260).delay(220).easing(Easing.out(Easing.quad))}
          style={estilos.tarjetaNota}
        >
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.notaContent}>
            <Feather name="info" size={18} color={esOscuro ? '#93C5FD' : '#2563EB'} />
            <Text style={estilos.notaTexto}>
              Para ejercer cualquiera de tus derechos o solicitar la rectificación de tus datos, contacta al administrador de Recursos Humanos de tu organización.
            </Text>
          </BlurView>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function crearEstilos(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(24, 24, 38, 0.88)' : 'rgba(255, 255, 255, 0.94)';
  const glassMicro = c.vidrioSutil;

  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },

    scroll: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 110,
    },

    heroCard: {
      borderRadius: 22,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(96,165,250,0.3)' : 'rgba(37,99,235,0.2)',
      backgroundColor: glass,
      marginBottom: 22,
      ...SOMBRAS.flotante,
    },
    heroContent: {
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    heroIconBadge: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: esOscuro ? 'rgba(59,130,246,0.18)' : 'rgba(37,99,235,0.10)',
      borderWidth: 1,
      borderColor: esOscuro ? 'rgba(96,165,250,0.3)' : 'rgba(37,99,235,0.2)',
    },
    heroTextos: { flex: 1 },
    heroTitulo: {
      fontSize: 16.5,
      fontWeight: '900',
      color: c.texto,
      letterSpacing: -0.3,
    },
    heroSubtitulo: {
      fontSize: 12.5,
      color: c.textoSecundario,
      lineHeight: 17,
      marginTop: 4,
    },

    seccionLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: c.textoSuave,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginBottom: 10,
      marginTop: 6,
      paddingHorizontal: 2,
    },

    listaSecciones: {
      gap: 10,
      marginBottom: 20,
    },
    tarjetaPilar: {
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: glass,
      ...SOMBRAS.flotante,
    },
    pilarContent: {
      padding: 16,
    },
    pilarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    pilarIcono: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: esOscuro ? 'rgba(59,130,246,0.14)' : 'rgba(37,99,235,0.08)',
      borderWidth: 1,
      borderColor: c.borde,
    },
    pilarBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: glassMicro,
      borderWidth: 1,
      borderColor: c.borde,
    },
    pilarBadgeTexto: {
      fontSize: 10,
      fontWeight: '800',
      color: esOscuro ? '#93C5FD' : '#2563EB',
    },
    pilarTitulo: {
      fontSize: 14.5,
      fontWeight: '800',
      color: c.texto,
      letterSpacing: -0.2,
      marginBottom: 4,
    },
    pilarCuerpo: {
      fontSize: 12.5,
      color: c.textoSecundario,
      lineHeight: 18,
    },

    gridDerechos: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 20,
    },
    tarjetaDerecho: {
      width: '48.5%',
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: glass,
      ...SOMBRAS.flotante,
    },
    derechoContent: {
      padding: 12,
      gap: 4,
    },
    derechoLabel: {
      fontSize: 13,
      fontWeight: '800',
      color: c.texto,
      marginTop: 2,
    },
    derechoDesc: {
      fontSize: 11,
      color: c.textoSuave,
      lineHeight: 14,
    },

    tarjetaNota: {
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: glass,
      ...SOMBRAS.flotante,
    },
    notaContent: {
      padding: 14,
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
    },
    notaTexto: {
      flex: 1,
      fontSize: 12,
      color: c.textoSecundario,
      lineHeight: 17,
    },
  });
}
