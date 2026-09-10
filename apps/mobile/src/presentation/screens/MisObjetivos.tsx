import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import { ModalShell, EmptyState, Skeleton, SkeletonLista } from '@/presentation/components/ui';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import { COLORES, ESPACIADO, RADIOS, SOMBRAS } from '@/shared/constants/diseno';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { useCases } from '@/infrastructure/container';
import { Objective } from 'domain/entities/Objective';
import { calcularProgresoKR, calcularProgresoObjetivo } from 'domain/services/okrEngine';
import BotonAnimado from '@/presentation/components/BotonAnimado';
import { getTenantId } from '@/shared/auth/tenant';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;

interface Props {
  navigation: any;
}

interface FilaKRBorrador {
  titulo: string;
  valorObjetivo: string;
  unidad: string;
}

type TipoFiltroFecha = 'todas' | '30d' | '90d' | 'fin_anio' | 'personalizado';
type TipoPlazoBorrador = '1m' | '3m' | '6m' | 'fin_anio' | 'personalizado';
type FiltroEstado = 'todos' | 'activo' | 'completado';

const filaKRVacia = (): FilaKRBorrador => ({ titulo: '', valorObjetivo: '', unidad: '' });

function obtenerFechaPreset(preset: TipoPlazoBorrador): string {
  const hoy = new Date();
  if (preset === '1m') {
    const d = new Date(hoy);
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  }
  if (preset === '3m') {
    const d = new Date(hoy);
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  }
  if (preset === '6m') {
    const d = new Date(hoy);
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split('T')[0];
  }
  if (preset === 'fin_anio') {
    return `${hoy.getFullYear()}-12-31`;
  }
  return hoy.toISOString().split('T')[0];
}

function parsearFechaObjetivo(fechaStr?: string): Date | null {
  if (!fechaStr) return null;
  const matchIso = fechaStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (matchIso) {
    const y = Number(matchIso[1]);
    const m = Number(matchIso[2]);
    const d = Number(matchIso[3]);
    return new Date(y, m - 1, d, 23, 59, 59);
  }
  const matchCiclo = fechaStr.match(/^(\d{4})-Q([1-4])$/);
  if (matchCiclo) {
    const anio = Number(matchCiclo[1]);
    const q = Number(matchCiclo[2]);
    const mesFin = q * 3 - 1;
    return new Date(anio, mesFin + 1, 0, 23, 59, 59);
  }
  const parsed = new Date(fechaStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatearFechaBonita(fechaStr?: string): string {
  const d = parsearFechaObjetivo(fechaStr);
  if (!d) return fechaStr || '';
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
}

function calcularDiasRestantes(fechaStr?: string): { dias: number; texto: string; urgente: boolean; vencido: boolean } | null {
  const d = parsearFechaObjetivo(fechaStr);
  if (!d) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fin = new Date(d);
  fin.setHours(0, 0, 0, 0);
  const diffTime = fin.getTime() - hoy.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { dias: Math.abs(diffDays), texto: `Vencido hace ${Math.abs(diffDays)}d`, urgente: true, vencido: true };
  }
  if (diffDays === 0) {
    return { dias: 0, texto: 'Vence hoy', urgente: true, vencido: false };
  }
  return { dias: diffDays, texto: `${diffDays}d restantes`, urgente: diffDays <= 7, vencido: false };
}

export default function MisObjetivos({ navigation }: Props) {
  const { t } = useTranslation();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const { perfil } = useContextoUsuario();
  const estilos = useMemo(() => crearEstilos(colores, esOscuro), [colores, esOscuro]);

  const [objetivos, setObjetivos] = useState<Objective[]>([]);
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
  const [filtroFecha, setFiltroFecha] = useState<TipoFiltroFecha>('todas');
  const [fechaPersonalizadaFiltro, setFechaPersonalizadaFiltro] = useState(
    new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
  );
  const [mostrarModalFiltroFecha, setMostrarModalFiltroFecha] = useState(false);

  // Modal Crear
  const [modalVisible, setModalVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [editandoKR, setEditandoKR] = useState<string | null>(null);
  const [valorEdicion, setValorEdicion] = useState('');

  // Formulario Borrador
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipoPlazo, setTipoPlazo] = useState<TipoPlazoBorrador>('3m');
  const [fechaPersonalizadaBorrador, setFechaPersonalizadaBorrador] = useState(obtenerFechaPreset('3m'));
  const [krs, setKrs] = useState<FilaKRBorrador[]>([filaKRVacia()]);

  useEffect(() => {
    if (!perfil?.id) {
      setCargando(false);
      return undefined;
    }
    setCargando(true);
    const unsub = useCases.objectives.subscribe.execute(perfil.id, (data) => {
      setObjetivos(data);
      setCargando(false);
    });
    return unsub;
  }, [perfil?.id]);

  // Resumen / KPIs calculados
  const metricasGlobales = useMemo(() => {
    const total = objetivos.length;
    if (total === 0) return { total: 0, progresoMedio: 0, completados: 0, activos: 0 };
    let sumaProgreso = 0;
    let completados = 0;
    let activos = 0;

    objetivos.forEach((obj) => {
      const p = calcularProgresoObjetivo(obj.keyResults);
      sumaProgreso += p;
      if (obj.estado === 'completado' || p >= 100) {
        completados++;
      } else {
        activos++;
      }
    });

    return {
      total,
      progresoMedio: Math.round(sumaProgreso / total),
      completados,
      activos,
    };
  }, [objetivos]);

  // Filtrado de objetivos
  const objetivosFiltrados = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let limiteFecha: Date | null = null;
    if (filtroFecha === '30d') {
      limiteFecha = new Date(hoy);
      limiteFecha.setDate(limiteFecha.getDate() + 30);
      limiteFecha.setHours(23, 59, 59);
    } else if (filtroFecha === '90d') {
      limiteFecha = new Date(hoy);
      limiteFecha.setDate(limiteFecha.getDate() + 90);
      limiteFecha.setHours(23, 59, 59);
    } else if (filtroFecha === 'fin_anio') {
      limiteFecha = new Date(hoy.getFullYear(), 11, 31, 23, 59, 59);
    } else if (filtroFecha === 'personalizado') {
      const parsed = parsearFechaObjetivo(fechaPersonalizadaFiltro);
      if (parsed) limiteFecha = parsed;
    }

    return objetivos.filter((obj) => {
      // Filtro Estado
      const progreso = calcularProgresoObjetivo(obj.keyResults);
      const estaCompletado = obj.estado === 'completado' || progreso >= 100;
      if (filtroEstado === 'activo' && estaCompletado) return false;
      if (filtroEstado === 'completado' && !estaCompletado) return false;

      // Filtro Fecha Límite ("Ver hasta")
      if (limiteFecha) {
        const fechaObj = parsearFechaObjetivo(obj.fechaLimite || obj.ciclo);
        if (fechaObj && fechaObj > limiteFecha) {
          return false;
        }
      }

      return true;
    });
  }, [objetivos, filtroEstado, filtroFecha, fechaPersonalizadaFiltro]);

  const abrirCrear = () => {
    setTitulo('');
    setDescripcion('');
    setTipoPlazo('3m');
    setFechaPersonalizadaBorrador(obtenerFechaPreset('3m'));
    setKrs([filaKRVacia()]);
    setModalVisible(true);
  };

  const seleccionarTipoPlazo = (tipo: TipoPlazoBorrador) => {
    setTipoPlazo(tipo);
    if (tipo !== 'personalizado') {
      setFechaPersonalizadaBorrador(obtenerFechaPreset(tipo));
    }
  };

  const actualizarKR = (index: number, campo: keyof FilaKRBorrador, valor: string) => {
    setKrs((prev) => prev.map((kr, i) => (i === index ? { ...kr, [campo]: valor } : kr)));
  };

  const agregarFilaKR = () => setKrs((prev) => [...prev, filaKRVacia()]);
  const quitarFilaKR = (index: number) => setKrs((prev) => prev.filter((_, i) => i !== index));

  const krsValidos = krs.filter((kr) => kr.titulo.trim() && Number(kr.valorObjetivo) > 0);
  const puedeGuardar = titulo.trim().length > 0 && krsValidos.length > 0 && !guardando;

  const guardarObjetivo = async () => {
    const empresaId = getTenantId(perfil);
    if (!perfil?.id || !empresaId || !puedeGuardar) {
      if (!empresaId) {
        Alert.alert(t('misObjetivos.create_error_title'), 'No se encontró la empresa del usuario.');
      }
      return;
    }

    setGuardando(true);
    try {
      const fechaFinal = tipoPlazo === 'personalizado' ? fechaPersonalizadaBorrador.trim() : obtenerFechaPreset(tipoPlazo);

      await useCases.objectives.create.execute({
        empresaId,
        usuarioId: perfil.id,
        creadoPor: perfil.id,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fechaLimite: fechaFinal,
        ciclo: fechaFinal,
        keyResults: krsValidos.map((kr) => ({
          titulo: kr.titulo.trim(),
          valorObjetivo: Number(kr.valorObjetivo),
          valorActual: 0,
          unidad: kr.unidad.trim() || t('misObjetivos.unit_default', { defaultValue: 'unidades' }),
        })),
      });
      setModalVisible(false);
    } catch (e: any) {
      console.error('[MisObjetivos] Error al guardar objetivo:', e);
      Alert.alert(t('misObjetivos.create_error_title'), e?.message || t('misObjetivos.generic_retry'));
    } finally {
      setGuardando(false);
    }
  };

  const guardarValorKR = async (keyResultId: string) => {
    const numero = Number(valorEdicion);
    if (Number.isNaN(numero) || numero < 0) {
      Alert.alert(t('misObjetivos.invalid_value_title'), t('misObjetivos.invalid_value_msg'));
      return;
    }
    try {
      await useCases.objectives.updateKeyResult.execute(keyResultId, numero);
      setEditandoKR(null);
    } catch (e: any) {
      Alert.alert(t('misObjetivos.update_error_title'), e?.message || t('misObjetivos.generic_retry'));
    }
  };

  const toggleEstadoObjetivo = async (objetivo: Objective) => {
    const nuevoEstado = objetivo.estado === 'completado' ? 'activo' : 'completado';
    try {
      await useCases.objectives.updateEstado.execute(objetivo.id, nuevoEstado);
    } catch (e: any) {
      Alert.alert(t('misObjetivos.update_error_title'), e?.message || t('misObjetivos.generic_retry'));
    }
  };

  const confirmarEliminar = (objetivo: Objective) => {
    Alert.alert(
      t('misObjetivos.delete_title'),
      t('misObjetivos.delete_msg', { titulo: objetivo.titulo }),
      [
        { text: t('misObjetivos.cancel'), style: 'cancel' },
        {
          text: t('misObjetivos.delete_confirm'),
          style: 'destructive',
          onPress: () => useCases.objectives.remove.execute(objetivo.id).catch(() => {}),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={estilos.fondoAbsoluto}>
        <FondoMobilePremium />
      </View>

      <NavbarEnterprise
        titulo={t('misObjetivos.title')}
        subtitulo={t('misObjetivos.subtitle')}
        mostrarAtras
      />

      <ScrollView
        contentContainerStyle={estilos.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner KPI Metrics Summary */}
        <Animated.View entering={FadeInDown.duration(280)} style={estilos.kpiGrid}>
          <View style={estilos.kpiCard}>
            <View style={[estilos.kpiIconBox, { backgroundColor: esOscuro ? 'rgba(59,130,246,0.18)' : 'rgba(37,99,235,0.10)' }]}>
              <Feather name="target" size={16} color={esOscuro ? '#60A5FA' : '#2563EB'} />
            </View>
            <Text style={estilos.kpiValor}>{metricasGlobales.total}</Text>
            <Text style={estilos.kpiLabel}>{t('misObjetivos.kpi_total')}</Text>
          </View>

          <View style={estilos.kpiCard}>
            <View style={[estilos.kpiIconBox, { backgroundColor: esOscuro ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.10)' }]}>
              <Feather name="trending-up" size={16} color="#10B981" />
            </View>
            <Text style={estilos.kpiValor}>{metricasGlobales.progresoMedio}%</Text>
            <Text style={estilos.kpiLabel}>{t('misObjetivos.kpi_progress')}</Text>
          </View>

          <View style={estilos.kpiCard}>
            <View style={[estilos.kpiIconBox, { backgroundColor: esOscuro ? 'rgba(139,92,246,0.18)' : 'rgba(139,92,246,0.10)' }]}>
              <Feather name="check-circle" size={16} color={esOscuro ? '#A78BFA' : '#7C3AED'} />
            </View>
            <Text style={estilos.kpiValor}>{metricasGlobales.completados}</Text>
            <Text style={estilos.kpiLabel}>{t('misObjetivos.kpi_completed')}</Text>
          </View>

          <View style={estilos.kpiCard}>
            <View style={[estilos.kpiIconBox, { backgroundColor: esOscuro ? 'rgba(245,158,11,0.18)' : 'rgba(245,158,11,0.10)' }]}>
              <Feather name="clock" size={16} color="#F59E0B" />
            </View>
            <Text style={estilos.kpiValor}>{metricasGlobales.activos}</Text>
            <Text style={estilos.kpiLabel}>{t('misObjetivos.kpi_active')}</Text>
          </View>
        </Animated.View>

        {/* Sección de Controles y Filtros */}
        <View style={estilos.filtrosContenedor}>
          {/* Selector de Estado */}
          <View style={estilos.grupoFiltroEstado}>
            <TouchableOpacity
              style={[estilos.pillEstado, filtroEstado === 'todos' && estilos.pillEstadoActivo]}
              onPress={() => setFiltroEstado('todos')}
              activeOpacity={0.8}
            >
              <Text style={[estilos.textoPillEstado, filtroEstado === 'todos' && estilos.textoPillEstadoActivo]}>
                {t('misObjetivos.filter_all')} ({metricasGlobales.total})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[estilos.pillEstado, filtroEstado === 'activo' && estilos.pillEstadoActivo]}
              onPress={() => setFiltroEstado('activo')}
              activeOpacity={0.8}
            >
              <Text style={[estilos.textoPillEstado, filtroEstado === 'activo' && estilos.textoPillEstadoActivo]}>
                {t('misObjetivos.filter_active')} ({metricasGlobales.activos})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[estilos.pillEstado, filtroEstado === 'completado' && estilos.pillEstadoActivo]}
              onPress={() => setFiltroEstado('completado')}
              activeOpacity={0.8}
            >
              <Text style={[estilos.textoPillEstado, filtroEstado === 'completado' && estilos.textoPillEstadoActivo]}>
                {t('misObjetivos.filter_completed')} ({metricasGlobales.completados})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Selector de Fecha Límite ("Ver resultados hasta") */}
          <View style={estilos.filaSelectorFecha}>
            <View style={estilos.encabezadoFiltroFecha}>
              <Feather name="calendar" size={13} color={colores.textoSuave} />
              <Text style={estilos.labelFiltroFecha}>{t('misObjetivos.date_filter_label')}</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.scrollChipsFecha}>
              <TouchableOpacity
                style={[estilos.chipFecha, filtroFecha === 'todas' && estilos.chipFechaActivo]}
                onPress={() => setFiltroFecha('todas')}
              >
                <Text style={[estilos.textoChipFecha, filtroFecha === 'todas' && estilos.textoChipFechaActivo]}>
                  {t('misObjetivos.date_all')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[estilos.chipFecha, filtroFecha === '30d' && estilos.chipFechaActivo]}
                onPress={() => setFiltroFecha('30d')}
              >
                <Text style={[estilos.textoChipFecha, filtroFecha === '30d' && estilos.textoChipFechaActivo]}>
                  {t('misObjetivos.date_30d')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[estilos.chipFecha, filtroFecha === '90d' && estilos.chipFechaActivo]}
                onPress={() => setFiltroFecha('90d')}
              >
                <Text style={[estilos.textoChipFecha, filtroFecha === '90d' && estilos.textoChipFechaActivo]}>
                  {t('misObjetivos.date_90d')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[estilos.chipFecha, filtroFecha === 'fin_anio' && estilos.chipFechaActivo]}
                onPress={() => setFiltroFecha('fin_anio')}
              >
                <Text style={[estilos.textoChipFecha, filtroFecha === 'fin_anio' && estilos.textoChipFechaActivo]}>
                  {t('misObjetivos.date_year')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[estilos.chipFecha, filtroFecha === 'personalizado' && estilos.chipFechaActivo]}
                onPress={() => {
                  setFiltroFecha('personalizado');
                  setMostrarModalFiltroFecha(true);
                }}
              >
                <Feather
                  name="edit-3"
                  size={11}
                  color={filtroFecha === 'personalizado' ? (esOscuro ? '#93C5FD' : '#2563EB') : colores.textoSuave}
                  style={{ marginRight: 4 }}
                />
                <Text style={[estilos.textoChipFecha, filtroFecha === 'personalizado' && estilos.textoChipFechaActivo]}>
                  {filtroFecha === 'personalizado'
                    ? formatearFechaBonita(fechaPersonalizadaFiltro)
                    : t('misObjetivos.date_custom')}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>

        {/* Lista de Objetivos */}
        {cargando ? (
          <View style={{ gap: 14, marginTop: 8 }}>
            <Skeleton height={140} radius={RADIOS.xxl} />
            <SkeletonLista filas={3} alturaFila={120} />
          </View>
        ) : objetivosFiltrados.length === 0 ? (
          <View style={{ marginTop: 24 }}>
            <EmptyState
              icono="target"
              titulo={
                objetivos.length === 0
                  ? t('misObjetivos.empty_title')
                  : t('misObjetivos.empty_filter_title')
              }
              detalle={
                objetivos.length === 0
                  ? t('misObjetivos.empty_detail')
                  : t('misObjetivos.empty_filter_detail')
              }
            />
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {objetivosFiltrados.map((objetivo, index) => {
              const progreso = calcularProgresoObjetivo(objetivo.keyResults);
              const estaCompletado = objetivo.estado === 'completado' || progreso >= 100;
              const fechaLimiteRaw = objetivo.fechaLimite || objetivo.ciclo;
              const diasRestantes = calcularDiasRestantes(fechaLimiteRaw);

              return (
                <Animated.View
                  key={objetivo.id}
                  entering={FadeInDown.duration(260).delay(index * 35).easing(Easing.out(Easing.quad))}
                  style={estilos.tarjetaWrap}
                >
                  <BlurView intensity={intensidadBlur} tint={blurTint} style={estilos.tarjetaContenido}>
                    {/* Header de la tarjeta */}
                    <View style={estilos.tarjetaHeader}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <View style={estilos.filaBadgesHeader}>
                          {/* Badge de Estado */}
                          <TouchableOpacity
                            style={[
                              estilos.badgeEstado,
                              estaCompletado ? estilos.badgeEstadoCompletado : estilos.badgeEstadoActivo,
                            ]}
                            onPress={() => toggleEstadoObjetivo(objetivo)}
                            activeOpacity={0.7}
                          >
                            <Feather
                              name={estaCompletado ? 'check' : 'zap'}
                              size={11}
                              color={estaCompletado ? '#10B981' : esOscuro ? '#60A5FA' : '#2563EB'}
                            />
                            <Text
                              style={[
                                estilos.textoBadgeEstado,
                                estaCompletado ? estilos.textoBadgeEstadoCompletado : estilos.textoBadgeEstadoActivo,
                              ]}
                            >
                              {estaCompletado ? t('misObjetivos.filter_completed') : t('misObjetivos.filter_active')}
                            </Text>
                          </TouchableOpacity>

                          {/* Badge de Fecha Límite */}
                          {!!fechaLimiteRaw && (
                            <View
                              style={[
                                estilos.badgeFecha,
                                diasRestantes?.urgente && !estaCompletado && estilos.badgeFechaUrgente,
                              ]}
                            >
                              <Feather
                                name="calendar"
                                size={11}
                                color={
                                  diasRestantes?.urgente && !estaCompletado
                                    ? '#EF4444'
                                    : colores.textoSuave
                                }
                              />
                              <Text
                                style={[
                                  estilos.textoBadgeFecha,
                                  diasRestantes?.urgente && !estaCompletado && estilos.textoBadgeFechaUrgente,
                                ]}
                              >
                                {formatearFechaBonita(fechaLimiteRaw)}
                                {diasRestantes && !estaCompletado ? ` • ${diasRestantes.texto}` : ''}
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text style={estilos.tituloObjetivo}>{objetivo.titulo}</Text>
                        {!!objetivo.descripcion && (
                          <Text style={estilos.descObjetivo}>{objetivo.descripcion}</Text>
                        )}
                      </View>

                      {/* Botón de eliminar */}
                      <TouchableOpacity
                        onPress={() => confirmarEliminar(objetivo)}
                        style={estilos.botonEliminar}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Feather name="trash-2" size={15} color={colores.textoSuave} />
                      </TouchableOpacity>
                    </View>

                    {/* Barra de progreso global */}
                    <View style={estilos.contenedorProgreso}>
                      <View style={estilos.barraFondoGrande}>
                        <View
                          style={[
                            estilos.barraRellenoGrande,
                            {
                              width: `${Math.min(100, progreso)}%`,
                              backgroundColor:
                                progreso >= 100 ? '#10B981' : esOscuro ? '#3B82F6' : '#2563EB',
                            },
                          ]}
                        />
                      </View>
                      <View style={estilos.progresoFila}>
                        <Text style={[estilos.textoProgresoGrande, progreso >= 100 && { color: '#10B981' }]}>
                          {t('misObjetivos.progress_complete', { percent: progreso })}
                        </Text>
                        <Text style={estilos.textoKRCount}>
                          {t('misObjetivos.kr_count', { count: objetivo.keyResults.length })}
                        </Text>
                      </View>
                    </View>

                    {/* Resultados Clave (KRs) */}
                    <View style={estilos.listaKRs}>
                      {objetivo.keyResults.map((kr) => {
                        const progresoKR = calcularProgresoKR(kr);
                        const enEdicion = editandoKR === kr.id;
                        const krCompletado = progresoKR >= 100;

                        return (
                          <View key={kr.id} style={estilos.filaKR}>
                            <View style={{ flex: 1, paddingRight: 10 }}>
                              <View style={estilos.filaTituloKR}>
                                <Text style={estilos.tituloKR}>{kr.titulo}</Text>
                                <Text style={estilos.progresoKRPorcentaje}>{progresoKR}%</Text>
                              </View>

                              <View style={estilos.barraFondoKR}>
                                <View
                                  style={[
                                    estilos.barraRellenoKR,
                                    {
                                      width: `${Math.min(100, progresoKR)}%`,
                                      backgroundColor: krCompletado ? '#10B981' : '#3B82F6',
                                    },
                                  ]}
                                />
                              </View>
                            </View>

                            {/* Editor de valor actual */}
                            {enEdicion ? (
                              <View style={estilos.edicionKR}>
                                <TextInput
                                  style={estilos.inputEdicionKR}
                                  value={valorEdicion}
                                  onChangeText={setValorEdicion}
                                  keyboardType="numeric"
                                  autoFocus
                                  selectTextOnFocus
                                />
                                <TouchableOpacity
                                  onPress={() => guardarValorKR(kr.id)}
                                  style={estilos.botonGuardarKR}
                                >
                                  <Feather name="check" size={14} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => setEditandoKR(null)}
                                  style={estilos.botonCancelarKR}
                                >
                                  <Feather name="x" size={13} color={colores.textoSuave} />
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <TouchableOpacity
                                onPress={() => {
                                  setEditandoKR(kr.id);
                                  setValorEdicion(String(kr.valorActual));
                                }}
                                style={[
                                  estilos.valorKRBoton,
                                  krCompletado && { borderColor: 'rgba(16,185,129,0.3)' },
                                ]}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    estilos.valorKRTexto,
                                    krCompletado && { color: '#10B981' },
                                  ]}
                                >
                                  {kr.valorActual}/{kr.valorObjetivo} {kr.unidad}
                                </Text>
                                <Feather name="edit-2" size={11} color={colores.textoSuave} />
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </BlurView>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Botón flotante para crear nuevo objetivo */}
      <BotonAnimado style={estilos.fab} onPress={abrirCrear} scaleTo={0.92}>
        <Feather name="plus" size={24} color="#fff" />
      </BotonAnimado>

      {/* Modal de Fecha Límite Personalizada para Filtro */}
      <ModalShell
        visible={mostrarModalFiltroFecha}
        onClose={() => setMostrarModalFiltroFecha(false)}
        maxHeight="50%"
        style={estilos.modalContenido}
      >
        <View style={estilos.modalHeader}>
          <Text style={estilos.modalTitulo}>Definir fecha de corte</Text>
          <TouchableOpacity
            onPress={() => setMostrarModalFiltroFecha(false)}
            style={estilos.botonCerrarModal}
          >
            <Feather name="x" size={20} color={colores.texto} />
          </TouchableOpacity>
        </View>

        <Text style={estilos.descObjetivo}>
          Ingresa la fecha hasta cuándo deseas visualizar resultados (formato AAAA-MM-DD):
        </Text>

        <TextInput
          style={[estilos.input, { marginTop: 14 }]}
          placeholder="AAAA-MM-DD (ej. 2026-12-31)"
          placeholderTextColor={colores.textoSuave}
          value={fechaPersonalizadaFiltro}
          onChangeText={setFechaPersonalizadaFiltro}
        />

        <BotonAnimado
          style={estilos.botonGuardar}
          onPress={() => {
            if (fechaPersonalizadaFiltro.trim()) {
              setFiltroFecha('personalizado');
              setMostrarModalFiltroFecha(false);
            }
          }}
          scaleTo={0.97}
        >
          <Text style={estilos.textoBotonGuardar}>Aplicar Filtro</Text>
        </BotonAnimado>
      </ModalShell>

      {/* Modal de Creación de Objetivo */}
      <ModalShell
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        maxHeight="92%"
        style={estilos.modalContenido}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={estilos.flexModal}
        >
          <View style={estilos.modalHeader}>
            <View>
              <Text style={estilos.modalTitulo}>{t('misObjetivos.modal_title')}</Text>
              <Text style={estilos.modalSubtitulo}>Define tu meta y resultados medibles</Text>
            </View>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={estilos.botonCerrarModal}>
              <Feather name="x" size={20} color={colores.texto} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: ESPACIADO.xxl }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Título */}
            <Text style={estilos.label}>{t('misObjetivos.label_title')}</Text>
            <TextInput
              style={estilos.input}
              placeholder={t('misObjetivos.placeholder_title')}
              placeholderTextColor={colores.textoSuave}
              value={titulo}
              onChangeText={setTitulo}
            />

            {/* Descripción */}
            <Text style={estilos.label}>{t('misObjetivos.label_description')}</Text>
            <TextInput
              style={[estilos.input, { height: 72, textAlignVertical: 'top' }]}
              placeholder={t('misObjetivos.placeholder_description')}
              placeholderTextColor={colores.textoSuave}
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
            />

            {/* Selector de Plazo / Fecha Límite */}
            <Text style={estilos.label}>{t('misObjetivos.label_deadline')}</Text>
            <View style={estilos.gridTipos}>
              <TouchableOpacity
                style={[estilos.chipTipo, tipoPlazo === '1m' && estilos.chipTipoActivo]}
                onPress={() => seleccionarTipoPlazo('1m')}
              >
                <Text style={[estilos.textoChip, tipoPlazo === '1m' && estilos.textoChipActivo]}>
                  {t('misObjetivos.deadline_1m')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[estilos.chipTipo, tipoPlazo === '3m' && estilos.chipTipoActivo]}
                onPress={() => seleccionarTipoPlazo('3m')}
              >
                <Text style={[estilos.textoChip, tipoPlazo === '3m' && estilos.textoChipActivo]}>
                  {t('misObjetivos.deadline_3m')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[estilos.chipTipo, tipoPlazo === '6m' && estilos.chipTipoActivo]}
                onPress={() => seleccionarTipoPlazo('6m')}
              >
                <Text style={[estilos.textoChip, tipoPlazo === '6m' && estilos.textoChipActivo]}>
                  {t('misObjetivos.deadline_6m')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[estilos.chipTipo, tipoPlazo === 'fin_anio' && estilos.chipTipoActivo]}
                onPress={() => seleccionarTipoPlazo('fin_anio')}
              >
                <Text style={[estilos.textoChip, tipoPlazo === 'fin_anio' && estilos.textoChipActivo]}>
                  {t('misObjetivos.deadline_year_end')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[estilos.chipTipo, tipoPlazo === 'personalizado' && estilos.chipTipoActivo]}
                onPress={() => seleccionarTipoPlazo('personalizado')}
              >
                <Text style={[estilos.textoChip, tipoPlazo === 'personalizado' && estilos.textoChipActivo]}>
                  {t('misObjetivos.deadline_custom_option')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Input para fecha personalizada si se seleccionó */}
            {tipoPlazo === 'personalizado' && (
              <View style={{ marginTop: 8 }}>
                <TextInput
                  style={estilos.input}
                  placeholder={t('misObjetivos.placeholder_date')}
                  placeholderTextColor={colores.textoSuave}
                  value={fechaPersonalizadaBorrador}
                  onChangeText={setFechaPersonalizadaBorrador}
                />
              </View>
            )}

            {/* Resultados Clave */}
            <View style={estilos.headerKRsModal}>
              <Text style={[estilos.label, { marginTop: 0, marginBottom: 0 }]}>
                {t('misObjetivos.label_key_results')}
              </Text>
              <Text style={estilos.ayudaKRs}>Agrega al menos 1 meta medible</Text>
            </View>

            {krs.map((kr, index) => (
              <View key={index} style={estilos.filaKRBorrador}>
                <TextInput
                  style={[estilos.input, { flex: 2.2, marginBottom: 0 }]}
                  placeholder={t('misObjetivos.placeholder_kr_title')}
                  placeholderTextColor={colores.textoSuave}
                  value={kr.titulo}
                  onChangeText={(v) => actualizarKR(index, 'titulo', v)}
                />
                <TextInput
                  style={[estilos.input, { flex: 1.1, marginBottom: 0 }]}
                  placeholder={t('misObjetivos.placeholder_kr_goal')}
                  placeholderTextColor={colores.textoSuave}
                  value={kr.valorObjetivo}
                  onChangeText={(v) => actualizarKR(index, 'valorObjetivo', v)}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[estilos.input, { flex: 1.2, marginBottom: 0 }]}
                  placeholder={t('misObjetivos.placeholder_kr_unit')}
                  placeholderTextColor={colores.textoSuave}
                  value={kr.unidad}
                  onChangeText={(v) => actualizarKR(index, 'unidad', v)}
                />
                {krs.length > 1 && (
                  <TouchableOpacity onPress={() => quitarFilaKR(index)} style={estilos.botonQuitarKR}>
                    <Feather name="trash-2" size={16} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity onPress={agregarFilaKR} style={estilos.botonAgregarKR}>
              <Feather name="plus-circle" size={16} color={esOscuro ? '#93C5FD' : '#2563EB'} />
              <Text style={estilos.textoAgregarKR}>{t('misObjetivos.add_kr')}</Text>
            </TouchableOpacity>

            <BotonAnimado
              style={[estilos.botonGuardar, !puedeGuardar && { opacity: 0.5 }]}
              onPress={guardarObjetivo}
              disabled={!puedeGuardar}
              scaleTo={0.97}
            >
              {guardando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={estilos.textoBotonGuardar}>{t('misObjetivos.save_objective')}</Text>
              )}
            </BotonAnimado>
          </ScrollView>
        </KeyboardAvoidingView>
      </ModalShell>
    </SafeAreaView>
  );
}

function crearEstilos(c: any, esOscuro: boolean) {
  const glass = esOscuro ? 'rgba(24, 24, 38, 0.88)' : 'rgba(255, 255, 255, 0.94)';
  const tarjetaGlass = esOscuro ? 'rgba(28, 28, 44, 0.90)' : 'rgba(255, 255, 255, 0.96)';

  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: c.fondo },
    fondoAbsoluto: { ...StyleSheet.absoluteFill, zIndex: -1, overflow: 'hidden' },

    scroll: {
      padding: 16,
      paddingBottom: 120,
    },

    // KPI Metrics Summary
    kpiGrid: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    kpiCard: {
      flex: 1,
      backgroundColor: tarjetaGlass,
      borderRadius: 18,
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.borde,
      ...SOMBRAS.suave,
    },
    kpiIconBox: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    kpiValor: {
      fontSize: 16,
      fontWeight: '900',
      color: c.texto,
      letterSpacing: -0.3,
    },
    kpiLabel: {
      fontSize: 10.5,
      fontWeight: '700',
      color: c.textoSuave,
      marginTop: 2,
      textAlign: 'center',
    },

    // Filtros
    filtrosContenedor: {
      backgroundColor: tarjetaGlass,
      borderRadius: 20,
      padding: 12,
      borderWidth: 1,
      borderColor: c.borde,
      marginBottom: 16,
      gap: 12,
      ...SOMBRAS.suave,
    },
    grupoFiltroEstado: {
      flexDirection: 'row',
      gap: 8,
    },
    pillEstado: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: RADIOS.md,
      alignItems: 'center',
      backgroundColor: c.vidrioSutil,
      borderWidth: 1,
      borderColor: c.borde,
    },
    pillEstadoActivo: {
      backgroundColor: esOscuro ? 'rgba(59,130,246,0.22)' : 'rgba(37,99,235,0.12)',
      borderColor: esOscuro ? 'rgba(96,165,250,0.6)' : 'rgba(37,99,235,0.45)',
    },
    textoPillEstado: {
      fontSize: 11.5,
      fontWeight: '700',
      color: c.textoSuave,
    },
    textoPillEstadoActivo: {
      color: esOscuro ? '#93C5FD' : '#2563EB',
      fontWeight: '900',
    },

    filaSelectorFecha: {
      gap: 8,
    },
    encabezadoFiltroFecha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    labelFiltroFecha: {
      fontSize: 11,
      fontWeight: '800',
      color: c.textoSuave,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    scrollChipsFecha: {
      gap: 8,
      paddingVertical: 2,
    },
    chipFecha: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: RADIOS.completo,
      backgroundColor: c.vidrioSutil,
      borderWidth: 1,
      borderColor: c.borde,
    },
    chipFechaActivo: {
      backgroundColor: esOscuro ? 'rgba(59,130,246,0.20)' : 'rgba(37,99,235,0.12)',
      borderColor: esOscuro ? 'rgba(96,165,250,0.5)' : 'rgba(37,99,235,0.4)',
    },
    textoChipFecha: {
      fontSize: 11.5,
      fontWeight: '700',
      color: c.textoSuave,
    },
    textoChipFechaActivo: {
      color: esOscuro ? '#93C5FD' : '#2563EB',
      fontWeight: '900',
    },

    // Tarjeta de Objetivo
    tarjetaWrap: {
      borderRadius: 22,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      ...SOMBRAS.flotante,
    },
    tarjetaContenido: {
      padding: 16,
      backgroundColor: tarjetaGlass,
    },
    tarjetaHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    filaBadgesHeader: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    badgeEstado: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
    },
    badgeEstadoActivo: {
      backgroundColor: esOscuro ? 'rgba(59,130,246,0.15)' : 'rgba(37,99,235,0.08)',
      borderColor: esOscuro ? 'rgba(96,165,250,0.3)' : 'rgba(37,99,235,0.25)',
    },
    badgeEstadoCompletado: {
      backgroundColor: 'rgba(16,185,129,0.12)',
      borderColor: 'rgba(16,185,129,0.3)',
    },
    textoBadgeEstado: {
      fontSize: 10.5,
      fontWeight: '800',
    },
    textoBadgeEstadoActivo: {
      color: esOscuro ? '#93C5FD' : '#2563EB',
    },
    textoBadgeEstadoCompletado: {
      color: '#10B981',
    },
    badgeFecha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: c.vidrioSutil,
      borderWidth: 1,
      borderColor: c.borde,
    },
    badgeFechaUrgente: {
      backgroundColor: 'rgba(239,68,68,0.10)',
      borderColor: 'rgba(239,68,68,0.30)',
    },
    textoBadgeFecha: {
      fontSize: 10.5,
      fontWeight: '700',
      color: c.textoSuave,
    },
    textoBadgeFechaUrgente: {
      color: '#EF4444',
      fontWeight: '800',
    },
    tituloObjetivo: {
      fontSize: 16,
      fontWeight: '800',
      color: c.texto,
      letterSpacing: -0.2,
      lineHeight: 22,
    },
    descObjetivo: {
      fontSize: 12.5,
      color: c.textoSuave,
      marginTop: 4,
      lineHeight: 18,
    },
    botonEliminar: {
      padding: 6,
      borderRadius: 10,
      backgroundColor: c.vidrioSutil,
    },

    // Progreso
    contenedorProgreso: {
      marginTop: 4,
      marginBottom: 12,
    },
    barraFondoGrande: {
      height: 8,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      borderRadius: 4,
      overflow: 'hidden',
    },
    barraRellenoGrande: {
      height: '100%',
      borderRadius: 4,
    },
    progresoFila: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 6,
    },
    textoProgresoGrande: {
      fontSize: 12,
      fontWeight: '800',
      color: c.texto,
    },
    textoKRCount: {
      fontSize: 11,
      color: c.textoSuave,
      fontWeight: '600',
    },

    // Key Results
    listaKRs: {
      borderTopWidth: 1,
      borderTopColor: c.borde,
      paddingTop: 8,
      gap: 10,
    },
    filaKR: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    filaTituloKR: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    tituloKR: {
      fontSize: 12.5,
      fontWeight: '700',
      color: c.texto,
      flex: 1,
    },
    progresoKRPorcentaje: {
      fontSize: 11,
      fontWeight: '800',
      color: c.textoSuave,
      marginLeft: 6,
    },
    barraFondoKR: {
      height: 5,
      backgroundColor: esOscuro ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      borderRadius: 3,
      overflow: 'hidden',
    },
    barraRellenoKR: {
      height: '100%',
      borderRadius: 3,
    },
    valorKRBoton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: c.vidrioSutil,
      borderWidth: 1,
      borderColor: c.borde,
    },
    valorKRTexto: {
      fontSize: 11.5,
      fontWeight: '800',
      color: c.texto,
    },
    edicionKR: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    inputEdicionKR: {
      width: 58,
      height: 32,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#3B82F6',
      paddingHorizontal: 6,
      color: c.texto,
      fontSize: 12.5,
      fontWeight: '800',
      textAlign: 'center',
      backgroundColor: glass,
    },
    botonGuardarKR: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: esOscuro ? '#3B82F6' : '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
    },
    botonCancelarKR: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.vidrioSutil,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Floating Button
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: esOscuro ? '#3B82F6' : '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.flotante,
    },

    // Modal
    flexModal: { flex: 1 },
    modalContenido: { backgroundColor: c.fondo },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    modalTitulo: {
      fontSize: 18,
      fontWeight: '900',
      color: c.texto,
      letterSpacing: -0.3,
    },
    modalSubtitulo: {
      fontSize: 12,
      color: c.textoSuave,
      marginTop: 2,
    },
    botonCerrarModal: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.vidrioSutil,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontSize: 11,
      fontWeight: '800',
      color: c.textoSuave,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 6,
      marginTop: 12,
    },
    input: {
      borderWidth: 1,
      borderColor: c.borde,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontSize: 13.5,
      color: c.texto,
      backgroundColor: glass,
      marginBottom: 8,
    },
    gridTipos: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chipTipo: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: RADIOS.completo,
      backgroundColor: glass,
      borderWidth: 1,
      borderColor: c.borde,
    },
    chipTipoActivo: {
      backgroundColor: esOscuro ? 'rgba(59,130,246,0.20)' : 'rgba(37,99,235,0.12)',
      borderColor: esOscuro ? 'rgba(96,165,250,0.5)' : 'rgba(37,99,235,0.4)',
    },
    textoChip: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textoSuave,
    },
    textoChipActivo: {
      color: esOscuro ? '#93C5FD' : '#2563EB',
      fontWeight: '900',
    },
    headerKRsModal: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 14,
      marginBottom: 8,
    },
    ayudaKRs: {
      fontSize: 11,
      color: c.textoSuave,
      fontWeight: '600',
    },
    filaKRBorrador: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 8,
      alignItems: 'center',
    },
    botonQuitarKR: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    botonAgregarKR: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
    },
    textoAgregarKR: {
      fontSize: 12.5,
      fontWeight: '800',
      color: esOscuro ? '#93C5FD' : '#2563EB',
    },
    botonGuardar: {
      backgroundColor: esOscuro ? '#3B82F6' : '#2563EB',
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 16,
    },
    textoBotonGuardar: {
      color: '#fff',
      fontWeight: '900',
      fontSize: 14.5,
    },
  });
}
