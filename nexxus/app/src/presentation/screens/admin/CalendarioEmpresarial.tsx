import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Edit3, MapPin, Plus, Search, Trash2, Users, X } from 'lucide-react-native';
import { db } from '@/infrastructure/firebase/firebaseConfig';
import { useAuth } from '@/presentation/hooks/useAuth';
import { ADMIN, sombraAdmin, sombraVioleta } from './adminTheme';
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
  departamentos?: string[];
  sedes?: string[];
  empresaId?: string;
  creadoPor?: string;
  creadoEn?: any;
  actualizadoEn?: any;
};

type Catalogo = {
  id?: string;
  nombre?: string;
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

const tiposEvento: { id: TipoEvento; label: string; color: string }[] = [
  { id: 'reunion', label: 'Reunión', color: BRAND.azul },
  { id: 'recordatorio', label: 'Recordatorio', color: BRAND.alerta },
  { id: 'capacitacion', label: 'Capacitación', color: BRAND.violeta },
  { id: 'vacaciones', label: 'Vacaciones', color: BRAND.exito },
  { id: 'turno', label: 'Turno', color: BRAND.cyan },
  { id: 'corporativo', label: 'Corporativo', color: BRAND.primarioClaro },
];

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
const nombreMes = (fecha: Date) => fecha.toLocaleDateString('es-SV', { month: 'long', year: 'numeric' });
const nombreCorto = (fecha: Date) => fecha.toLocaleDateString('es-SV', { weekday: 'short', day: 'numeric' });

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
  const { user } = useAuth();
  const empresaId = obtenerEmpresaIdAdmin(user);
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
      onSnapshot(query(collection(db, 'departamentos'), where('empresaId', '==', empresaId)), (snapshot) => {
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
    }
    setEventoEditando(null);
    setFormulario(base);
    setModalVisible(true);
  };

  const abrirEditar = (evento: EventoCalendario) => {
    setEventoEditando(evento);
    setFormulario({
      titulo: evento.titulo || '',
      descripcion: evento.descripcion || '',
      tipo: evento.tipo || 'reunion',
      inicio: formatoInput(convertirFecha(evento.inicio) || new Date()),
      fin: formatoInput(convertirFecha(evento.fin) || new Date()),
      empleadoIds: (evento.empleadoIds || []).join(', '),
      departamentos: (evento.departamentos || []).join(', '),
      sedes: (evento.sedes || []).join(', '),
    });
    setModalVisible(true);
  };

  const guardarEvento = async () => {
    if (!empresaId) return;
    const inicio = parsearInput(formulario.inicio);
    const fin = parsearInput(formulario.fin);
    if (!formulario.titulo.trim() || !inicio || !fin || fin < inicio) {
      Alert.alert('Revisa el evento', 'Agrega título y fechas válidas en formato YYYY-MM-DD HH:mm.');
      return;
    }

    const empleadoIds = dividirLista(formulario.empleadoIds);
    const empleadosPorId = new Map(usuarios.map((usuario) => [usuario.id, usuario.nombre || usuario.correo || 'Empleado']));
    const datos = {
      titulo: formulario.titulo.trim(),
      descripcion: formulario.descripcion.trim(),
      tipo: formulario.tipo,
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      empleadoIds,
      empleadoNombres: empleadoIds.map((id) => empleadosPorId.get(id) || id),
      departamentos: dividirLista(formulario.departamentos),
      sedes: dividirLista(formulario.sedes),
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
    Alert.alert('Eliminar evento', `¿Eliminar "${evento.titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: confirmar },
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

  return (
    <Animated.View style={[estilos.pantalla, { opacity: entrada, transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.contenido}>
        <View style={estilos.encabezado}>
          <View>
            <Text style={estilos.titulo}>Calendario Empresarial</Text>
            <Text style={estilos.subtitulo}>Agenda operativa en tiempo real para reuniones, turnos, vacaciones y capacitaciones</Text>
          </View>
          <TouchableOpacity onPress={() => abrirCrear()} activeOpacity={0.9} style={estilos.botonCrear}>
            <LinearGradient colors={[BRAND.primario, BRAND.primarioClaro]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.botonCrearGradiente}>
              <Plus size={18} color="#fff" />
              <Text style={estilos.botonCrearTexto}>Nuevo evento</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={estilos.panel}>
          <View style={estilos.toolbar}>
            <View style={estilos.navegadorFecha}>
              <TouchableOpacity onPress={() => moverFecha(-1)} style={estilos.iconoBoton}><ChevronLeft size={18} color={BRAND.texto} /></TouchableOpacity>
              <View>
                <Text style={estilos.mesTexto}>{nombreMes(fechaActiva)}</Text>
                <Text style={estilos.fechaTexto}>{fechaActiva.toLocaleDateString('es-SV', { weekday: 'long', day: 'numeric' })}</Text>
              </View>
              <TouchableOpacity onPress={() => moverFecha(1)} style={estilos.iconoBoton}><ChevronRight size={18} color={BRAND.texto} /></TouchableOpacity>
            </View>

            <View style={estilos.toolbarDerecha}>
              <View style={estilos.busqueda}>
                <Search size={15} color={BRAND.textoSecundario} />
                <TextInput value={busqueda} onChangeText={setBusqueda} placeholder="Buscar eventos" placeholderTextColor="rgba(255,255,255,0.38)" style={estilos.busquedaInput} />
              </View>
              <View style={estilos.segmentos}>
                {(['mes', 'semana', 'dia', 'agenda'] as VistaCalendario[]).map((item) => (
                  <TouchableOpacity key={item} onPress={() => setVista(item)} style={[estilos.segmento, vista === item && estilos.segmentoActivo]}>
                    <Text style={[estilos.segmentoTexto, vista === item && estilos.segmentoTextoActivo]}>{item}</Text>
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
        <View style={estilos.modalFondo}>
          <View style={estilos.modalTarjeta}>
            <View style={estilos.modalHeader}>
              <View>
                <Text style={estilos.modalTitulo}>{eventoEditando ? 'Editar evento' : 'Crear evento'}</Text>
                <Text style={estilos.modalSubtitulo}>Sincronizado con Firestore en tiempo real</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={estilos.iconoBoton}><X size={18} color={BRAND.texto} /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.formulario}>
              <Campo label="Título" value={formulario.titulo} onChangeText={(titulo: string) => setFormulario((actual) => ({ ...actual, titulo }))} />
              <Campo label="Descripción" value={formulario.descripcion} onChangeText={(descripcion: string) => setFormulario((actual) => ({ ...actual, descripcion }))} multiline />
              <Text style={estilos.inputLabel}>Tipo</Text>
              <View style={estilos.tiposGrid}>
                {tiposEvento.map((tipo) => (
                  <TouchableOpacity key={tipo.id} onPress={() => setFormulario((actual) => ({ ...actual, tipo: tipo.id }))} style={[estilos.tipoChip, formulario.tipo === tipo.id && { borderColor: tipo.color, backgroundColor: `${tipo.color}18` }]}>
                    <View style={[estilos.puntoTipo, { backgroundColor: tipo.color }]} />
                    <Text style={estilos.tipoTexto}>{tipo.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={estilos.formGrid}>
                <Campo label="Inicio" value={formulario.inicio} onChangeText={(inicio: string) => setFormulario((actual) => ({ ...actual, inicio }))} />
                <Campo label="Fin" value={formulario.fin} onChangeText={(fin: string) => setFormulario((actual) => ({ ...actual, fin }))} />
              </View>
              <Campo label="IDs empleados separados por coma" value={formulario.empleadoIds} onChangeText={(empleadoIds: string) => setFormulario((actual) => ({ ...actual, empleadoIds }))} />
              <Campo label="Departamentos separados por coma" value={formulario.departamentos} onChangeText={(departamentos: string) => setFormulario((actual) => ({ ...actual, departamentos }))} />
              <Campo label="Sedes separadas por coma" value={formulario.sedes} onChangeText={(sedes: string) => setFormulario((actual) => ({ ...actual, sedes }))} />
            </ScrollView>

            <View style={estilos.modalAcciones}>
              {eventoEditando && (
                <TouchableOpacity onPress={() => eliminarEvento(eventoEditando)} style={estilos.botonEliminar}>
                  <Trash2 size={16} color={BRAND.error} />
                  <Text style={estilos.botonEliminarTexto}>Eliminar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={guardarEvento} style={estilos.botonGuardar}>
                <LinearGradient colors={[BRAND.primario, BRAND.primarioClaro]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.botonGuardarGradiente}>
                  <Check size={17} color="#fff" />
                  <Text style={estilos.botonGuardarTexto}>Guardar</Text>
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
    <Text style={estilos.inputLabel}>{label}</Text>
    <TextInput {...props} placeholderTextColor="rgba(255,255,255,0.36)" style={[estilos.input, props.multiline && estilos.inputMultiline]} />
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
  contenido: { flexGrow: 1, padding: 20, paddingTop: 88, paddingBottom: 64 },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 18, marginBottom: 22 },
  titulo: { color: BRAND.texto, fontSize: 26, fontWeight: '800', letterSpacing: 0 },
  subtitulo: { color: BRAND.textoSecundario, fontSize: 13, fontWeight: '600', marginTop: 8, maxWidth: 720 },
  botonCrear: { borderRadius: 10, overflow: 'hidden', ...sombraVioleta },
  botonCrearGradiente: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 18, paddingVertical: 13 },
  botonCrearTexto: { color: '#fff', fontSize: 12, fontWeight: '900' },
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
  modalFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 20 },
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
});
