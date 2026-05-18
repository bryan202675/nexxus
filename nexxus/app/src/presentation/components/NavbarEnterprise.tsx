import React from 'react';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { COLORES, ESPACIADO } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';

interface Props {
  titulo: string;
  mostrarAtras?: boolean;
}

export default function NavbarEnterprise({ titulo, mostrarAtras }: Props) {
  const { perfil, alertasNoLeidas } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const navigation = useNavigation<any>();
  const fechaActual = new Intl.DateTimeFormat('es-SV', { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date()).replace('.', '');

  const abrirPerfil = () => {
    navigation.navigate('PerfilLaboral');
  };

  return (
    <View style={{ zIndex: 100 }}>
      <View style={estilos.appBarContainer}>
        <BlurView intensity={intensidadBlur} tint={blurTint} style={[estilos.appBar, { backgroundColor: esOscuro ? 'rgba(10,10,24,0.58)' : 'rgba(255,255,255,0.66)', borderColor: colores.borde, shadowColor: colores.sombra }]}>
          {mostrarAtras ? (
            <BotonAnimado onPress={() => navigation.goBack()} style={[estilos.iconoPlano, { backgroundColor: colores.vidrio, borderColor: colores.borde }]}>
              <MaterialIcons name="arrow-back" size={20} color={colores.texto} />
            </BotonAnimado>
          ) : (
            <BotonAnimado onPress={abrirPerfil} style={[estilos.avatarBotonPrincipal, { borderColor: colores.bordeFuerte }]}>
              {perfil?.foto_perfil ? (
                <Image source={{ uri: perfil.foto_perfil }} style={estilos.avatarImg} />
              ) : (
                <View style={[estilos.avatarPlaceholder, { backgroundColor: esOscuro ? 'rgba(124,58,237,0.28)' : 'rgba(124,58,237,0.15)' }]}>
                  <Text style={[estilos.avatarLetra, { color: colores.primarioClaro }]}>{perfil?.nombre?.charAt(0).toUpperCase() || 'U'}</Text>
                </View>
              )}
            </BotonAnimado>
          )}

          <View style={estilos.titulos}>
            <Text numberOfLines={1} style={[estilos.titulo, { color: colores.texto }]}>{titulo}</Text>
            <Text numberOfLines={1} style={[estilos.fecha, { color: colores.textoSuave }]}>{fechaActual}</Text>
          </View>

          <View style={estilos.accionesAppBar}>
            <BotonAnimado onPress={() => navigation.navigate('Notificaciones')} style={[estilos.iconoPlano, { backgroundColor: colores.vidrio, borderColor: colores.borde }]}>
              <MaterialIcons name="notifications-none" size={19} color={colores.texto} />
              {alertasNoLeidas > 0 && <View style={estilos.puntoNotif} />}
            </BotonAnimado>

            <BotonAnimado onPress={() => navigation.navigate('ConfiguracionApp')} style={[estilos.iconoPlano, { backgroundColor: colores.vidrio, borderColor: colores.borde }]}>
              <MaterialIcons name="settings" size={18} color={colores.texto} />
            </BotonAnimado>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  appBarContainer: {
    marginHorizontal: ESPACIADO.md,
    marginTop: Platform.OS === 'ios' ? ESPACIADO.xs : ESPACIADO.sm,
    borderRadius: 28,
    overflow: 'hidden',
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 28,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.24, shadowRadius: 28 },
      android: { elevation: 12 },
      default: { shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.22, shadowRadius: 28 },
    }),
  },
  titulos: { flex: 1, minWidth: 0 },
  titulo: { fontSize: 17, fontWeight: '900', letterSpacing: 0 },
  fecha: { fontSize: 11, fontWeight: '700', marginTop: 2, textTransform: 'capitalize' },
  accionesAppBar: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.xs },
  iconoPlano: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  puntoNotif: { position: 'absolute', top: 7, right: 7, width: 6, height: 6, borderRadius: 3, backgroundColor: COLORES.error, borderWidth: 1, borderColor: COLORES.superficie },
  avatarBotonPrincipal: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORES.primarioClaro, alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: { flex: 1, backgroundColor: COLORES.contenedorPrimario, alignItems: 'center', justifyContent: 'center', width: '100%' },
  avatarLetra: { fontSize: 15, fontWeight: '900', color: COLORES.primario },
});
