import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { changeLanguage } from '@/shared/i18n/config';

export default function ConfiguracionApp({ navigation }: { navigation: any }) {
  const { t, i18n } = useTranslation();
  const { cerrarSesion } = useContextoUsuario();
  const { esOscuro, cambiarModo, colores, blurTint, intensidadBlur } = useTemaMobile();
  const estilos = crearEstilosConfig(colores, esOscuro);


  const cambiarIdioma = (lang: string) => {
    changeLanguage(lang);
  };

  const manejarCerrarSesion = () => {
    Alert.alert(
      t('perfilLaboral.logout_title'),
      t('perfilLaboral.logout_desc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('perfilLaboral.logout_title'), 
          style: 'destructive',
          onPress: async () => {
            await cerrarSesion();
          }
        }
      ]
    );
  };

  const SeccionConfig = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
    <View style={estilos.seccion}>
      <Text style={estilos.tituloSeccion}>{titulo}</Text>
      <View style={estilos.tarjetaGrupo}>
        <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.grupoContenido}>
          {children}
        </BlurView>
      </View>
    </View>
  );

  const ItemConfig = ({ 
    icono, 
    label, 
    valor, 
    onPress, 
    esSwitch, 
    switchValue, 
    onSwitchChange,
    esUltimo 
  }: { 
    icono: any; 
    label: string; 
    valor?: string; 
    onPress?: () => void; 
    esSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (val: boolean) => void;
    esUltimo?: boolean;
  }) => (
    <TouchableOpacity 
      style={[estilos.itemConfig, esUltimo && { borderBottomWidth: 0 }]} 
      onPress={onPress}
      disabled={esSwitch}
    >
      <View style={estilos.itemIzq}>
        <View style={estilos.iconoContenedor}>
          <Feather name={icono} size={18} color={colores.texto} />
        </View>
        <Text style={estilos.itemLabel}>{label}</Text>
      </View>
      <View style={estilos.itemDer}>
        {esSwitch ? (
          <Switch 
            value={switchValue} 
            onValueChange={onSwitchChange}
            trackColor={{ false: '#334155', true: COLORES.primario }}
            thumbColor="#f8fafc"
          />
        ) : (
          <>
            {valor && <Text style={estilos.itemValor}>{valor}</Text>}
            <Feather name="chevron-right" size={16} color={colores.textoSuave} />
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      <NavbarEnterprise titulo={t('common.settings')} />

      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        <SeccionConfig titulo={t('app.settings_title')}>
          <ItemConfig 
            icono="globe" 
            label={t('common.language')} 
            valor={i18n.language === 'es' ? 'Español' : 'English'}
            onPress={() => {
              Alert.alert(
                t('common.language'),
                t('common.language'),
                [
                  { text: 'Español', onPress: () => cambiarIdioma('es') },
                  { text: 'English', onPress: () => cambiarIdioma('en') },
                  { text: t('common.cancel'), style: 'cancel' }
                ]
              );
            }}
          />
          <ItemConfig 
            icono="moon" 
            label={t('common.theme')} 
            esSwitch 
            switchValue={esOscuro}
            onSwitchChange={(valor) => cambiarModo(valor ? 'oscuro' : 'claro')}
            esUltimo
          />
        </SeccionConfig>

        <SeccionConfig titulo={t('perfilLaboral.contact_relation')}>
          <ItemConfig icono="bell" label={t('notificaciones.title')} onPress={() => navigation.navigate('Notificaciones')} />
          <ItemConfig icono="user" label={t('perfilLaboral.my_profile')} onPress={() => navigation.navigate('PerfilLaboral')} esUltimo />
        </SeccionConfig>

        <SeccionConfig titulo={t('common.advanced_options')}>
          <ItemConfig icono="shield" label="Privacidad" />
          <ItemConfig icono="headphones" label="Soporte y Ayuda" onPress={() => navigation.navigate('CentroApoyo')} esUltimo />
        </SeccionConfig>

        <TouchableOpacity style={estilos.botonLogout} onPress={manejarCerrarSesion}>
          <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.logoutContent}>
            <Feather name="log-out" size={20} color={COLORES.error} />
            <Text style={estilos.textoLogout}>{t('perfilLaboral.logout_title')}</Text>
          </BlurView>
        </TouchableOpacity>

        <View style={estilos.footer}>
          <Text style={estilos.textoVersion}>Nexxus v1.1.0</Text>
          <Text style={estilos.textoCopyright}>© 2026 Nexxus Enterprise</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function crearEstilosConfig(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.78)';
  const glassMicro = esOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.5)';
  const separador = esOscuro ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: ESPACIADO.lg, paddingVertical: ESPACIADO.md },
    botonCircular: { width: 40, height: 40, borderRadius: 20, backgroundColor: glassMicro, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.borde },
    tituloPantalla: { fontSize: 20, fontWeight: '800', color: c.texto, letterSpacing: -0.5 },
    scroll: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.md, paddingBottom: 100 },
    seccion: { marginBottom: ESPACIADO.xl },
    tituloSeccion: { fontSize: 13, fontWeight: '700', color: c.textoSuave, textTransform: 'uppercase', letterSpacing: 1, marginBottom: ESPACIADO.sm, marginLeft: 4 },
    tarjetaGrupo: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.borde, backgroundColor: glass },
    grupoContenido: { paddingVertical: 4 },
    itemConfig: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: separador },
    itemIzq: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconoContenedor: { width: 34, height: 34, borderRadius: 10, backgroundColor: glassMicro, alignItems: 'center', justifyContent: 'center' },
    itemLabel: { fontSize: 15, fontWeight: '600', color: c.texto },
    itemDer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    itemValor: { fontSize: 14, color: c.textoSuave },
    botonLogout: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', marginTop: ESPACIADO.md, backgroundColor: glass },
    logoutContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
    textoLogout: { fontSize: 16, fontWeight: '700', color: COLORES.error },
    footer: { alignItems: 'center', marginTop: ESPACIADO.xxl, gap: 4 },
    textoVersion: { fontSize: 13, fontWeight: '700', color: c.textoSuave },
    textoCopyright: { fontSize: 11, color: c.textoSuave, opacity: 0.6 },
  });
}

