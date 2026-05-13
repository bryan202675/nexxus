import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

import BotonAnimado from '@/presentation/components/BotonAnimado';
import { COLORES, ESPACIADO, RADIOS, TIPOGRAFIA } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';

interface Props {
  navigation: any;
}

type IconoFeather = React.ComponentProps<typeof Feather>['name'];

export default function PerfilLaboral({ navigation }: Props) {
  const { perfil, cerrarSesion, actualizarFotoPerfil } = useContextoUsuario();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(22)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 520, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 46, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const [subiendoFoto, setSubiendoFoto] = useState(false);

  if (!perfil) return null;

  const inicial = perfil.nombre?.charAt(0).toUpperCase() || 'U';
  const estadoActivo = perfil.activo !== false && perfil.estado_activo !== false;
  const kpis = perfil.kpis || [];
  const habilidades = perfil.habilidades || [];
  const historial = perfil.historial_laboral || [];
  const permisosModulos = perfil.permisos?.modulos || [];
  const permisosSedes = perfil.permisos?.sedes || [];
  const salario = typeof perfil.salarioBase === 'number'
    ? `$${Math.round(perfil.salarioBase).toLocaleString('en-US')}`
    : 'No definido';
  const vacaciones = typeof perfil.dias_vacaciones_disponibles === 'number'
    ? `${perfil.dias_vacaciones_disponibles} días`
    : 'No definido';

  const datosLaborales: { label: string; valor: string; icono: IconoFeather }[] = [
    { label: 'Rol', valor: perfil.rol || 'Empleado', icono: 'shield' },
    { label: 'Cargo', valor: perfil.cargo || 'No definido', icono: 'briefcase' },
    { label: 'Departamento', valor: perfil.departamento || 'No asignado', icono: 'grid' },
    { label: 'Sede', valor: perfil.sede || 'No asignada', icono: 'map-pin' },
  ];

  const datosContacto: { label: string; valor: string; icono: IconoFeather }[] = [
    { label: 'Correo', valor: perfil.correo || 'No registrado', icono: 'mail' },
    { label: 'Teléfono', valor: perfil.telefono || 'No registrado', icono: 'phone' },
    { label: 'Jefe directo', valor: perfil.jefeNombre || 'No asignado', icono: 'user-check' },
    { label: 'Empresa', valor: perfil.empresa || 'No registrada', icono: 'layers' },
  ];

  const datosOperativos: { label: string; valor: string; icono: IconoFeather }[] = [
    { label: 'Horario', valor: perfil.horario_laboral || 'No definido', icono: 'clock' },
    { label: 'Vacaciones', valor: vacaciones, icono: 'calendar' },
    { label: 'Salario base', valor: salario, icono: 'credit-card' },
    { label: 'Último check-in', valor: perfil.ultimoCheckIn ? new Date(perfil.ultimoCheckIn).toLocaleDateString('es-SV') : 'Sin registro', icono: 'check-circle' },
  ];

  const cerrarSesionPerfil = async () => {
    await cerrarSesion();
  };

  const seleccionarYSubirFoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setSubiendoFoto(true);

        const response = await fetch(imageUri);
        const blob = await response.blob();

        await actualizarFotoPerfil(blob);
        Alert.alert('Éxito', 'Foto de perfil actualizada correctamente');
      }
    } catch (e) {
      console.error('Error al subir foto:', e);
      Alert.alert('Error', 'No se pudo actualizar la foto de perfil');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const renderTarjetaDato = (item: { label: string; valor: string; icono: IconoFeather }) => (
    <View key={`${item.label}-${item.valor}`} style={estilos.tarjetaDato}>
      <Feather name={item.icono} size={16} color={COLORES.textoSuave} />
      <View style={estilos.contenidoDato}>
        <Text style={estilos.labelDato}>{item.label}</Text>
        <Text style={estilos.valorDato} numberOfLines={2}>{item.valor}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <LinearGradient colors={[COLORES.fondoOscuro, COLORES.fondo]} style={StyleSheet.absoluteFill} />
        <View style={estilos.luzFondo1} />
        <View style={estilos.luzFondo2} />
      </View>

      <View style={estilos.headerCompacto}>
        <BotonAnimado onPress={() => navigation.goBack()} style={estilos.botonCircular}>
          <Feather name="arrow-left" size={20} color={COLORES.texto} />
        </BotonAnimado>
        <View>
          <Text style={estilos.tituloPantalla}>Mi Perfil</Text>
          <Text style={estilos.subtituloPantalla}>Expediente laboral</Text>
        </View>
        <View style={estilos.espaciadorHeader} />
      </View>

      <Animated.ScrollView
        contentContainerStyle={estilos.scroll}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <View style={[estilos.cardVidrio, estilos.cardPrincipal]}>
          <BlurView intensity={18} tint="dark" style={estilos.cardContenido}>
            <View style={estilos.perfilHeader}>
              <View style={estilos.avatarContenedor}>
                {perfil.foto_perfil ? (
                  <Image source={{ uri: perfil.foto_perfil }} style={estilos.avatar} />
                ) : (
                  <View style={estilos.avatarPlaceholder}>
                    <Text style={estilos.avatarLetra}>{inicial}</Text>
                  </View>
                )}
                <View style={[estilos.puntoEstado, estadoActivo ? estilos.estadoActivo : estilos.estadoInactivo]} />
              </View>

              <View style={estilos.infoUsuario}>
                <Text style={estilos.nombre} numberOfLines={2}>{perfil.nombre}</Text>
                <Text style={estilos.puesto} numberOfLines={1}>{perfil.cargo || perfil.departamento || perfil.rol}</Text>
                <View style={estilos.filaBadges}>
                  <View style={[estilos.badgeEstado, estadoActivo ? estilos.badgeActivo : estilos.badgeInactivo]}>
                    <Text style={[estilos.textoBadgeEstado, estadoActivo ? estilos.textoActivo : estilos.textoInactivo]}>
                      {estadoActivo ? 'Activo' : 'Inactivo'}
                    </Text>
                  </View>
                  <View style={estilos.badgeEmpresa}>
                    <Feather name="briefcase" size={12} color={COLORES.textoSuave} />
                    <Text style={estilos.textoEmpresa}>{perfil.empresa || 'Empresa'}</Text>
                  </View>
                </View>
              </View>
            </View>
          </BlurView>
        </View>

        <View style={estilos.gridResumen}>
          {datosLaborales.map(renderTarjetaDato)}
        </View>

        <View style={estilos.seccion}>
          <View style={estilos.encabezadoSeccion}>
            <Feather name="activity" size={17} color={COLORES.textoSuave} />
            <Text style={estilos.tituloSeccion}>Operación diaria</Text>
          </View>
          <View style={estilos.gridResumen}>
            {datosOperativos.map(renderTarjetaDato)}
          </View>
        </View>

        <View style={[estilos.cardVidrio, estilos.cardCompleta]}>
          <BlurView intensity={18} tint="dark" style={estilos.cardContenido}>
            <View style={estilos.encabezadoSeccion}>
              <Feather name="user" size={17} color={COLORES.textoSuave} />
              <Text style={estilos.tituloSeccion}>Contacto y relación laboral</Text>
            </View>
            <View style={estilos.listaDatos}>
              {datosContacto.map((item) => (
                <View key={item.label} style={estilos.filaInfo}>
                  <View style={estilos.iconoInfo}>
                    <Feather name={item.icono} size={16} color={COLORES.textoSuave} />
                  </View>
                  <View style={estilos.infoLinea}>
                    <Text style={estilos.labelLinea}>{item.label}</Text>
                    <Text style={estilos.valorLinea} numberOfLines={2}>{item.valor}</Text>
                  </View>
                </View>
              ))}
            </View>
          </BlurView>
        </View>

        <View style={estilos.seccion}>
          <View style={estilos.encabezadoSeccion}>
            <Feather name="trending-up" size={17} color={COLORES.textoSuave} />
            <Text style={estilos.tituloSeccion}>Indicadores asignados</Text>
          </View>
          {kpis.length > 0 ? (
            <View style={estilos.gridKpis}>
              {kpis.map((kpi) => {
                const avance = Math.min(100, Math.max(0, Math.round((Number(kpi.valor) / Math.max(Number(kpi.meta), 1)) * 100)));
                return (
                  <View key={kpi.nombre} style={estilos.cardVidrio}>
                    <BlurView intensity={18} tint="dark" style={estilos.cardContenido}>
                      <Text style={estilos.tituloKpi}>{kpi.nombre}</Text>
                      <Text style={estilos.valorKpi}>{kpi.valor}{kpi.unidad}</Text>
                      <View style={estilos.barraFondoKpi}>
                        <View style={[estilos.barraProgresoKpi, { width: `${avance}%` }]} />
                      </View>
                      <Text style={estilos.metaKpi}>Meta {kpi.meta}{kpi.unidad}</Text>
                    </BlurView>
                  </View>
                );
              })}
            </View>
          ) : (
            <EstadoVacio icono="bar-chart-2" texto="Sin KPIs asignados por RRHH." />
          )}
        </View>

        <View style={[estilos.cardVidrio, estilos.cardCompleta]}>
          <BlurView intensity={18} tint="dark" style={estilos.cardContenido}>
            <View style={estilos.encabezadoSeccion}>
              <Feather name="sliders" size={17} color={COLORES.textoSuave} />
              <Text style={estilos.tituloSeccion}>Permisos y habilidades</Text>
            </View>
            <Text style={estilos.labelGrupo}>Módulos autorizados</Text>
            <View style={estilos.contenedorChips}>
              {permisosModulos.length > 0 ? permisosModulos.map((modulo) => (
                <View key={modulo} style={estilos.chip}>
                  <Text style={estilos.textoChip}>{modulo}</Text>
                </View>
              )) : <Text style={estilos.textoVacioInline}>Sin permisos personalizados.</Text>}
            </View>

            {permisosSedes.length > 0 && (
              <>
                <View style={estilos.divisorHorizontal} />
                <Text style={estilos.labelGrupo}>Sedes permitidas</Text>
                <View style={estilos.contenedorChips}>
                  {permisosSedes.map((sede) => (
                    <View key={sede} style={estilos.chipSecundario}>
                      <Text style={estilos.textoChip}>{sede}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <View style={estilos.divisorHorizontal} />
            <Text style={estilos.labelGrupo}>Habilidades registradas</Text>
            <View style={estilos.contenedorChips}>
              {habilidades.length > 0 ? habilidades.map((habilidad) => (
                <View key={habilidad} style={estilos.chip}>
                  <Text style={estilos.textoChip}>{habilidad}</Text>
                </View>
              )) : <Text style={estilos.textoVacioInline}>Sin habilidades registradas.</Text>}
            </View>
          </BlurView>
        </View>

        <View style={estilos.seccion}>
          <View style={estilos.encabezadoSeccion}>
            <Feather name="clock" size={17} color={COLORES.textoSuave} />
            <Text style={estilos.tituloSeccion}>Línea de tiempo laboral</Text>
          </View>
          {historial.length > 0 ? (
            <View style={[estilos.cardVidrio, estilos.cardCompleta]}>
              <BlurView intensity={18} tint="dark" style={estilos.cardContenido}>
                {historial.map((hist, index) => (
                  <View key={`${hist.puesto}-${hist.fecha}-${index}`} style={estilos.itemHistorial}>
                    <View style={estilos.timelineLinea}>
                      <View style={estilos.timelinePunto} />
                      {index !== historial.length - 1 && <View style={estilos.timelineRaya} />}
                    </View>
                    <View style={estilos.historialContenido}>
                      <Text style={estilos.historialPuesto}>{hist.puesto}</Text>
                      <Text style={estilos.historialAccion}>{hist.accion}</Text>
                      <Text style={estilos.historialFecha}>
                        {hist.fecha ? new Date(hist.fecha).toLocaleDateString('es-SV') : 'Sin fecha'}
                      </Text>
                    </View>
                  </View>
                ))}
              </BlurView>
            </View>
          ) : (
            <EstadoVacio icono="archive" texto="Sin historial laboral registrado." />
          )}
        </View>

        <BotonAnimado onPress={cerrarSesionPerfil} style={estilos.botonCerrarSesion}>
          <BlurView intensity={18} tint="dark" style={estilos.contenidoCerrarSesion}>
            <View style={estilos.iconoCerrarSesion}>
              <Feather name="log-out" size={18} color={COLORES.error} />
            </View>
            <View style={estilos.textosCerrarSesion}>
              <Text style={estilos.tituloCerrarSesion}>Cerrar sesión</Text>
              <Text style={estilos.subtituloCerrarSesion}>Salir de esta cuenta en este dispositivo</Text>
            </View>
            <Feather name="chevron-right" size={18} color={COLORES.textoSuave} />
          </BlurView>
        </BotonAnimado>

        <View style={{ height: 120 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function EstadoVacio({ icono, texto }: { icono: IconoFeather; texto: string }) {
  return (
    <View style={estilos.estadoVacio}>
      <BlurView intensity={18} tint="dark" style={estilos.estadoVacioContenido}>
        <Feather name={icono} size={20} color={COLORES.textoSuave} />
        <Text style={estilos.textoEstadoVacio}>{texto}</Text>
      </BlurView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },
  fondoAbsoluto: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },
  luzFondo1: { position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: COLORES.primario, opacity: 0.14 },
  luzFondo2: { position: 'absolute', top: '31%', right: -160, width: 390, height: 390, borderRadius: 195, backgroundColor: COLORES.primarioFuerte, opacity: 0.12 },
  headerCompacto: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.md, paddingBottom: ESPACIADO.sm },
  botonCircular: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.045)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.borde },
  espaciadorHeader: { width: 38, height: 38 },
  tituloPantalla: { ...TIPOGRAFIA.tituloSeccion, color: COLORES.texto, fontSize: 21, textAlign: 'center', letterSpacing: -0.4 },
  subtituloPantalla: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, textAlign: 'center', marginTop: 2 },
  scroll: { paddingHorizontal: ESPACIADO.lg, paddingTop: ESPACIADO.md },
  cardVidrio: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.025)' },
  cardCompleta: { width: '100%' },
  cardPrincipal: { marginBottom: ESPACIADO.md },
  cardContenido: { padding: ESPACIADO.lg, overflow: 'hidden' },
  perfilHeader: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.lg },
  avatarContenedor: { width: 78, height: 78, borderRadius: 39, position: 'relative' },
  avatar: { width: '100%', height: '100%', borderRadius: 39 },
  avatarPlaceholder: { flex: 1, backgroundColor: 'rgba(124,58,237,0.18)', borderRadius: 39, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORES.bordeFuerte },
  avatarLetra: { fontSize: 30, fontWeight: '800', color: COLORES.texto },
  botonCambiarFoto: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORES.primario,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORES.fondo,
    zIndex: 10,
  },
  estadoActivo: { backgroundColor: COLORES.exito },
  estadoInactivo: { backgroundColor: COLORES.textoSuave },
  infoUsuario: { flex: 1, justifyContent: 'center' },
  nombre: { ...TIPOGRAFIA.tituloSeccion, color: COLORES.texto, fontSize: 24, letterSpacing: -0.6 },
  puesto: { ...TIPOGRAFIA.cuerpo, color: COLORES.textoSecundario, marginTop: 2 },
  filaBadges: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: ESPACIADO.xs, marginTop: ESPACIADO.sm },
  badgeEstado: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIOS.completo, borderWidth: 1 },
  badgeActivo: { backgroundColor: 'rgba(34,197,94,0.10)', borderColor: 'rgba(34,197,94,0.24)' },
  badgeInactivo: { backgroundColor: 'rgba(148,163,184,0.10)', borderColor: 'rgba(148,163,184,0.22)' },
  textoBadgeEstado: { ...TIPOGRAFIA.micro, fontSize: 10 },
  textoActivo: { color: COLORES.exito },
  textoInactivo: { color: COLORES.textoSuave },
  badgeEmpresa: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIOS.completo, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: COLORES.borde },
  textoEmpresa: { ...TIPOGRAFIA.micro, color: COLORES.textoSecundario, fontSize: 10 },
  gridResumen: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.sm, marginBottom: ESPACIADO.lg },
  tarjetaDato: { width: '48.5%', minHeight: 104, borderRadius: RADIOS.xl, padding: ESPACIADO.md, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: COLORES.borde, justifyContent: 'space-between' },
  contenidoDato: { gap: 4 },
  labelDato: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, fontSize: 10 },
  valorDato: { ...TIPOGRAFIA.cuerpo, color: COLORES.texto, fontWeight: '700', lineHeight: 18 },
  seccion: { marginBottom: ESPACIADO.lg },
  encabezadoSeccion: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.xs, marginBottom: ESPACIADO.md },
  tituloSeccion: { ...TIPOGRAFIA.tituloTarjeta, color: COLORES.texto, fontSize: 16, letterSpacing: -0.2 },
  listaDatos: { gap: ESPACIADO.sm },
  filaInfo: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.sm, paddingVertical: ESPACIADO.xs },
  iconoInfo: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: COLORES.borde },
  infoLinea: { flex: 1 },
  labelLinea: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, fontSize: 10 },
  valorLinea: { ...TIPOGRAFIA.cuerpo, color: COLORES.texto, fontWeight: '700', marginTop: 2 },
  gridKpis: { gap: ESPACIADO.sm },
  tituloKpi: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, fontSize: 10, marginBottom: 7 },
  valorKpi: { ...TIPOGRAFIA.tituloSeccion, color: COLORES.texto, fontSize: 25, marginBottom: ESPACIADO.sm },
  barraFondoKpi: { height: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  barraProgresoKpi: { height: '100%', backgroundColor: COLORES.primario, borderRadius: 3 },
  metaKpi: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, marginTop: ESPACIADO.xs, fontSize: 10 },
  labelGrupo: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, fontSize: 10, marginBottom: ESPACIADO.xs },
  contenedorChips: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACIADO.xs },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIOS.completo, backgroundColor: 'rgba(124,58,237,0.12)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.22)' },
  chipSecundario: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIOS.completo, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: COLORES.borde },
  textoChip: { ...TIPOGRAFIA.micro, color: COLORES.texto, fontSize: 10 },
  textoVacioInline: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSuave },
  divisorHorizontal: { height: 1, backgroundColor: COLORES.borde, marginVertical: ESPACIADO.md },
  itemHistorial: { flexDirection: 'row' },
  timelineLinea: { width: 28, alignItems: 'center' },
  timelinePunto: { width: 9, height: 9, borderRadius: 5, backgroundColor: COLORES.primario, marginTop: 7 },
  timelineRaya: { width: 1.5, flex: 1, minHeight: 40, backgroundColor: COLORES.borde, marginTop: 5 },
  historialContenido: { flex: 1, paddingBottom: ESPACIADO.lg },
  historialPuesto: { ...TIPOGRAFIA.cuerpo, color: COLORES.texto, fontWeight: '800' },
  historialAccion: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSecundario, marginTop: 3 },
  historialFecha: { ...TIPOGRAFIA.micro, color: COLORES.textoSuave, marginTop: 6, fontSize: 10 },
  estadoVacio: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: COLORES.borde, backgroundColor: 'rgba(255,255,255,0.025)' },
  estadoVacioContenido: { minHeight: 92, alignItems: 'center', justifyContent: 'center', gap: ESPACIADO.xs, padding: ESPACIADO.lg },
  textoEstadoVacio: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSuave, textAlign: 'center' },
  botonCerrarSesion: { borderRadius: RADIOS.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', backgroundColor: 'rgba(239,68,68,0.055)', marginTop: ESPACIADO.sm },
  contenidoCerrarSesion: { flexDirection: 'row', alignItems: 'center', gap: ESPACIADO.md, padding: ESPACIADO.lg },
  iconoCerrarSesion: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.18)' },
  textosCerrarSesion: { flex: 1 },
  tituloCerrarSesion: { ...TIPOGRAFIA.cuerpo, color: COLORES.error, fontWeight: '800' },
  subtituloCerrarSesion: { ...TIPOGRAFIA.cuerpoPequeno, color: COLORES.textoSuave, marginTop: 2 },
});
