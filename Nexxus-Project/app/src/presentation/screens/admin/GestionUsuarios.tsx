import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  TextInput, ActivityIndicator, SafeAreaView, StatusBar, Animated, Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useCases } from '@/infrastructure/firebase/container';
import { User } from '@/domain/entities/User';
import { COLORES, RADIOS, TIPOGRAFIA, ESPACIADO } from '@/shared/constants/diseno';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import TarjetaAnimada from '@/presentation/components/TarjetaAnimada';
import { useAuth } from '@/presentation/hooks/useAuth';
import { obtenerEmpresaIdAdmin } from './adminUtils';
import { ADMIN } from './adminTheme';

export default function GestionUsuarios({ navigation }: { navigation: any }) {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const { user } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    cargarUsuarios();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [user]);

  const cargarUsuarios = async () => {
    const empresaId = obtenerEmpresaIdAdmin(user);
    if (!empresaId) {
      setUsuarios([]);
      setCargando(false);
      return;
    }
    setCargando(true);
    try {
      const data = await useCases.admin.getAllUsers.execute(empresaId);
      setUsuarios(data);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setCargando(false);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => 
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    u.departamento.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View pointerEvents="none" style={estilos.fondoAdmin}>
        <View style={estilos.glowUno} />
        <View style={estilos.glowDos} />
      </View>

      {/* NAVBAR */}
      <View style={estilos.appBar}>
        <View style={estilos.appBarIzq}>
          <BotonAnimado onPress={() => navigation.goBack()} style={estilos.botonVolver}>
            <MaterialIcons name="arrow-back" size={24} color={COLORES.texto} />
          </BotonAnimado>
          <View>
            <Text style={estilos.saludo}>Equipo Admin</Text>
            <Text style={estilos.fechaHoy}>{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
        </View>
      </View>

      <Animated.ScrollView 
        contentContainerStyle={estilos.lista} 
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <TarjetaAnimada index={0}>
          <View style={estilos.barraBusqueda}>
            <MaterialIcons name="search" size={24} color={COLORES.textoSuave} />
            <TextInput 
              style={estilos.inputBusqueda}
              placeholder="Buscar por nombre o departamento..."
              placeholderTextColor={COLORES.textoSuave}
              value={busqueda}
              onChangeText={setBusqueda}
            />
            {busqueda.length > 0 && (
              <TouchableOpacity onPress={() => setBusqueda('')}>
                <MaterialIcons name="close" size={20} color={COLORES.textoSuave} />
              </TouchableOpacity>
            )}
          </View>
        </TarjetaAnimada>

        {cargando ? (
          <ActivityIndicator size="large" color={COLORES.primario} style={{ marginTop: 50 }} />
        ) : (
          <View style={estilos.gridUsuarios}>
            {usuariosFiltrados.map((usuario, idx) => (
              <TarjetaAnimada key={usuario.id} index={idx + 1}>
                <BotonAnimado 
                  style={estilos.tarjetaUsuario}
                  scaleTo={0.96}
                  onPress={() => {/* Navegar a detalle */}}
                >
                  <View style={estilos.avatar}>
                    <Text style={estilos.avatarTexto}>{usuario.nombre.substring(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={estilos.infoUsuario}>
                    <Text style={estilos.nombreUsuario} numberOfLines={1}>{usuario.nombre}</Text>
                    <Text style={estilos.deptoUsuario} numberOfLines={1}>{usuario.departamento}</Text>
                  </View>
                  <View style={[estilos.badgeRol, { backgroundColor: usuario.rol === 'admin' ? COLORES.primario : COLORES.acento + '15' }]}>
                    <Text style={[estilos.textoRol, { color: usuario.rol === 'admin' ? COLORES.textoInverso : COLORES.acento }]}>
                      {usuario.rol.toUpperCase()}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={COLORES.textoSuave} />
                </BotonAnimado>
              </TarjetaAnimada>
            ))}
            {usuariosFiltrados.length === 0 && (
              <View style={estilos.vacioContenedor}>
                <MaterialIcons name="group-off" size={48} color={COLORES.textoSuave} />
                <Text style={estilos.textoVacio}>No se encontraron colaboradores.</Text>
              </View>
            )}
          </View>
        )}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: ADMIN.fondo },
  fondoAdmin: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glowUno: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(124,58,237,0.20)',
  },
  glowDos: {
    position: 'absolute',
    bottom: -140,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(182,156,255,0.10)',
  },
  appBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: ESPACIADO.lg, 
    paddingVertical: ESPACIADO.md, 
    zIndex: 10, 
    borderRadius: 10, 
    marginHorizontal: ESPACIADO.xl, 
    marginTop: Platform.OS === 'ios' ? ESPACIADO.sm : ESPACIADO.xl, 
    borderWidth: 1, 
    borderColor: 'rgba(196,181,253,0.12)', 
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 7, 20, 0.76)',
  },
  appBarIzq: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm },
  botonVolver: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255, 0.045)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' },
  saludo: { ...TIPOGRAFIA.tituloSeccion, color: COLORES.texto, fontSize: 22, letterSpacing: 0 },
  fechaHoy: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, textTransform: 'capitalize', marginTop: 2 },
  lista: { paddingHorizontal: ESPACIADO.xl, paddingTop: ESPACIADO.md },
  barraBusqueda: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13,7,24,0.92)',
    paddingHorizontal: ESPACIADO.md,
    borderRadius: ADMIN.radioPequeno,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.12)',
    marginBottom: ESPACIADO.xl,
  },
  inputBusqueda: { flex: 1, marginLeft: 10, fontSize: 16, color: COLORES.texto },
  gridUsuarios: { gap: ESPACIADO.md },
  tarjetaUsuario: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13,7,24,0.92)',
    padding: ESPACIADO.md,
    borderRadius: ADMIN.radioPequeno,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.12)'
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(196,181,253,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ESPACIADO.md
  },
  avatarTexto: { fontWeight: '900', color: COLORES.primario, fontSize: 16 },
  infoUsuario: { flex: 1, gap: 4 },
  nombreUsuario: { fontWeight: '800', color: COLORES.texto, fontSize: 16 },
  deptoUsuario: { color: COLORES.textoSecundario, fontSize: 13 },
  badgeRol: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIOS.completo,
    marginRight: 10
  },
  textoRol: { fontSize: 11, fontWeight: '900' },
  vacioContenedor: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 16, backgroundColor: 'rgba(13,7,24,0.92)', borderRadius: ADMIN.radioPequeno, borderWidth: 1, borderColor: 'rgba(196,181,253,0.12)' },
  textoVacio: { textAlign: 'center', color: COLORES.textoSuave, fontSize: 15, fontWeight: '600' },
});
