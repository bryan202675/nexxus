/**
 * Documentacion Nexxus - apps/mobile/src/presentation/components/NavbarEnterprise.tsx
 * Capa: presentacion.
 * Proposito: Componente de barra superior para las pantallas móviles de usuario.
 * Rediseñado con estética Glassmorphism Liquid Glass, botones circulares traslúcidos estilo cápsula
 * y esquema de color Blanco/Negro de alto contraste alineado con el sistema iOS.
 */

import React from "react";
import { View, Text, StyleSheet, Platform, Image } from "react-native";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { Bell } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { COLORES, ESPACIADO, SOMBRAS } from "@/shared/constants/diseno";
import { useContextoUsuario } from "@/presentation/context/ContextoUsuario";
import BotonAnimado from "@/presentation/components/BotonAnimado";
import { useTemaMobile } from "@/presentation/context/TemaMobileContext";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  titulo: string;
  subtitulo?: string;
  mostrarAtras?: boolean;
  onBackPress?: () => void;
  avatarUrl?: string;
  avatarLetra?: string;
  ocultarAccionesDerechas?: boolean;
  accionDerecha?: React.ReactNode;
  modoAcciones?: "predeterminado" | "bienestar";
  usarMargenesSeguros?: boolean;
}

export default function NavbarEnterprise({
  titulo,
  subtitulo,
  mostrarAtras,
  onBackPress,
  avatarUrl,
  avatarLetra,
  ocultarAccionesDerechas = false,
  accionDerecha,
  modoAcciones = "predeterminado",
  usarMargenesSeguros = false,
}: Props) {
  const { perfil, alertasNoLeidas } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const { i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const locale = i18n.language.startsWith("en") ? "en-US" : "es-SV";
  const fechaActual = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  })
    .format(new Date())
    .replace(".", "");

  const abrirPerfil = () => {
    navigation.navigate("PerfilLaboral");
  };

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const fotoUrl =
    perfil?.foto_perfil ||
    (perfil as any)?.fotoPerfil ||
    (perfil as any)?.photoURL ||
    (perfil as any)?.avatarUrl;
  const inicialUsuario = (perfil?.nombre || "Usuario")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <View style={{ zIndex: 100 }}>
      <View
        style={[
          estilos.appBarContainer,
          usarMargenesSeguros && {
            marginTop: Math.max(insets.top, ESPACIADO.xs),
          },
        ]}
      >
        <BlurView
          intensity={Platform.OS === "ios" ? intensidadBlur + 15 : 85}
          tint={blurTint}
          style={[
            estilos.appBar,
            {
              backgroundColor: "transparent",
              borderColor: "transparent",
              shadowColor: "transparent",
            },
          ]}
        >
          {mostrarAtras ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <BotonAnimado
                onPress={handleBack}
                scaleTo={0.93}
                style={[
                  estilos.iconoPlano,
                  {
                    backgroundColor: colores.vidrioSutil,
                    borderColor: colores.borde,
                  },
                ]}
              >
                <MaterialIcons
                  name="arrow-back"
                  size={Platform.OS === "ios" ? 21 : 18}
                  color={colores.texto}
                />
              </BotonAnimado>

              {avatarUrl || avatarLetra ? (
                <View
                  style={[
                    estilos.avatarWrapSubscreen,
                    {
                      backgroundColor: colores.vidrioSutil,
                      borderColor: colores.borde,
                    },
                  ]}
                >
                  {avatarUrl ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      style={estilos.avatarImgSubscreen}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text
                      style={[estilos.avatarLetra, { color: colores.texto }]}
                    >
                      {(avatarLetra || titulo || "C").charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
              ) : null}
            </View>
          ) : (
            <BotonAnimado
              onPress={abrirPerfil}
              scaleTo={0.93}
              accessibilityLabel="Abrir mi perfil"
              style={[
                estilos.avatarBotonPrincipal,
                {
                  borderColor: esOscuro
                    ? "rgba(255, 255, 255, 0.22)"
                    : "rgba(0, 0, 0, 0.12)",
                  backgroundColor: esOscuro
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.04)",
                },
              ]}
            >
              {fotoUrl ? (
                <Image
                  source={{ uri: fotoUrl }}
                  style={estilos.avatarImg}
                  resizeMode="cover"
                />
              ) : (
                <View style={estilos.avatarPlaceholder}>
                  <Text style={[estilos.avatarLetra, { color: colores.texto }]}>
                    {inicialUsuario}
                  </Text>
                </View>
              )}
            </BotonAnimado>
          )}

          <View style={estilos.titulos}>
            <Text
              numberOfLines={1}
              style={[estilos.titulo, { color: colores.texto }]}
            >
              {titulo}
            </Text>
            <Text
              numberOfLines={1}
              style={[estilos.fecha, { color: colores.textoSuave }]}
            >
              {subtitulo || fechaActual}
            </Text>
          </View>

          {!ocultarAccionesDerechas ? (
            <View style={estilos.accionesAppBar}>
              {modoAcciones === "bienestar" ? (
                <>
                  <BotonAnimado
                    onPress={() => navigation.navigate("BusquedaGlobal")}
                    scaleTo={0.93}
                    accessibilityLabel="Abrir búsqueda"
                    style={[
                      estilos.iconoPlano,
                      {
                        backgroundColor: colores.vidrioSutil,
                        borderColor: colores.borde,
                      },
                    ]}
                  >
                    <Feather
                      name="search"
                      size={Platform.OS === "ios" ? 20 : 17}
                      color={colores.texto}
                    />
                  </BotonAnimado>
                  <BotonAnimado
                    onPress={() => navigation.navigate("CheckInDiario")}
                    scaleTo={0.93}
                    accessibilityLabel="Registrar mi bienestar"
                    style={[
                      estilos.iconoPlano,
                      {
                        backgroundColor: colores.navegacionActiva,
                        borderColor: colores.navegacionActiva,
                      },
                    ]}
                  >
                    <Feather
                      name="activity"
                      size={Platform.OS === "ios" ? 20 : 17}
                      color={colores.fondo}
                    />
                  </BotonAnimado>
                </>
              ) : (
                <>
                  <BotonAnimado
                    onPress={() => navigation.navigate("Notificaciones")}
                    scaleTo={0.93}
                    accessibilityLabel="Abrir notificaciones"
                    style={[
                      estilos.iconoPlano,
                      {
                        backgroundColor: colores.navegacionActiva,
                        borderColor: colores.navegacionActiva,
                      },
                    ]}
                  >
                    <Bell
                      size={Platform.OS === "ios" ? 19 : 17}
                      color={colores.fondo}
                      strokeWidth={2.2}
                    />
                    {alertasNoLeidas > 0 && (
                      <View
                        style={[
                          estilos.puntoNotif,
                          { borderColor: esOscuro ? "#070712" : "#FFFFFF" },
                        ]}
                      />
                    )}
                  </BotonAnimado>
                  <BotonAnimado
                    onPress={() => navigation.navigate("ConfiguracionApp")}
                    scaleTo={0.93}
                    accessibilityLabel="Abrir configuración"
                    style={[
                      estilos.iconoPlano,
                      {
                        backgroundColor: colores.vidrioSutil,
                        borderColor: colores.borde,
                      },
                    ]}
                  >
                    <Feather
                      name="settings"
                      size={Platform.OS === "ios" ? 20 : 17}
                      color={colores.texto}
                    />
                  </BotonAnimado>
                </>
              )}
            </View>
          ) : accionDerecha ? (
            <View style={estilos.accionesAppBar}>{accionDerecha}</View>
          ) : null}
        </BlurView>
      </View>
    </View>
  );
}

const isIOS = Platform.OS === "ios";

const estilos = StyleSheet.create({
  appBarContainer: {
    marginHorizontal: 20,
    marginTop: ESPACIADO.sm,
  },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 0,
    paddingVertical: 4,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderRadius: 0,
  },
  titulos: { flex: 1, minWidth: 0, justifyContent: "center" },
  titulo: { fontSize: isIOS ? 18 : 16, fontWeight: "800", letterSpacing: -0.3 },
  fecha: {
    fontSize: isIOS ? 12 : 11,
    fontWeight: "600",
    marginTop: 1,
    letterSpacing: 0.1,
  },
  accionesAppBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: isIOS ? 8 : 6,
  },
  iconoPlano: {
    width: isIOS ? 46 : 40,
    height: isIOS ? 46 : 40,
    borderRadius: isIOS ? 23 : 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  puntoNotif: {
    position: "absolute",
    top: isIOS ? 8 : 6,
    right: isIOS ? 8 : 6,
    width: isIOS ? 8 : 7,
    height: isIOS ? 8 : 7,
    borderRadius: isIOS ? 4 : 3.5,
    backgroundColor: COLORES.error,
    borderWidth: 1.5,
  },
  avatarBotonPrincipal: {
    width: isIOS ? 46 : 40,
    height: isIOS ? 46 : 40,
    borderRadius: isIOS ? 23 : 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    overflow: "hidden",
  },
  avatarWrapSubscreen: {
    width: isIOS ? 46 : 40,
    height: isIOS ? 46 : 40,
    borderRadius: isIOS ? 23 : 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  avatarImg: {
    width: isIOS ? 46 : 40,
    height: isIOS ? 46 : 40,
    borderRadius: isIOS ? 23 : 20,
  },
  avatarImgSubscreen: {
    width: isIOS ? 46 : 40,
    height: isIOS ? 46 : 40,
    borderRadius: isIOS ? 23 : 20,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetra: {
    fontSize: isIOS ? 15 : 14,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
});
