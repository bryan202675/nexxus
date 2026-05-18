import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Animated, Easing, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Edit3, MapPin, Plus, Search, Trash2, Users, X } from 'lucide-react-native';
import { db } from '@/infrastructure/firebase/firebaseConfig';
import { useAuth } from '@/presentation/hooks/useAuth';
import { ADMIN, sombraAdmin, sombraVioleta, useAdminAppearance } from './adminTheme';
import { obtenerEmpresaIdAdmin } from './adminUtils';

type VistaCalendario = 'mes' | 'semana' | 'dia' | 'agenda';
type TipoEvento = 'reunion' | 'recordatorio' | 'capacitacion' | 'vacaciones' | 'turno' | 'corporativo';

type EventoCalendario = {
  id?: string;
  titulo: string;
  descripcion?: string;
  tipo: TipoEvento;
  inicio: any;
  fin: any;
  empleadoIds?: string[];
  empleadoNombres?: string[];
  departamentoIds?: string[];
  departamentos?: string[];
  sedeIds?: string[];
  sedes?: string[];
  empresaId?: string;
  creadoPor?: string;
  creadoEn?: any;
  actualizadoEn?: any;
};

type Catalogo = {
  id?: string;
  nombre?: string;
  name?: string;
  correo?: string;
  activo?: boolean;
  estado_activo?: boolean;
  empresaId?: string;
};

type FormularioEvento = {
  titulo: string;
  descripcion: string;
  tipo: TipoEvento;
  inicio: string;
  fin: string;
  empleadoIds: string;
  departamentos: string;
  sedes: string;
};

const BRAND = {
  fondo: ADMIN.fondo,
  superficie: ADMIN.superficie,
  primario: ADMIN.primario,
  primarioClaro: ADMIN.primarioClaro,
  texto: ADMIN.texto,
  textoSecundario: ADMIN.textoSecundario,
  violeta: ADMIN.violeta,
  azul: ADMIN.azul,
  exito: ADMIN.exito,
  alerta: ADMIN.alerta,
  error: ADMIN.error,
  cyan: ADMIN.cyan,
};

const formatoInput = (fecha: Date) => {
  const pad = (valor: number) => String(valor).padStart(2, '0');
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
};

const convertirFecha = (valor: any): Date | null => {
  if (!valor) return null;
  if (typeof valor?.toDate === 'function') return valor.toDate();
  if (typeof valor?.seconds === 'number') return new Date(valor.seconds * 1000);
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

const parsearInput = (valor: string): Date | null => {
  const normalizado = valor.trim().replace(' ', 'T');
  const fecha = new Date(normalizado);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

const inicioDia = (fecha: Date) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
const mismoDia = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const dividirLista = (valor: string) => valor.split(',').map((item) => item.trim()).filter(Boolean);

const formularioBase = (): FormularioEvento => {
  const inicio = new Date();
  inicio.setMinutes(0, 0, 0);
  const fin = new Date(inicio);
  fin.setHours(fin.getHours() + 1);
  return {
    titulo: '',
    descripcion: '',
    tipo: 'reunion',
    inicio: formatoInput(inicio),
    fin: formatoInput(fin),
    empleadoIds: '',
    departamentos: '',
    sedes: '',
  };
};

const CalendarioEmpresarial: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useAdminAppearance();
  
  const tiposEvento = useMemo(() => [
    { id: 'reunion' as TipoEvento, label: t('admin.calendario.tipos.reunion'), color: BRAND.azul },
    { id: 'recordatorio' as TipoEvento, label: t('admin.calendario.tipos.recordatorio'), color: BRAND.alerta },
    { id: 'capacitacion' as TipoEvento, label: t('admin.calendario.tipos.capacitacion'), color: BRAND.violeta },
    { id: 'vacaciones' as TipoEvento, label: t('admin.calendario.tipos.vacaciones'), color: BRAND.exito },
    { id: 'turno' as TipoEvento, label: t('admin.calendario.tipos.turno'), color: BRAND.cyan },
    { id: 'corporativo' as TipoEvento, label: t('admin.calendario.tipos.corporativo'), color: BRAND.primarioClaro },
  ], [t]);
  const { user } = useAuth();
  const empresaId = obtenerEmpresaIdAdmin(user);
  
  const nombreMes = (fecha: Date) => fecha.toLocaleDateString(i18n.language === 'es' ? 'es-SV' : 'en-US', { month: 'long', year: 'numeric' });
  const nombreCorto = (fecha: Date) => fecha.toLocaleDateString(i18n.language === 'es' ? 'es-SV' : 'en-US', { weekday: 'short', day: 'numeric' });

  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [usuarios, setUsuarios] = useState<Catalogo[]>([]);
  const [departamentos, setDepartamentos] = useState<Catalogo[]>([]);
  const [sedes, setSedes] = useState<Catalogo[]>([]);
  const [vista, setVista] = useState<VistaCalendario>('mes');
  const [fechaActiva, setFechaActiva] = useState(new Date());
  const [busqueda, setBusqueda] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<EventoCalendario | null>(null);
  const [formulario, setFormulario] = useState<FormularioEvento>(formularioBase());
  const [pickerActivo, setPickerActivo] = useState<'inicio' | 'fin' | 'empleados' | 'departamentos' | 'sedes' | null>(null);
  const [fechaPicker, setFechaPicker] = useState(new Date());
  const entrada = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 620,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrada]);

  useEffect(() => {
    if (!empresaId) return;
    const consultas = [
      onSnapshot(query(collection(db, 'calendario_empresarial'), where('empresaId', '==', empresaId)), (snapshot) => {
        setEventos(snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() } as EventoCalendario)));
      }),
      onSnapshot(query(collection(db, 'usuarios'), where('empresaId', '==', empresaId)), (snapshot) => {
        setUsuarios(snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() } as Catalogo)));
      }),
      onSnapshot(query(collection(db, 'departments'), where('empresaId', '==', empresaId)), (snapshot) => {
        setDepartamentos(snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() } as Catalogo)));
      }),
      onSnapshot(query(collection(db, 'sedes'), where('empresaId', '==', empresaId)), (snapshot) => {
        setSedes(snapshot.docs.map((documento) => ({ id: documento.id, ...documento.data() } as Catalogo)));
      }),
    ];
    return () => consultas.forEach((desuscribir) => desuscribir());
  }, [empresaId]);

  const eventosNormalizados = useMemo(() => eventos
    .map((evento) => ({ ...evento, fechaInicio: convertirFecha(evento.inicio), fechaFin: convertirFecha(evento.fin) }))
    .filter((evento) => evento.fechaInicio && evento.fechaFin)
    .sort((a, b) => (a.fechaInicio?.getTime() || 0) - (b.fechaInicio?.getTime() || 0)), [eventos]);

  const eventosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return eventosNormalizados;
    return eventosNormalizados.filter((evento) => [
      evento.titulo,
      evento.descripcion,
      evento.tipo,
      ...(evento.empleadoNombres || []),
      ...(evento.departamentos || []),
      ...(evento.sedes || []),
    ].join(' ').toLowerCase().includes(texto));
  }, [busqueda, eventosNormalizados]);

  const diasMes = useMemo(() => {
    const primero = new Date(fechaActiva.getFullYear(), fechaActiva.getMonth(), 1);
    const inicio = new Date(primero);
    inicio.setDate(primero.getDate() - primero.getDay());
    return Array.from({ length: 42 }, (_, indice) => {
      const dia = new Date(inicio);
      dia.setDate(inicio.getDate() + indice);
      return dia;
    });
  }, [fechaActiva]);

  const diasSemana = useMemo(() => {
    const base = inicioDia(fechaActiva);
    const inicio = new Date(base);
    inicio.setDate(base.getDate() - base.getDay());
    return Array.from({ length: 7 }, (_, indice) => {
      const dia = new Date(inicio);
      dia.setDate(inicio.getDate() + indice);
      return dia;
    });
  }, [fechaActiva]);

  const resumen = useMemo(() => {
    const hoy = new Date();
    const hoyEventos = eventosNormalizados.filter((evento) => evento.fechaInicio && mismoDia(evento.fechaInicio, hoy)).length;
    const semanaEventos = eventosNormalizados.filter((evento) => evento.fechaInicio && diasSemana.some((dia) => mismoDia(dia, evento.fechaInicio!))).length;
    const asignados = new Set(eventosNormalizados.flatMap((evento) => evento.empleadoIds || [])).size;
    return { hoyEventos, semanaEventos, asignados, total: eventosNormalizados.length };
  }, [diasSemana, eventosNormalizados]);

  const abrirCrear = (fecha?: Date) => {
    const base = formularioBase();
    if (fecha) {
      const inicio = new Date(fecha);
      inicio.setHours(9, 0, 0, 0);
      const fin = new Date(inicio);
      fin.setHours(10);
      base.inicio = formatoInput(inicio);
      base.fin = formatoInput(fin);
      setFechaPicker(new Date(inicio));
    } else {
      setFechaPicker(new Date());
    }
    setEventoEditando(null);
    setFormulario(base);
    setModalVisible(true);
  };

  const abrirEditar = (evento: EventoCalendario) => {
    const fInicio = convertirFecha(evento.inicio) || new Date();
    setEventoEditando(evento);
    setFechaPicker(new Date(fInicio));
    setFormulario({
      titulo: evento.titulo || '',
      descripcion: evento.descripcion || '',
      tipo: evento.tipo || 'reunion',
      inicio: formatoInput(fInicio),
      fin: formatoInput(convertirFecha(evento.fin) || new Date()),
      empleadoIds: (evento.empleadoIds || []).join(', '),
      departamentos: (evento.departamentoIds || []).join(', '),
      sedes: (evento.sedeIds || []).join(', '),
    });
    setModalVisible(true);
  };

  const guardarEvento = async () => {
    if (!empresaId) return;
    const inicio = convertirFecha(formulario.inicio) || new Date();
    const fin = convertirFecha(formulario.fin) || new Date();
    if (!formulario.titulo.trim() || !inicio || !fin || fin < inicio) {
      Alert.alert(t('admin.calendario.alert_revisa_titulo'), t('admin.calendario.alert_revisa_msg'));
      return;
    }

    const empleadoIds = dividirLista(formulario.empleadoIds);
    const empleadosPorId = new Map(usuarios.map((usuario) => [usuario.id, usuario.nombre || usuario.correo || 'Empleado']));
    
    const deptoIds = dividirLista(formulario.departamentos);
    const deptosPorId = new Map(departamentos.map((d) => [d.id, d.nombre || d.name || 'Depto']));
    
    const sedeIds = dividirLista(formulario.sedes);
    const sedesPorId = new Map(sedes.map((s) => [s.id, s.nombre || s.name || 'Sede']));

    const datos = {
      titulo: formulario.titulo.trim(),
      descripcion: formulario.descripcion.trim(),
      tipo: formulario.tipo,
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      empleadoIds,
      empleadoNombres: empleadoIds.map((id) => empleadosPorId.get(id) || id),
      departamentoIds: deptoIds,
      departamentos: deptoIds.map((id) => deptosPorId.get(id) || id),
      sedeIds: sedeIds,
      sedes: sedeIds.map((id) => sedesPorId.get(id) || id),
      empresaId,
      actualizadoEn: serverTimestamp(),
    };

    if (eventoEditando?.id) {
      await updateDoc(doc(db, 'calendario_empresarial', eventoEditando.id), datos);
    } else {
      await addDoc(collection(db, 'calendario_empresarial'), {
        ...datos,
        creadoPor: user?.id || (user as any)?.uid || user?.correo || 'admin',
        creadoEn: serverTimestamp(),
      });
    }
    setModalVisible(false);
  };

  const eliminarEvento = async (evento: EventoCalendario) => {
    const eventoId = evento.id;
    if (!eventoId) return;
    const confirmar = async () => deleteDoc(doc(db, 'calendario_empresarial', eventoId));
    Alert.alert(t('admin.calendario.btn_delete'), `${t('common.delete')} "${evento.titulo}"?`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: confirmar },
    ]);
  };

  const moverFecha = (direccion: number) => {
    const nueva = new Date(fechaActiva);
    if (vista === 'mes') nueva.setMonth(nueva.getMonth() + direccion);
    if (vista === 'semana') nueva.setDate(nueva.getDate() + direccion * 7);
    if (vista === 'dia' || vista === 'agenda') nueva.setDate(nueva.getDate() + direccion);
    setFechaActiva(nueva);
  };

  const eventosPorDia = (dia: Date) => eventosFiltrados.filter((evento) => evento.fechaInicio && mismoDia(evento.fechaInicio, dia));
  const colorTipo = (tipo: TipoEvento) => tiposEvento.find((item) => item.id === tipo)?.color || BRAND.violeta;

    const EventoCard = ({ evento, color, onEditar, onEliminar, amplio }: { evento: EventoCalendario & { fechaInicio?: Date | null; fechaFin?: Date | null }; color: string; onEditar: () => void; onEliminar: () => void; amplio?: boolean }) => (
      <TouchableOpacity onPress={onEditar} activeOpacity={0.9} style={[estilos.eventoCard, amplio && estilos.eventoCardAmplio, { borderColor: `${color}55` }]}>
        <View style={[estilos.eventoBorde, { backgroundColor: color }]} />
        <View style={estilos.eventoContenido}>
          <View style={estilos.eventoHeader}>
            <Text style={estilos.eventoTitulo} numberOfLines={1}>{evento.titulo}</Text>
            <Text style={[estilos.eventoTipo, { color }]}>{tiposEvento.find((tipo) => tipo.id === evento.tipo)?.label}</Text>
          </View>
          <View style={estilos.eventoHoraRow}>
            <Clock3 size={12} color={BRAND.textoSecundario} />
            <Text style={estilos.eventoHora}>{evento.fechaInicio?.toLocaleString('es-SV', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          {!!evento.descripcion && <Text style={estilos.eventoDescripcion} numberOfLines={2}>{evento.descripcion}</Text>}
          <Text style={estilos.eventoMeta} numberOfLines={1}>{[...(evento.empleadoNombres || []), ...(evento.departamentos || []), ...(evento.sedes || [])].join(' · ') || 'Sin asignaciones específicas'}</Text>
        </View>
        <View style={estilos.eventoAcciones}>
          <TouchableOpacity onPress={onEditar} style={[estilos.accionIcono, estilos.accionIconoEditar]}><Edit3 size={14} color={ADMIN.iconos.documentos} /></TouchableOpacity>
          <TouchableOpacity onPress={onEliminar} style={[estilos.accionIcono, estilos.accionIconoEliminar]}><Trash2 size={14} color={ADMIN.iconos.peligro} /></TouchableOpacity>
        </View>
      </TouchableOpacity>
    );

    const Campo = ({ label, ...props }: any) => (
      <View style={estilos.campo}>
        <Text style={[estilos.inputLabel, { color: theme.muted }]}>{label}</Text>
        <TextInput 
          {...props} 
          placeholderTextColor={theme.isDark ? 'rgba(255,255,255,0.36)' : 'rgba(23,18,43,0.38)'} 
          style={[
            estilos.input, 
            { 
              backgroundColor: theme.isDark ? 'rgba(0,0,0,0.22)' : 'rgba(82,58,150,0.05)',
              borderColor: theme.border,
              color: theme.text
            }, 
            props.multiline && estilos.inputMultiline
          ]} 
        />
      </View>
    );

    const Selector = ({ label, valor, alPresionar, icono: Icono, placeholder }: any) => (
      <TouchableOpacity onPress={alPresionar} activeOpacity={0.7} style={estilos.campo}>
        <Text style={[estilos.inputLabel, { color: theme.muted }]}>{label}</Text>
        <View style={[
          estilos.inputSelector, 
          { 
            backgroundColor: theme.isDark ? 'rgba(0,0,0,0.22)' : 'rgba(82,58,150,0.05)',
            borderColor: theme.border
          }
        ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {Icono && <Icono size={16} color={theme.muted} style={{ marginRight: 10 }} />}
            <Text style={[
              estilos.selectorTexto, 
              { color: theme.text }, 
              !valor && { color: theme.isDark ? 'rgba(255,255,255,0.36)' : 'rgba(23,18,43,0.38)' }
            ]} numberOfLines={1}>
              {valor || placeholder}
            </Text>
          </View>
          <Plus size={16} color={theme.muted} />
        </View>
      </TouchableOpacity>
    );

    return (
      <Animated.View style={[estilos.pantalla, { opacity: entrada, transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.contenido}>
        <View style={estilos.encabezado}>
          <View>
            <Text style={estilos.titulo}>{t('admin.calendario.title')}</Text>
            <Text style={estilos.subtitulo}>{t('admin.calendario.subtitle')}</Text>
          </View>
          <View style={{ backgroundColor: 'transparent', borderWidth: 0 }}>
            <TouchableOpacity onPress={() => abrirCrear()} activeOpacity={0.9} style={estilos.botonCrear}>
              <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white' } as any : {})} colors={['#A855F7', '#9333EA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.botonCrearGradiente}>
                <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={estilos.botonCrearTexto}>{t('admin.calendario.btn_new_event')}</Text>
                <Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={[estilos.botonCrearTexto, estilos.btnIconRight, { fontSize: 18, marginTop: -1 }]}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={estilos.panel}>
          <View style={estilos.toolbar}>
            <View style={estilos.navegadorFecha}>
              <TouchableOpacity onPress={() => moverFecha(-1)} style={estilos.iconoBoton}><ChevronLeft size={18} color={BRAND.texto} /></TouchableOpacity>
              <View>
                <Text style={estilos.mesTexto}>{nombreMes(fechaActiva)}</Text>
                <Text style={estilos.fechaTexto}>{fechaActiva.toLocaleDateString(i18n.language === 'es' ? 'es-SV' : 'en-US', { weekday: 'long', day: 'numeric' })}</Text>
              </View>
              <TouchableOpacity onPress={() => moverFecha(1)} style={estilos.iconoBoton}><ChevronRight size={18} color={BRAND.texto} /></TouchableOpacity>
            </View>

            <View style={estilos.toolbarDerecha}>
              <View style={[
                estilos.busqueda,
                {
                  backgroundColor: theme.isDark ? 'rgba(0,0,0,0.22)' : 'rgba(82,58,150,0.06)',
                  borderColor: theme.border,
                }
              ]}>
                <Search size={15} color={theme.isDark ? BRAND.textoSecundario : 'rgba(23,18,43,0.56)'} />
                <TextInput 
                  value={busqueda} 
                  onChangeText={setBusqueda} 
                  placeholder={t('admin.calendario.search_placeholder')} 
                  placeholderTextColor={theme.isDark ? 'rgba(255,255,255,0.38)' : 'rgba(23,18,43,0.38)'} 
                  style={[estilos.busquedaInput, { color: theme.text }]} 
                />
              </View>
              <View style={estilos.segmentos}>
                {(['mes', 'semana', 'dia', 'agenda'] as VistaCalendario[]).map((item) => (
                  <TouchableOpacity key={item} onPress={() => setVista(item)} style={[estilos.segmento, vista === item && estilos.segmentoActivo]}>
                    <Text style={[estilos.segmentoTexto, vista === item && estilos.segmentoTextoActivo]}>{t(`admin.calendario.vistas.${item}`)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {vista === 'mes' && (
            <View style={estilos.mesGrid}>
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia) => <Text key={dia} style={estilos.diaSemana}>{dia}</Text>)}
              {diasMes.map((dia) => {
                const eventosDia = eventosPorDia(dia);
                const esMesActual = dia.getMonth() === fechaActiva.getMonth();
                return (
                  <TouchableOpacity key={dia.toISOString()} onPress={() => eventosDia[0] ? abrirEditar(eventosDia[0]) : abrirCrear(dia)} activeOpacity={0.88} style={[estilos.diaMes, !esMesActual && estilos.diaMesFuera, mismoDia(dia, new Date()) && estilos.diaHoy]}>
                    <Text style={[estilos.diaNumero, !esMesActual && estilos.diaNumeroFuera]}>{dia.getDate()}</Text>
                    <View style={estilos.eventosMini}>
                      {eventosDia.slice(0, 3).map((evento) => (
                        <View key={evento.id} style={[estilos.eventoMini, { backgroundColor: `${colorTipo(evento.tipo)}22`, borderColor: `${colorTipo(evento.tipo)}66` }]}>
                          <View style={[estilos.puntoTipo, { backgroundColor: colorTipo(evento.tipo) }]} />
                          <Text style={estilos.eventoMiniTexto} numberOfLines={1}>{evento.titulo}</Text>
                        </View>
                      ))}
                      {eventosDia.length > 3 && <Text style={estilos.masEventos}>+{eventosDia.length - 3}</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {vista === 'semana' && (
            <View style={estilos.semanaGrid}>
              {diasSemana.map((dia) => (
                <View key={dia.toISOString()} style={estilos.columnaSemana}>
                  <TouchableOpacity onPress={() => setFechaActiva(dia)} style={[estilos.cabeceraSemana, mismoDia(dia, fechaActiva) && estilos.cabeceraSemanaActiva]}>
                    <Text style={estilos.cabeceraSemanaTexto}>{nombreCorto(dia)}</Text>
                  </TouchableOpacity>
                  {eventosPorDia(dia).map((evento) => <EventoCard key={evento.id} evento={evento} color={colorTipo(evento.tipo)} onEditar={() => abrirEditar(evento)} onEliminar={() => eliminarEvento(evento)} />)}
                </View>
              ))}
            </View>
          )}

          {vista === 'dia' && (
            <View style={estilos.diaVista}>
              {Array.from({ length: 13 }, (_, indice) => indice + 7).map((hora) => {
                const eventosHora = eventosPorDia(fechaActiva).filter((evento) => evento.fechaInicio?.getHours() === hora);
                return (
                  <View key={hora} style={estilos.horaFila}>
                    <Text style={estilos.horaTexto}>{String(hora).padStart(2, '0')}:00</Text>
                    <View style={estilos.horaContenido}>
                      {eventosHora.length > 0 ? eventosHora.map((evento) => <EventoCard key={evento.id} evento={evento} color={colorTipo(evento.tipo)} onEditar={() => abrirEditar(evento)} onEliminar={() => eliminarEvento(evento)} />) : <TouchableOpacity onPress={() => { const fecha = new Date(fechaActiva); fecha.setHours(hora, 0, 0, 0); abrirCrear(fecha); }} style={estilos.horaVacia}><Plus size={14} color={BRAND.textoSecundario} /></TouchableOpacity>}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {vista === 'agenda' && (
            <View style={estilos.agendaLista}>
              {eventosFiltrados.length > 0 ? eventosFiltrados.map((evento) => <EventoCard key={evento.id} evento={evento} color={colorTipo(evento.tipo)} onEditar={() => abrirEditar(evento)} onEliminar={() => eliminarEvento(evento)} amplio />) : <EstadoVacio />}
            </View>
          )}
        </View>

      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        {Platform.OS === 'web' ? (
          <View {...({ className: 'nx-admin-blur-bg' } as any)} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(6,5,18,0.25)' }]} />
        ) : (
          <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
        )}
        <View style={estilos.modalFondo}>
          <View style={[estilos.modalTarjeta, { backgroundColor: theme.isDark ? ADMIN.fondoVidrioFuerte : 'rgba(255,255,255,0.96)', borderColor: theme.border }]}>
            <View style={estilos.modalHeader}>
              <View>
                <Text style={[estilos.modalTitulo, { color: theme.text }]}>{eventoEditando ? t('admin.calendario.modal.title_edit') : t('admin.calendario.modal.title_create')}</Text>
                <Text style={[estilos.modalSubtitulo, { color: theme.muted }]}>{t('admin.calendario.modal.subtitle')}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={estilos.iconoBoton}><X size={18} color={theme.text} /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.formulario}>
              <Campo label={t('admin.calendario.label_title')} value={formulario.titulo} onChangeText={(titulo: string) => setFormulario((actual) => ({ ...actual, titulo }))} />
              <Campo label={t('admin.calendario.label_desc')} value={formulario.descripcion} onChangeText={(descripcion: string) => setFormulario((actual) => ({ ...actual, descripcion }))} multiline />
              <Text style={[estilos.inputLabel, { color: theme.muted }]}>{t('admin.calendario.label_type')}</Text>
              <View style={estilos.tiposGrid}>
                {tiposEvento.map((tipo) => (
                  <TouchableOpacity key={tipo.id} onPress={() => setFormulario((actual) => ({ ...actual, tipo: tipo.id }))} style={[estilos.tipoChip, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.035)' : 'rgba(82,58,150,0.03)', borderColor: theme.border }, formulario.tipo === tipo.id && { borderColor: tipo.color, backgroundColor: `${tipo.color}18` }]}>
                    <View style={[estilos.puntoTipo, { backgroundColor: tipo.color }]} />
                    <Text style={[estilos.tipoTexto, { color: theme.text }]}>{tipo.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={estilos.formGrid}>
                <Selector 
                  label={t('admin.calendario.label_start')} 
                  valor={formulario.inicio} 
                  icono={Clock3}
                  alPresionar={() => setPickerActivo('inicio')} 
                />
                <Selector 
                  label={t('admin.calendario.label_end')} 
                  valor={formulario.fin} 
                  icono={Clock3}
                  alPresionar={() => setPickerActivo('fin')} 
                />
              </View>
              
              <Selector 
                label={t('admin.calendario.label_employees')} 
                valor={formulario.empleadoIds ? `${dividirLista(formulario.empleadoIds).length} seleccionados` : ''} 
                placeholder="Seleccionar empleados..."
                icono={Users}
                alPresionar={() => setPickerActivo('empleados')} 
              />
              
              <Selector 
                label={t('admin.calendario.label_depts')} 
                valor={formulario.departamentos ? `${dividirLista(formulario.departamentos).length} seleccionados` : ''} 
                placeholder="Seleccionar departamentos..."
                icono={Search}
                alPresionar={() => setPickerActivo('departamentos')} 
              />
              
              <Selector 
                label={t('admin.calendario.label_sedes')} 
                valor={formulario.sedes ? `${dividirLista(formulario.sedes).length} seleccionadas` : ''} 
                placeholder="Seleccionar sedes..."
                icono={MapPin}
                alPresionar={() => setPickerActivo('sedes')} 
              />
            </ScrollView>

            {/* Picker Modal for Entities and Dates */}
            <Modal visible={!!pickerActivo} transparent animationType="fade">
              <BlurView intensity={20} tint="dark" style={estilos.modalFondo}>
                <View style={[estilos.modalTarjeta, { height: '80%', backgroundColor: theme.isDark ? ADMIN.fondoVidrioFuerte : 'rgba(255,255,255,0.96)', borderColor: theme.border }]}>
                  <View style={estilos.modalHeader}>
                    <Text style={[estilos.modalTitulo, { color: theme.text }]}>
                      {pickerActivo === 'inicio' || pickerActivo === 'fin' ? `Seleccionar Fecha ${pickerActivo === 'inicio' ? 'Inicio' : 'Fin'}` : `Seleccionar ${pickerActivo}`}
                    </Text>
                    <TouchableOpacity onPress={() => setPickerActivo(null)} style={estilos.iconoBoton}><X size={18} color={theme.text} /></TouchableOpacity>
                  </View>
                  
                  {pickerActivo === 'inicio' || pickerActivo === 'fin' ? (
                    <View style={{ flex: 1 }}>
                      <View style={estilos.pickerFechaHeader}>
                        <TouchableOpacity onPress={() => { const d = new Date(fechaPicker); d.setMonth(d.getMonth() - 1); setFechaPicker(d); }}>
                          <ChevronLeft size={20} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={[estilos.pickerMesAno, { color: theme.text }]}>{nombreMes(fechaPicker)}</Text>
                        <TouchableOpacity onPress={() => { const d = new Date(fechaPicker); d.setMonth(d.getMonth() + 1); setFechaPicker(d); }}>
                          <ChevronRight size={20} color={theme.text} />
                        </TouchableOpacity>
                      </View>

                      <View style={estilos.pickerDiasSemana}>
                        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => <Text key={d} style={[estilos.pickerDiaLabel, { color: theme.muted }]}>{d}</Text>)}
                      </View>

                      <View style={estilos.pickerGrid}>
                        {(() => {
                          const primero = new Date(fechaPicker.getFullYear(), fechaPicker.getMonth(), 1);
                          const inicio = new Date(primero);
                          inicio.setDate(primero.getDate() - primero.getDay());
                          
                          return Array.from({ length: 42 }).map((_, idx) => {
                            const d = new Date(inicio);
                            d.setDate(inicio.getDate() + idx);
                            const esMesActual = d.getMonth() === fechaPicker.getMonth();
                            const esSeleccionado = mismoDia(d, fechaPicker);

                            return (
                              <TouchableOpacity 
                                key={idx} 
                                onPress={() => setFechaPicker(d)}
                                style={[estilos.pickerDia, !esMesActual && { opacity: 0.3 }, esSeleccionado && estilos.pickerDiaSeleccionado]}
                              >
                                <Text style={[estilos.pickerDiaTexto, { color: theme.text }, esSeleccionado && { color: '#fff' }]}>{d.getDate()}</Text>
                              </TouchableOpacity>
                            );
                          });
                        })()}
                      </View>

                      <View style={{ marginTop: 25, flex: 1 }}>
                        <Text style={[estilos.subLabelPicker, { color: theme.text, fontSize: 11 }]}>Seleccionar Hora</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                          <View style={estilos.pickerHorasGrid}>
                            {Array.from({ length: 24 }).map((_, hora) => {
                              const fActual = convertirFecha(formulario[pickerActivo]) || new Date();
                              const esSeleccionado = fActual.getHours() === hora;
                              return (
                                <TouchableOpacity 
                                  key={hora} 
                                  onPress={() => {
                                    const d = new Date(fechaPicker);
                                    d.setHours(hora, 0, 0, 0);
                                    setFormulario(prev => ({ ...prev, [pickerActivo]: formatoInput(d) }));
                                    setPickerActivo(null);
                                  }}
                                  style={[estilos.pickerHoraItem, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }, esSeleccionado && estilos.pickerHoraItemActivo]}
                                >
                                  <Text style={[estilos.pickerHoraTexto, { color: theme.text }, esSeleccionado && { color: '#fff' }]}>
                                    {hora === 0 ? '12' : hora > 12 ? hora - 12 : hora} {hora < 12 ? 'AM' : 'PM'}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </ScrollView>
                      </View>
                    </View>
                  ) : (
                    <ScrollView style={{ flex: 1 }}>
                      {(pickerActivo === 'empleados' ? usuarios : pickerActivo === 'departamentos' ? departamentos : sedes).map((item) => {
                        const ids = dividirLista(pickerActivo === 'empleados' ? formulario.empleadoIds : pickerActivo === 'departamentos' ? formulario.departamentos : formulario.sedes);
                        const estaSeleccionado = ids.includes(item.id || '');
                        
                        const toggleItem = () => {
                          let nuevas;
                          if (estaSeleccionado) {
                            nuevas = ids.filter(i => i !== item.id);
                          } else {
                            nuevas = [...ids, item.id || ''];
                          }
                          const valor = nuevas.join(', ');
                          setFormulario(prev => ({ 
                            ...prev, 
                            [pickerActivo === 'empleados' ? 'empleadoIds' : pickerActivo === 'departamentos' ? 'departamentos' : 'sedes']: valor 
                          }));
                        };

                        return (
                          <TouchableOpacity key={item.id} onPress={toggleItem} style={[estilos.itemPicker, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(82,58,150,0.03)' }, estaSeleccionado && estilos.itemPickerActivo]}>
                            <Text style={[estilos.itemPickerTexto, { color: theme.text }, estaSeleccionado && { color: '#fff' }]}>{item.nombre || item.name || item.correo}</Text>
                            {estaSeleccionado && <Check size={16} color={BRAND.primarioClaro} />}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                  
                  <TouchableOpacity onPress={() => setPickerActivo(null)} style={estilos.botonCerrarPicker}>
                    <Text style={estilos.botonCerrarPickerTexto}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </Modal>

            <View style={estilos.modalAcciones}>
              {eventoEditando && (
                <TouchableOpacity onPress={() => eliminarEvento(eventoEditando)} style={estilos.botonEliminar}>
                  <Trash2 size={16} color={BRAND.error} />
                  <Text style={estilos.botonEliminarTexto}>{t('admin.calendario.btn_delete')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={guardarEvento} style={estilos.botonGuardar}>
                <LinearGradient colors={[BRAND.primario, BRAND.primarioClaro]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.botonGuardarGradiente}>
                  <Check size={17} color="#fff" />
                  <Text style={estilos.botonGuardarTexto}>{t('admin.calendario.btn_save')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
};

const TarjetaResumen = ({ label, valor, color, icono }: { label: string; valor: number; color: string; icono: React.ReactNode }) => (
  <View style={estilos.resumenCard}>
    <View style={[estilos.resumenIcono, { backgroundColor: `${color}18`, borderColor: `${color}44` }]}>
      {icono}
    </View>
    <Text style={estilos.resumenValor}>{valor}</Text>
    <Text style={estilos.resumenLabel}>{label}</Text>
  </View>
);


const PanelCatalogo = ({ titulo, datos, icono }: { titulo: string; datos: Catalogo[]; icono: React.ReactNode }) => (
  <View style={estilos.panelCatalogoItem}>
    <View style={estilos.panelCatalogoHeader}>
      {icono}
      <Text style={estilos.panelCatalogoTitulo}>{titulo}</Text>
      <Text style={estilos.panelCatalogoTotal}>{datos.length}</Text>
    </View>
    <View style={estilos.catalogoLista}>
      {datos.slice(0, 5).map((item) => (
        <View key={item.id || item.nombre} style={estilos.catalogoItem}>
          <Text style={estilos.catalogoNombre} numberOfLines={1}>{item.nombre || item.correo || item.id}</Text>
          <Text style={estilos.catalogoId} numberOfLines={1}>{item.id}</Text>
        </View>
      ))}
    </View>
  </View>
);

const EstadoVacio = () => (
  <View style={estilos.estadoVacio}>
    <CalendarDays size={28} color={BRAND.textoSecundario} />
    <Text style={estilos.estadoVacioTexto}>No hay eventos para esta vista</Text>
  </View>
);

export default CalendarioEmpresarial;

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: BRAND.fondo },
  contenido: { flexGrow: 1, padding: 20, paddingTop: 260, paddingBottom: 64 },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 18, marginBottom: 22 },
  titulo: { color: BRAND.texto, fontSize: 26, fontWeight: '800', letterSpacing: 0 },
  subtitulo: { color: BRAND.textoSecundario, fontSize: 13, fontWeight: '600', marginTop: 8, maxWidth: 720 },
  botonCrear: { borderRadius: 999, overflow: 'hidden', backgroundColor: 'transparent' },
  botonCrearGradiente: { flexDirection: 'row', paddingHorizontal: 28, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnIconRight: { marginLeft: 8 },
  botonCrearTexto: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5, textDecorationLine: 'none' },
  resumenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 18 },
  resumenCard: { flex: 1, minWidth: 180, padding: 18, borderRadius: 12, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: ADMIN.fondoVidrio, ...sombraAdmin },
  resumenIcono: { width: 48, height: 48, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 22, flexShrink: 0 },
  resumenValor: { color: BRAND.texto, fontSize: 28, fontWeight: '900' },
  resumenLabel: { color: BRAND.textoSecundario, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7 },
  panel: { borderRadius: 14, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: ADMIN.fondoVidrio, padding: 18, ...sombraAdmin },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 18 },
  navegadorFecha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconoBoton: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: 'rgba(255,255,255,0.05)' },
  mesTexto: { color: BRAND.texto, fontSize: 18, fontWeight: '900', textTransform: 'capitalize' },
  fechaTexto: { color: BRAND.textoSecundario, fontSize: 11, fontWeight: '700', textTransform: 'capitalize', marginTop: 2 },
  toolbarDerecha: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' },
  busqueda: { width: 210, height: 40, borderRadius: 10, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: 'rgba(0,0,0,0.22)', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  busquedaInput: { flex: 1, color: BRAND.texto, fontSize: 12, outlineStyle: 'none' as any },
  segmentos: { flexDirection: 'row', padding: 4, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: ADMIN.borde },
  segmento: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  segmentoActivo: { backgroundColor: 'rgba(124,58,237,0.34)' },
  segmentoTexto: { color: BRAND.textoSecundario, fontSize: 11, fontWeight: '900', textTransform: 'capitalize' },
  segmentoTextoActivo: { color: BRAND.texto },
  mesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  diaSemana: { width: `${(100 / 7) - 1}%`, color: BRAND.textoSecundario, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 4 },
  diaMes: { width: `${(100 / 7) - 1}%`, minHeight: 116, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.035)', padding: 9 },
  diaMesFuera: { opacity: 0.42 },
  diaHoy: { borderColor: 'rgba(139,92,246,0.72)', backgroundColor: 'rgba(124,58,237,0.12)' },
  diaNumero: { color: BRAND.texto, fontSize: 12, fontWeight: '900', marginBottom: 8 },
  diaNumeroFuera: { color: BRAND.textoSecundario },
  eventosMini: { gap: 5 },
  eventoMini: { minHeight: 22, borderRadius: 7, borderWidth: 1, paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center', gap: 5 },
  eventoMiniTexto: { flex: 1, color: BRAND.texto, fontSize: 9, fontWeight: '800' },
  puntoTipo: { width: 7, height: 7, borderRadius: 99 },
  masEventos: { color: BRAND.textoSecundario, fontSize: 9, fontWeight: '900' },
  semanaGrid: { flexDirection: 'row', gap: 10 },
  columnaSemana: { flex: 1, minHeight: 480, gap: 10 },
  cabeceraSemana: { borderRadius: 10, padding: 12, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: 'rgba(255,255,255,0.04)' },
  cabeceraSemanaActiva: { backgroundColor: 'rgba(124,58,237,0.22)', borderColor: ADMIN.bordeFuerte },
  cabeceraSemanaTexto: { color: BRAND.texto, fontSize: 12, fontWeight: '900', textTransform: 'capitalize' },
  diaVista: { gap: 10 },
  horaFila: { flexDirection: 'row', gap: 12 },
  horaTexto: { width: 54, color: BRAND.textoSecundario, fontSize: 11, fontWeight: '900', paddingTop: 12 },
  horaContenido: { flex: 1, minHeight: 58, borderLeftWidth: 1, borderLeftColor: ADMIN.borde, paddingLeft: 12 },
  horaVacia: { height: 42, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: ADMIN.borde, alignItems: 'center', justifyContent: 'center' },
  agendaLista: { gap: 10 },
  eventoCard: { position: 'relative', overflow: 'hidden', borderRadius: 10, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.045)', padding: 12, paddingLeft: 16, flexDirection: 'row', gap: 10 },
  eventoCardAmplio: { minHeight: 100 },
  eventoBorde: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  eventoContenido: { flex: 1, gap: 5 },
  eventoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  eventoTitulo: { flex: 1, color: BRAND.texto, fontSize: 13, fontWeight: '900' },
  eventoTipo: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  eventoHoraRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  eventoHora: { color: BRAND.textoSecundario, fontSize: 10, fontWeight: '800' },
  eventoDescripcion: { color: BRAND.textoSecundario, fontSize: 11, fontWeight: '600', lineHeight: 17 },
  eventoMeta: { color: ADMIN.textoSuave, fontSize: 10, fontWeight: '700' },
  eventoAcciones: { gap: 8 },
  accionIcono: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: 'rgba(0,0,0,0.18)', flexShrink: 0 },
  accionIconoEditar: { borderColor: 'rgba(96,165,250,0.24)', backgroundColor: 'rgba(96,165,250,0.08)' },
  accionIconoEliminar: { borderColor: 'rgba(239,68,68,0.24)', backgroundColor: 'rgba(239,68,68,0.08)' },
  catalogoPanel: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 18 },
  panelCatalogoItem: { flex: 1, minWidth: 240, borderRadius: 12, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: ADMIN.fondoVidrio, padding: 16 },
  panelCatalogoHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12 },
  panelCatalogoTitulo: { flex: 1, color: BRAND.texto, fontSize: 13, fontWeight: '900' },
  panelCatalogoTotal: { color: BRAND.violeta, fontSize: 12, fontWeight: '900' },
  catalogoLista: { gap: 8 },
  catalogoItem: { padding: 10, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  catalogoNombre: { color: BRAND.texto, fontSize: 11, fontWeight: '800' },
  catalogoId: { color: BRAND.textoSecundario, fontSize: 9, fontWeight: '700', marginTop: 2 },
  estadoVacio: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 10 },
  estadoVacioTexto: { color: BRAND.textoSecundario, fontSize: 12, fontWeight: '800' },
  modalFondo: { flex: 1, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalTarjeta: { width: '100%', maxWidth: 720, maxHeight: '92%', borderRadius: 12, borderWidth: 1, borderColor: ADMIN.bordeFuerte, backgroundColor: ADMIN.fondoVidrioFuerte, padding: 18, ...sombraAdmin },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 14 },
  modalTitulo: { color: BRAND.texto, fontSize: 20, fontWeight: '900' },
  modalSubtitulo: { color: BRAND.textoSecundario, fontSize: 11, fontWeight: '700', marginTop: 4 },
  formulario: { gap: 12, paddingBottom: 8 },
  campo: { gap: 7 },
  inputLabel: { color: BRAND.textoSecundario, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.7 },
  input: { minHeight: 42, borderRadius: 10, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: 'rgba(0,0,0,0.22)', color: BRAND.texto, paddingHorizontal: 12, fontSize: 12, fontWeight: '700', outlineStyle: 'none' as any },
  inputMultiline: { minHeight: 86, paddingTop: 12, textAlignVertical: 'top' },
  tiposGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tipoChip: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, borderWidth: 1, borderColor: ADMIN.borde, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.035)' },
  tipoTexto: { color: BRAND.texto, fontSize: 11, fontWeight: '800' },
  formGrid: { flexDirection: 'row', gap: 12 },
  modalAcciones: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 14 },
  botonEliminar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.35)', backgroundColor: 'rgba(239,68,68,0.08)' },
  botonEliminarTexto: { color: BRAND.error, fontSize: 12, fontWeight: '900' },
  botonGuardar: { borderRadius: 10, overflow: 'hidden', ...sombraVioleta },
  botonGuardarGradiente: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 12 },
  botonGuardarTexto: { color: '#fff', fontSize: 12, fontWeight: '900' },
  inputSelector: { minHeight: 46, borderRadius: 10, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: 'rgba(0,0,0,0.22)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, justifyContent: 'space-between' },
  selectorTexto: { color: BRAND.texto, fontSize: 12, fontWeight: '700' },
  itemPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 10, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.03)' },
  itemPickerActivo: { backgroundColor: 'rgba(124,58,237,0.15)', borderColor: BRAND.primarioClaro, borderWidth: 1 },
  itemPickerTexto: { color: BRAND.textoSecundario, fontSize: 13, fontWeight: '700' },
  botonCerrarPicker: { marginTop: 16, backgroundColor: BRAND.primario, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  botonCerrarPickerTexto: { color: '#fff', fontSize: 13, fontWeight: '900' },
  fechaSelectLabel: { color: BRAND.texto, fontSize: 13, fontWeight: '800', marginBottom: 10, textTransform: 'capitalize' },
  horasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  horaSelectBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: ADMIN.borde },
  horaSelectTexto: { color: BRAND.textoSecundario, fontSize: 11, fontWeight: '700' },
  subLabelPicker: { color: BRAND.textoSecundario, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  pickerFechaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pickerMesAno: { color: BRAND.texto, fontSize: 15, fontWeight: '900', textTransform: 'capitalize' },
  pickerDiasSemana: { flexDirection: 'row', marginBottom: 10 },
  pickerDiaLabel: { flex: 1, textAlign: 'center', color: BRAND.textoSecundario, fontSize: 10, fontWeight: '900' },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  pickerDia: { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  pickerDiaSeleccionado: { backgroundColor: BRAND.primario },
  pickerDiaTexto: { color: BRAND.texto, fontSize: 12, fontWeight: '700' },
  pickerHorasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingVertical: 10, justifyContent: 'center' },
  pickerHoraItem: { width: '22%', aspectRatio: 2, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: ADMIN.borde },
  pickerHoraItemActivo: { backgroundColor: BRAND.primario, borderColor: BRAND.primarioClaro },
  pickerHoraTexto: { color: BRAND.texto, fontSize: 12, fontWeight: '800' },
});
