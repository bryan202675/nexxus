import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import FondoAurora from '@/presentation/components/FondoAurora';
import MarcaNexxus from '@/presentation/components/MarcaNexxus';
import { COLORES, ESPACIADO, RADIOS, SOMBRAS, TIPOGRAFIA } from '@/shared/constants/diseno';
import AuraOrb from '@/presentation/components/AuraOrb';

type RolSeleccionado = 'empleado' | 'jefe' | 'admin';

interface Props {
  navigation: any;
}

export default function SeleccionRol({ navigation }: Props) {
  const { t } = useTranslation();
  const [rolActivo, setRolActivo] = useState<RolSeleccionado>('admin');
  const animacionOpacidad = useRef(new Animated.Value(0)).current;
  const animacionTraslado = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animacionOpacidad, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(animacionTraslado, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  const roles = [
    {
      id: 'empleado' as RolSeleccionado,
      titulo: t('seleccionRol.role_employee_title'),
      descripcion: t('seleccionRol.role_employee_desc'),
      icono: 'person' as const,
      acento: COLORES.primario,
    },
    {
      id: 'jefe' as RolSeleccionado,
      titulo: t('seleccionRol.role_manager_title'),
      descripcion: t('seleccionRol.role_manager_desc'),
      icono: 'groups' as const,
      acento: COLORES.secundario,
    },
    {
      id: 'admin' as RolSeleccionado,
      titulo: t('seleccionRol.role_admin_title'),
      descripcion: t('seleccionRol.role_admin_desc'),
      icono: 'admin-panel-settings' as const,
      acento: '#3B82F6', // Blue from admin mockup
    }
  ];

  async function manejarContinuar() {
    if (rolActivo === 'jefe') {
      navigation.reset({ index: 0, routes: [{ name: 'AppJefe' }] });
    } else if (rolActivo === 'admin') {
      navigation.reset({ index: 0, routes: [{ name: 'AppAdmin' }] });
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'AppEmpleado' }] });
    }
  }

  return (
    <SafeAreaView style={estilos.contenedorPrincipal}>
      <StatusBar barStyle="light-content" backgroundColor={COLORES.fondo} />
      <FondoAurora />

      <ScrollView contentContainerStyle={estilos.contenedorContenido} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            opacity: animacionOpacidad,
            transform: [{ translateY: animacionTraslado }],
            width: '100%',
          }}
        >
          <MarcaNexxus tamano={28} />

          <View style={estilos.cuerpoTexto}>
            <AuraOrb size={112} style={estilos.orbeRol} />
            <Text style={estilos.titulo}>{t('seleccionRol.title')}</Text>
            <Text style={estilos.subtitulo}>{t('seleccionRol.subtitle')}</Text>
          </View>

          <View style={estilos.listaRoles}>
            {roles.map((rol) => {
              const activo = rolActivo === rol.id;
              return (
                <TouchableOpacity
                  key={rol.id}
                  onPress={() => setRolActivo(rol.id)}
                  activeOpacity={0.86}
                  style={[estilos.tarjetaRol, activo && { borderColor: rol.acento }]}
                >
                  {activo && <LinearGradient colors={['rgba(124,77,255,0.18)', 'rgba(79,140,255,0.1)']} style={StyleSheet.absoluteFill} />}
                  <View style={[estilos.iconoRolContenedor, { backgroundColor: activo ? rol.acento : COLORES.superficieSuave }]}>
                    <MaterialIcons name={rol.icono} size={26} color={activo ? COLORES.textoInverso : COLORES.textoSecundario} />
                  </View>
                  <View style={estilos.textoRol}>
                    <Text style={[estilos.tituloRol, activo && { color: rol.acento }]}>{rol.titulo}</Text>
                    <Text style={estilos.descripcionRol}>{rol.descripcion}</Text>
                  </View>
                  <View style={[estilos.indicadorSeleccion, activo && { backgroundColor: rol.acento, borderColor: rol.acento }]}>
                    {activo && <MaterialIcons name="check" size={14} color={COLORES.textoInverso} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity onPress={manejarContinuar} activeOpacity={0.88} style={estilos.botonContinuar}>
            <LinearGradient colors={[COLORES.primario, COLORES.primarioFuerte, COLORES.secundario]} style={estilos.gradiente} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={estilos.textoBoton}>{t('comenzar.btn_continue')}</Text>
              <MaterialIcons name="arrow-forward" size={18} color={COLORES.textoInverso} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedorPrincipal: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  contenedorContenido: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: ESPACIADO.xl,
  },
  cuerpoTexto: {
    marginTop: ESPACIADO.xxxl,
    marginBottom: ESPACIADO.xl,
    gap: ESPACIADO.md,
    alignItems: 'center',
  },
  orbeRol: {
    marginBottom: ESPACIADO.md,
  },
  titulo: {
    ...TIPOGRAFIA.tituloPantalla,
    color: COLORES.texto,
    textAlign: 'center',
  },
  subtitulo: {
    ...TIPOGRAFIA.cuerpoGrande,
    color: COLORES.textoSecundario,
    textAlign: 'center',
  },
  listaRoles: {
    gap: ESPACIADO.md,
    marginBottom: ESPACIADO.xl,
  },
  tarjetaRol: {
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: ESPACIADO.lg,
    backgroundColor: COLORES.superficieVidrio,
    borderRadius: RADIOS.xl,
    borderWidth: 1,
    borderColor: COLORES.borde,
    ...SOMBRAS.tarjeta,
  },
  iconoRolContenedor: {
    width: 56,
    height: 56,
    borderRadius: RADIOS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ESPACIADO.md,
  },
  textoRol: {
    flex: 1,
    gap: 4,
  },
  tituloRol: {
    ...TIPOGRAFIA.tituloTarjeta,
    color: COLORES.texto,
  },
  descripcionRol: {
    ...TIPOGRAFIA.cuerpo,
    color: COLORES.textoSecundario,
  },
  indicadorSeleccion: {
    width: 24,
    height: 24,
    borderRadius: RADIOS.completo,
    borderWidth: 1,
    borderColor: COLORES.bordeFuerte,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonContinuar: {
    borderRadius: RADIOS.lg,
    overflow: 'hidden',
    ...SOMBRAS.flotante,
  },
  gradiente: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ESPACIADO.xs,
  },
  textoBoton: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORES.textoInverso,
  },
});
