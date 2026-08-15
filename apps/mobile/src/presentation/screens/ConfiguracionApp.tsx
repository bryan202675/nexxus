import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { Skeleton } from '@/presentation/components/ui';
import { useTranslation } from 'react-i18next';
import { COLORES, ESPACIADO, RADIOS, SOMBRAS } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { changeLanguage } from '@/shared/i18n/config';
import { useCases } from '@/infrastructure/container';
import { SessionDevice } from 'domain/entities/SessionDevice';
import { obtenerDeviceId } from '@/infrastructure/storage/deviceIdentity';
import BotonAnimado from '@/presentation/components/BotonAnimado';

export default function ConfiguracionApp({ navigation }: { navigation: any }) {
  const { t, i18n } = useTranslation();
  const { cerrarSesion, perfil } = useContextoUsuario();
  const { esOscuro, cambiarModo, colores, blurTint, intensidadBlur } = useTemaMobile();
  const estilos = crearEstilosConfig(colores, esOscuro);

  const [dispositivos, setDispositivos] = useState<SessionDevice[]>([]);
  const [deviceIdActual, setDeviceIdActual] = useState<string>('');
  const [cerrandoOtras, setCerrandoOtras] = useState(false);

  useEffect(() => {
    obtenerDeviceId().then(setDeviceIdActual);
  }, []);

  useEffect(() => {
    if (!perfil?.id) return;
    const unsub = useCases.sessionDevices.subscribe.execute(perfil.id, setDispositivos);
    return () => unsub();
  }, [perfil?.id]);

  const manejarCerrarOtrasSesiones = () => {
    Alert.alert(
      'Cerrar otras sesiones',
      'Se cerrará la sesión en todos tus demás dispositivos. Esta sesión seguirá activa.',
      [
        { text: t('common.cancel', { defaultValue: 'Cancelar' }), style: 'cancel' },
        {
          text: 'Cerrar otras sesiones',
          style: 'destructive',
          onPress: async () => {
            setCerrandoOtras(true);
            try {
              await useCases.auth.logoutOtherSessions.execute();
              if (perfil?.id && deviceIdActual) {
                await useCases.sessionDevices.removeOthers.execute(perfil.id, deviceIdActual);
              }
            } catch {
              Alert.alert('Error', 'No se pudieron cerrar las otras sesiones. Intenta de nuevo.');
            } finally {
              setCerrandoOtras(false);
            }
          },
        },
      ]
    );
  };

  const formatearUltimoAcceso = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('es-SV', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  const cambiarIdioma = (lang: string) => {
    changeLanguage(lang);
  };

  const manejarCerrarSesion = () => {
    Alert.alert(
      t('perfilLaboral.logout_title', { defaultValue: 'Cerrar sesión' }),
      t('perfilLaboral.logout_desc', { defaultValue: '¿Estás seguro de que deseas salir de tu cuenta?' }),
      [
        { text: t('common.cancel', { defaultValue: 'Cancelar' }), style: 'cancel' },
        {
          text: t('perfilLaboral.logout_title', { defaultValue: 'Cerrar sesión' }),
          style: 'destructive',
          onPress: async () => {
            await cerrarSesion();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      <NavbarEnterprise titulo={t('common.settings', { defaultValue: 'Configuración' })} subtitulo="Preferencias y seguridad" />

      <ScrollView contentContainerStyle={estilos.scroll} showsVerticalScrollIndicator={false}>
        {/* Preferencias de la App */}
        <Animated.View entering={FadeInDown.duration(260).delay(0).easing(Easing.out(Easing.quad))} style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>{t('app.settings_title', { defaultValue: 'PREFERENCIAS' })}</Text>
          <View style={estilos.tarjetaGrupo}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.grupoContenido}>
              {/* Idioma */}
              <TouchableOpacity
                style={estilos.itemConfig}
                onPress={() => {
                  Alert.alert(
                    t('common.language', { defaultValue: 'Idioma' }),
                    'Selecciona tu idioma preferido',
                    [
                      { text: 'Español', onPress: () => cambiarIdioma('es') },
                      { text: 'English', onPress: () => cambiarIdioma('en') },
                      { text: t('common.cancel', { defaultValue: 'Cancelar' }), style: 'cancel' },
                    ]
                  );
                }}
                activeOpacity={0.7}
              >
                <View style={estilos.itemIzq}>
                  <View style={estilos.iconoContenedor}>
                    <Feather name="globe" size={17} color={esOscuro ? '#93C5FD' : '#2563EB'} />
                  </View>
                  <Text style={estilos.itemLabel}>{t('common.language', { defaultValue: 'Idioma' })}</Text>
                </View>
                <View style={estilos.itemDer}>
                  <Text style={estilos.itemValor}>{i18n.language === 'es' ? 'Español' : 'English'}</Text>
                  <Feather name="chevron-right" size={16} color={colores.textoSuave} />
                </View>
              </TouchableOpacity>

              {/* Modo Oscuro */}
              <View style={[estilos.itemConfig, { borderBottomWidth: 0 }]}>
                <View style={estilos.itemIzq}>
                  <View style={estilos.iconoContenedor}>
                    <Feather name="moon" size={17} color={esOscuro ? '#FBBF24' : '#64748B'} />
                  </View>
                  <Text style={estilos.itemLabel}>{t('common.theme', { defaultValue: 'Modo Oscuro' })}</Text>
                </View>
                <Switch
                  value={esOscuro}
                  onValueChange={(val) => cambiarModo(val ? 'oscuro' : 'claro')}
                  trackColor={{ false: 'rgba(150,150,150,0.3)', true: esOscuro ? '#3B82F6' : '#2563EB' }}
                  thumbColor="#fff"
                />
              </View>
            </BlurView>
          </View>
        </Animated.View>

        {/* Cuenta y Perfil */}
        <Animated.View entering={FadeInDown.duration(260).delay(60).easing(Easing.out(Easing.quad))} style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>CUENTA Y ACTIVIDAD</Text>
          <View style={estilos.tarjetaGrupo}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.grupoContenido}>
              <TouchableOpacity style={estilos.itemConfig} onPress={() => navigation.navigate('Notificaciones')} activeOpacity={0.7}>
                <View style={estilos.itemIzq}>
                  <View style={estilos.iconoContenedor}>
                    <Feather name="bell" size={17} color={esOscuro ? '#93C5FD' : '#2563EB'} />
                  </View>
                  <Text style={estilos.itemLabel}>{t('notificaciones.title', { defaultValue: 'Notificaciones' })}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colores.textoSuave} />
              </TouchableOpacity>

              <TouchableOpacity style={[estilos.itemConfig, { borderBottomWidth: 0 }]} onPress={() => navigation.navigate('PerfilLaboral')} activeOpacity={0.7}>
                <View style={estilos.itemIzq}>
                  <View style={estilos.iconoContenedor}>
                    <Feather name="user" size={17} color={esOscuro ? '#93C5FD' : '#2563EB'} />
                  </View>
                  <Text style={estilos.itemLabel}>{t('perfilLaboral.my_profile', { defaultValue: 'Mi Perfil Laboral' })}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colores.textoSuave} />
              </TouchableOpacity>
            </BlurView>
          </View>
        </Animated.View>

        {/* Seguridad & Ayuda */}
        <Animated.View entering={FadeInDown.duration(260).delay(120).easing(Easing.out(Easing.quad))} style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>{t('common.advanced_options', { defaultValue: 'SEGURIDAD Y SOPORTE' })}</Text>
          <View style={estilos.tarjetaGrupo}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.grupoContenido}>
              <TouchableOpacity style={estilos.itemConfig} onPress={() => navigation.navigate('PoliticaPrivacidad')} activeOpacity={0.7}>
                <View style={estilos.itemIzq}>
                  <View style={estilos.iconoContenedor}>
                    <Feather name="shield" size={17} color="#10B981" />
                  </View>
                  <Text style={estilos.itemLabel}>{t('app.privacy', { defaultValue: 'Privacidad y Seguridad' })}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colores.textoSuave} />
              </TouchableOpacity>

              <TouchableOpacity style={[estilos.itemConfig, { borderBottomWidth: 0 }]} onPress={() => navigation.navigate('CentroApoyo')} activeOpacity={0.7}>
                <View style={estilos.itemIzq}>
                  <View style={estilos.iconoContenedor}>
                    <Feather name="headphones" size={17} color="#06B6D4" />
                  </View>
                  <Text style={estilos.itemLabel}>{t('app.support_help', { defaultValue: 'Centro de Soporte' })}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colores.textoSuave} />
              </TouchableOpacity>
            </BlurView>
          </View>
        </Animated.View>

        {/* Sesiones Activas */}
        <Animated.View entering={FadeInDown.duration(260).delay(180).easing(Easing.out(Easing.quad))} style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>SESIONES ACTIVAS</Text>
          <View style={estilos.tarjetaGrupo}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.grupoContenido}>
              {dispositivos.length === 0 ? (
                <View style={{ padding: 16, gap: 8 }}>
                  <Skeleton height={38} radius={12} />
                  <Skeleton height={38} radius={12} />
                </View>
              ) : (
                dispositivos.map((dispositivo, indice) => {
                  const esEsteDispositivo = dispositivo.deviceId === deviceIdActual;
                  return (
                    <View
                      key={dispositivo.id}
                      style={[estilos.itemConfig, indice === dispositivos.length - 1 && !dispositivos.some((_, i) => i > 0) && { borderBottomWidth: 0 }]}
                    >
                      <View style={estilos.itemIzq}>
                        <View style={estilos.iconoContenedor}>
                          <Feather name={dispositivo.deviceOs.toLowerCase().includes('web') ? 'monitor' : 'smartphone'} size={17} color={colores.texto} />
                        </View>
                        <View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={estilos.itemLabel}>{dispositivo.deviceName}</Text>
                            {esEsteDispositivo && (
                              <View style={estilos.badgeEsteDispositivo}>
                                <Text style={estilos.textoEsteDispositivo}>ESTE DISPOSITIVO</Text>
                              </View>
                            )}
                          </View>
                          <Text style={estilos.subtextoDispositivo}>
                            {dispositivo.deviceOs} · Últ. acceso {formatearUltimoAcceso(dispositivo.lastSeenAt)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
              {dispositivos.length > 1 && (
                <TouchableOpacity
                  style={estilos.botonCerrarOtras}
                  onPress={manejarCerrarOtrasSesiones}
                  disabled={cerrandoOtras}
                >
                  <Text style={estilos.textoCerrarOtras}>
                    {cerrandoOtras ? 'Cerrando...' : 'Cerrar todas las demás sesiones'}
                  </Text>
                </TouchableOpacity>
              )}
            </BlurView>
          </View>
        </Animated.View>

        {/* Botón Cerrar Sesión */}
        <Animated.View entering={FadeInDown.duration(260).delay(240).easing(Easing.out(Easing.quad))}>
          <BotonAnimado style={estilos.botonLogout} onPress={manejarCerrarSesion} scaleTo={0.98}>
            <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.logoutContent}>
              <Feather name="log-out" size={18} color="#EF4444" />
              <Text style={estilos.textoLogout}>{t('perfilLaboral.logout_title', { defaultValue: 'Cerrar Sesión' })}</Text>
            </BlurView>
          </BotonAnimado>
        </Animated.View>

        {/* Footer */}
        <View style={estilos.footer}>
          <Text style={estilos.textoVersion}>Nexxus Enterprise v1.1.0</Text>
          <Text style={estilos.textoCopyright}>© 2026 Nexxus. Todos los derechos reservados.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function crearEstilosConfig(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(24, 24, 38, 0.88)' : 'rgba(255, 255, 255, 0.94)';
  const glassMicro = c.vidrioSutil;
  const separador = esOscuro ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1 },

    scroll: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 110,
    },
    seccion: {
      marginBottom: 20,
    },
    tituloSeccion: {
      fontSize: 11.5,
      fontWeight: '800',
      color: c.textoSuave,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 8,
      marginLeft: 4,
    },
    tarjetaGrupo: {
      borderRadius: 22,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: glass,
      ...SOMBRAS.flotante,
    },
    grupoContenido: {
      paddingVertical: 2,
    },
    itemConfig: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: separador,
    },
    itemIzq: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    iconoContenedor: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: glassMicro,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.borde,
    },
    itemLabel: {
      fontSize: 14.5,
      fontWeight: '700',
      color: c.texto,
      letterSpacing: -0.2,
    },
    itemDer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    itemValor: {
      fontSize: 13.5,
      color: c.textoSuave,
      fontWeight: '600',
    },
    badgeEsteDispositivo: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: 'rgba(34,197,94,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(34,197,94,0.28)',
    },
    textoEsteDispositivo: {
      fontSize: 9,
      fontWeight: '800',
      color: '#10B981',
      letterSpacing: 0.3,
    },
    subtextoDispositivo: {
      fontSize: 11,
      color: c.textoSuave,
      marginTop: 2,
    },
    botonCerrarOtras: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: separador,
    },
    textoCerrarOtras: {
      fontSize: 13,
      fontWeight: '800',
      color: '#EF4444',
    },

    botonLogout: {
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.25)',
      backgroundColor: glass,
      marginTop: 4,
      ...SOMBRAS.flotante,
    },
    logoutContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 15,
      backgroundColor: 'rgba(239,68,68,0.04)',
    },
    textoLogout: {
      fontSize: 15,
      fontWeight: '800',
      color: '#EF4444',
    },

    footer: {
      alignItems: 'center',
      marginTop: 28,
      gap: 4,
    },
    textoVersion: {
      fontSize: 12.5,
      fontWeight: '800',
      color: c.textoSuave,
    },
    textoCopyright: {
      fontSize: 11,
      color: c.textoSuave,
      opacity: 0.7,
    },
  });
}
