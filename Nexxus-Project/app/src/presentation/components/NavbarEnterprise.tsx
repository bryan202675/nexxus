import React from 'react';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { COLORES, ESPACIADO, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import BotonAnimado from '@/presentation/components/BotonAnimado';

interface Props {
  titulo: string;
}

export default function NavbarEnterprise({ titulo }: Props) {
  const { perfil, alertasNoLeidas } = useContextoUsuario();
  const navigation = useNavigation<any>();

  const abrirPerfil = () => {
    navigation.navigate('PerfilLaboral');
  };

  return (
    <View style={{ zIndex: 100 }}>
      <View style={estilos.appBarContainer}>
        <BlurView intensity={18} tint="dark" style={estilos.appBar}>
          <View style={estilos.appBarIzq}>
            <View>
              <Text style={estilos.saludo}>{titulo}</Text>
              <Text style={estilos.fechaHoy}>
                {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
            </View>
          </View>
          
          <View style={estilos.accionesAppBar}>
            <BotonAnimado onPress={() => navigation.navigate('BusquedaGlobal')} style={estilos.botonIcono}>
              <MaterialIcons name="search" size={22} color={COLORES.texto} />
            </BotonAnimado>
            
            <BotonAnimado onPress={() => navigation.navigate('Notificaciones')} style={estilos.botonIcono}>
              <MaterialIcons name="notifications-none" size={22} color={COLORES.texto} />
              {alertasNoLeidas > 0 && <View style={estilos.puntoNotif} />}
            </BotonAnimado>
            
            <BotonAnimado onPress={abrirPerfil} style={estilos.avatarBoton}>
              {perfil?.foto_perfil ? (
                <Image source={{ uri: perfil.foto_perfil }} style={estilos.avatarImg} />
              ) : (
                <View style={estilos.avatarPlaceholder}>
                  <Text style={estilos.avatarLetra}>{perfil?.nombre?.charAt(0).toUpperCase() || 'U'}</Text>
                </View>
              )}
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
    marginTop: Platform.OS === 'ios' ? 0 : ESPACIADO.md,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 30,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ESPACIADO.lg,
    paddingVertical: ESPACIADO.md,
    backgroundColor: 'rgba(5,5,8,0.58)',
    overflow: 'hidden',
  },
  appBarIzq: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm },
  saludo: { ...TIPOGRAFIA.tituloSeccion, color: COLORES.texto, fontSize: 24, letterSpacing: -0.5 },
  fechaHoy: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, textTransform: 'capitalize', marginTop: 2 },
  accionesAppBar: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.xs },
  botonIcono: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORES.superficieVidrioOscura, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.bordeFuerte },
  puntoNotif: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORES.error, borderWidth: 1.5, borderColor: COLORES.superficie },
  avatarBoton: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORES.primarioClaro, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', overflow: 'hidden', marginLeft: ESPACIADO.xs },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: { flex: 1, backgroundColor: COLORES.contenedorPrimario, alignItems: 'center', justifyContent: 'center', width: '100%' },
  avatarLetra: { fontSize: 16, fontWeight: '800', color: COLORES.primario },
});
