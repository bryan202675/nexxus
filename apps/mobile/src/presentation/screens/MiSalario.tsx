/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/MiSalario.tsx
 * Capa: presentacion.
 * Proposito: Pantalla ejecutiva de consulta de salario, desglose de nómina e historial de recibos.
 * Rediseñado con estética Glassmorphism monocromática ejecutiva, tarjetas Bento interactivas,
 * modal de detalle completo de recibo y animaciones fluidas con Reanimated.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useTemaMobile } from '@/presentation/context/TemaMobileContext';
import { RADIOS, SOMBRAS } from '@/shared/constants/diseno';
import { Payment } from 'domain/entities/Payment';
import FondoMobilePremium from '@/presentation/components/FondoMobilePremium';
import NavbarEnterprise from '@/presentation/components/NavbarEnterprise';
import ModalShell from '@/presentation/components/ui/ModalShell';
import EmptyState from '@/presentation/components/ui/EmptyState';
import BotonAnimado from '@/presentation/components/BotonAnimado';

type Props = { navigation: { goBack: () => void; navigate: (route: string) => void } };

const money = (value: unknown, currency = 'USD') => {
  const amount = typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0;
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const dateLabel = (value: string | undefined) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' });
};

const filenameSafe = (value: string) =>
  value.replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'recibo';

const buildReceiptText = (payment: Payment, employeeName: string, companyName = 'NEXXUS ENTERPRISE') => [
  `========================================`,
  `         ${companyName.toUpperCase()}`,
  `         COMPROBANTE DE PAGO DE NÓMINA`,
  `========================================`,
  `Empleado:        ${employeeName}`,
  `Cargo / Depto:   ${payment.cargo || 'Personal'} · ${payment.departamento || 'Operaciones'}`,
  `Periodo:         ${payment.periodo}`,
  `Estado:          ${payment.estado}`,
  `Fecha de pago:   ${dateLabel(payment.fecha_pago)}`,
  `----------------------------------------`,
  `INGRESOS Y PERCEPCIONES:`,
  `  Salario base:        ${money(payment.salario_base || payment.salario_bruto, payment.moneda)}`,
  payment.bono ? `  Bonificaciones:      ${money(payment.bono, payment.moneda)}` : null,
  payment.comision ? `  Comisiones:          ${money(payment.comision, payment.moneda)}` : null,
  payment.horas_extra ? `  Horas extra:         ${money(payment.horas_extra, payment.moneda)}` : null,
  payment.aguinaldo ? `  Aguinaldo:           ${money(payment.aguinaldo, payment.moneda)}` : null,
  payment.vacaciones_pagadas ? `  Vacaciones pagadas:  ${money(payment.vacaciones_pagadas, payment.moneda)}` : null,
  `  TOTAL BRUTO:         ${money(payment.salario_bruto, payment.moneda)}`,
  `----------------------------------------`,
  `DEDUCCIONES Y RETENCIONES DE LEY:`,
  `  ISSS (Salud):       -${money(payment.isss, payment.moneda)}`,
  `  AFP (Previsión):    -${money(payment.afp, payment.moneda)}`,
  `  Renta (ISR):        -${money(payment.renta, payment.moneda)}`,
  payment.descuentos_adicionales ? `  Otros descuentos:   -${money(payment.descuentos_adicionales, payment.moneda)}` : null,
  `  TOTAL DEDUCCIONES:  -${money((payment.isss || 0) + (payment.afp || 0) + (payment.renta || 0) + (payment.descuentos_adicionales || 0), payment.moneda)}`,
  `========================================`,
  `TOTAL NETO A RECIBIR:  ${money(payment.salario_neto, payment.moneda)}`,
  `========================================`,
  payment.banco ? `Banco acreditado:    ${payment.banco} ${payment.cuenta_bancaria ? `(***${payment.cuenta_bancaria.slice(-4)})` : ''}` : null,
  `Folio de nómina:     ${payment.id}`,
  `Fecha emisión:       ${new Date().toLocaleString('es-SV')}`,
  `----------------------------------------`,
  `Este recibo es generado por Nexxus Core.`,
].filter(Boolean).join('\n');

export default function MiSalario({ navigation }: Props) {
  const { perfil, pagos, recargarDatos, cargando } = useContextoUsuario();
  const { colores, blurTint, intensidadBlur, esOscuro } = useTemaMobile();
  const estilos = useMemo(() => crearEstilosSalario(colores, esOscuro), [colores, esOscuro]);

  const [refreshing, setRefreshing] = useState(false);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null);
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Payment | null>(null);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);

  const orderedPayments = useMemo(() => {
    return [...pagos].sort((a, b) => {
      const dateA = Date.parse(a.fecha_pago || a.createdAt || '');
      const dateB = Date.parse(b.fecha_pago || b.createdAt || '');
      return (Number.isFinite(dateB) ? dateB : 0) - (Number.isFinite(dateA) ? dateA : 0);
    });
  }, [pagos]);

  const latest = orderedPayments[0];
  const paidPayments = orderedPayments.filter((item) => item.estado === 'Pagado');
  const totalPaid = paidPayments.reduce((total, item) => total + (Number(item.salario_neto) || 0), 0);
  const latestDeducciones = latest
    ? (latest.isss || 0) + (latest.afp || 0) + (latest.renta || 0) + (latest.descuentos_adicionales || 0)
    : 0;

  const refresh = async () => {
    setRefreshing(true);
    try {
      if (recargarDatos) {
        await recargarDatos();
      }
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (recargarDatos) {
        recargarDatos();
      }
    }, [recargarDatos])
  );

  const downloadReceipt = async (payment: Payment) => {
    setDownloadingReceiptId(payment.id);
    try {
      const content = buildReceiptText(payment, perfil?.nombre || payment.usuarioNombre || 'Empleado');
      const filename = `Recibo_${filenameSafe(payment.periodo)}_${filenameSafe(payment.id)}.txt`;

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        return;
      }

      const uri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, { mimeType: 'text/plain', dialogTitle: `Recibo de Nómina - ${payment.periodo}` });
      } else {
        Alert.alert('Recibo Generado', `Guardado en: ${uri}`);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo generar el comprobante.');
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  const abrirDetallePago = (payment: Payment) => {
    setPagoSeleccionado(payment);
    setModalDetalleVisible(true);
  };

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case 'Pagado':
        return '#10B981';
      case 'Procesando':
        return '#3B82F6';
      default:
        return '#F59E0B';
    }
  };

  return (
    <SafeAreaView style={estilos.root}>
      <StatusBar barStyle={esOscuro ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <View style={estilos.background}>
        <FondoMobilePremium />
      </View>

      <NavbarEnterprise
        titulo="Mi Salario"
        subtitulo="Nómina y comprobantes"
        mostrarAtras
        ocultarAccionesDerechas
        accionDerecha={
          <BotonAnimado
            onPress={refresh}
            scaleTo={0.92}
            disabled={refreshing || cargando}
            accessibilityLabel="Actualizar pagos"
            style={estilos.iconButton}
          >
            {refreshing || cargando ? (
              <ActivityIndicator size="small" color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
            ) : (
              <MaterialIcons name="refresh" size={19} color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
            )}
          </BotonAnimado>
        }
      />

      <ScrollView
        contentContainerStyle={estilos.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colores.texto}
          />
        }
      >
        {/* Hero Card Ejecutivo */}
        <Animated.View entering={FadeInDown.duration(320).delay(0)} style={estilos.heroContainer}>
          <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 12 : 85} tint={blurTint} style={estilos.heroCard}>
            <View style={estilos.heroTopRow}>
              <View style={estilos.heroPill}>
                <Feather name="shield" size={12} color={colores.textoSuave} />
                <Text style={estilos.heroPillTexto}>NÓMINA OFICIAL</Text>
              </View>
              {latest && (
                <View
                  style={[
                    estilos.badgeEstado,
                    {
                      backgroundColor: obtenerColorEstado(latest.estado) + '18',
                      borderColor: obtenerColorEstado(latest.estado) + '40',
                    },
                  ]}
                >
                  <Text style={[estilos.textoBadge, { color: obtenerColorEstado(latest.estado) }]}>
                    {latest.estado.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <Text style={estilos.heroLabel}>Último salario neto</Text>
            <Text style={estilos.heroAmount}>
              {latest ? money(latest.salario_neto, latest.moneda || 'USD') : money(0)}
            </Text>

            <Text style={estilos.heroMeta}>
              {latest
                ? `Período: ${latest.periodo} · Desembolsado el ${dateLabel(latest.fecha_pago)}`
                : 'La nómina aparecerá automáticamente cuando administración publique un pago.'}
            </Text>

            <View style={estilos.divisorHero} />

            {/* Grid 3 métricas ejecutivas */}
            <View style={estilos.heroGrid}>
              <View style={estilos.metricItem}>
                <Text style={estilos.metricLabel}>Salario base</Text>
                <Text style={estilos.metricValue} numberOfLines={1}>
                  {money(latest?.salario_base ?? perfil?.salarioBase ?? 0, latest?.moneda || 'USD')}
                </Text>
              </View>

              <View style={estilos.divisorVerticalMetric} />

              <View style={estilos.metricItem}>
                <Text style={estilos.metricLabel}>Deducciones</Text>
                <Text style={[estilos.metricValue, { color: '#EF4444' }]} numberOfLines={1}>
                  {latestDeducciones > 0 ? `-${money(latestDeducciones, latest?.moneda || 'USD')}` : '$0.00'}
                </Text>
              </View>

              <View style={estilos.divisorVerticalMetric} />

              <View style={estilos.metricItem}>
                <Text style={estilos.metricLabel}>Total pagado</Text>
                <Text style={[estilos.metricValue, { color: '#10B981' }]} numberOfLines={1}>
                  {money(totalPaid)}
                </Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Desglose del Último Recibo */}
        {latest ? (
          <Animated.View entering={FadeInDown.duration(320).delay(60)} style={estilos.cardContainer}>
            <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 8 : 80} tint={blurTint} style={estilos.breakdownCard}>
              <View style={estilos.seccionHeaderBreakdown}>
                <View>
                  <Text style={estilos.sectionTitle}>Desglose de Nómina</Text>
                  <Text style={estilos.sectionSubtitle}>{latest.periodo}</Text>
                </View>
                <BotonAnimado
                  onPress={() => abrirDetallePago(latest)}
                  scaleTo={0.92}
                  style={estilos.botonVerDetalleChip}
                >
                  <Text style={estilos.textoVerDetalleChip}>Ver Completo</Text>
                  <Feather name="chevron-right" size={14} color={colores.texto} />
                </BotonAnimado>
              </View>

              {/* Lista de Líneas */}
              <View style={estilos.lineasContainer}>
                <PayrollLineItem label="Salario Bruto" value={money(latest.salario_bruto, latest.moneda)} estilos={estilos} positive />
                <PayrollLineItem label="ISSS (Salud 3%)" value={`-${money(latest.isss, latest.moneda)}`} estilos={estilos} />
                <PayrollLineItem label="AFP (Previsión 7.25%)" value={`-${money(latest.afp, latest.moneda)}`} estilos={estilos} />
                <PayrollLineItem label="Renta (Retención ISR)" value={`-${money(latest.renta, latest.moneda)}`} estilos={estilos} />

                {((latest.bono || 0) + (latest.comision || 0) + (latest.horas_extra || 0)) > 0 && (
                  <PayrollLineItem
                    label="Bonos y Horas Extra"
                    value={`+${money((latest.bono || 0) + (latest.comision || 0) + (latest.horas_extra || 0), latest.moneda)}`}
                    estilos={estilos}
                    positive
                  />
                )}

                {(latest.descuentos_adicionales || 0) > 0 && (
                  <PayrollLineItem
                    label="Descuentos adicionales"
                    value={`-${money(latest.descuentos_adicionales, latest.moneda)}`}
                    estilos={estilos}
                  />
                )}
              </View>

              {/* Total Card */}
              <View style={estilos.totalCard}>
                <View>
                  <Text style={estilos.totalCardLabel}>Total neto depositado</Text>
                  <Text style={estilos.totalCardDate}>Fecha de pago: {dateLabel(latest.fecha_pago)}</Text>
                </View>
                <Text style={estilos.totalCardValue}>{money(latest.salario_neto, latest.moneda)}</Text>
              </View>

              {/* Botón Descargar Comprobante */}
              <BotonAnimado
                onPress={() => downloadReceipt(latest)}
                disabled={downloadingReceiptId === latest.id}
                scaleTo={0.96}
                style={estilos.receiptButton}
              >
                {downloadingReceiptId === latest.id ? (
                  <ActivityIndicator size="small" color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
                ) : (
                  <>
                    <Feather name="download" size={17} color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
                    <Text style={estilos.receiptButtonText}>Descargar Comprobante Oficial</Text>
                  </>
                )}
              </BotonAnimado>
            </BlurView>
          </Animated.View>
        ) : (
          <EmptyState
            icono="dollar-sign"
            titulo="Sin nómina publicada"
            detalle="Cuando administración apruebe y publique tu nómina, verás aquí el desglose y comprobantes oficiales."
            accionLabel="Ver historial completo"
            onAccion={() => navigation.navigate('HistorialCompleto')}
          />
        )}

        {/* Historial de Nóminas */}
        <View style={estilos.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="file-text" size={16} color={colores.texto} />
            <Text style={estilos.sectionTitle}>Historial de Recibos</Text>
          </View>
          <View style={estilos.badgeCount}>
            <Text style={estilos.textoBadgeCount}>{orderedPayments.length} registros</Text>
          </View>
        </View>

        {orderedPayments.map((payment, index) => (
          <Animated.View key={payment.id} entering={FadeInDown.duration(320).delay(Math.min(index, 10) * 35)}>
            <BotonAnimado
              onPress={() => abrirDetallePago(payment)}
              scaleTo={0.98}
              style={estilos.paymentCard}
            >
              <BlurView intensity={Platform.OS === 'ios' ? intensidadBlur + 6 : 75} tint={blurTint} style={estilos.paymentContent}>
                <View
                  style={[
                    estilos.paymentIconWrap,
                    {
                      backgroundColor: obtenerColorEstado(payment.estado) + '18',
                      borderColor: obtenerColorEstado(payment.estado) + '35',
                    },
                  ]}
                >
                  <MaterialIcons
                    name={payment.estado === 'Pagado' ? 'check' : 'hourglass-top'}
                    size={18}
                    color={obtenerColorEstado(payment.estado)}
                  />
                </View>

                <View style={estilos.paymentCopy}>
                  <Text style={estilos.paymentTitle}>{payment.periodo}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <Text style={estilos.paymentMeta}>{dateLabel(payment.fecha_pago)}</Text>
                    <View style={estilos.puntoSeparador} />
                    <Text style={[estilos.paymentEstadoTexto, { color: obtenerColorEstado(payment.estado) }]}>
                      {payment.estado}
                    </Text>
                  </View>
                </View>

                <View style={estilos.paymentActions}>
                  <Text style={estilos.paymentAmount}>{money(payment.salario_neto, payment.moneda)}</Text>
                  <Feather name="chevron-right" size={16} color={colores.textoSuave} />
                </View>
              </BlurView>
            </BotonAnimado>
          </Animated.View>
        ))}
      </ScrollView>

      {/* MODAL DE DETALLE COMPLETO DE RECIBO DE NÓMINA */}
      <ModalShell visible={modalDetalleVisible} onClose={() => setModalDetalleVisible(false)} style={estilos.modalContenido}>
        {pagoSeleccionado && (
          <View style={estilos.flexModal}>
            <View style={estilos.modalHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Feather name="shield" size={12} color={colores.textoSuave} />
                  <Text style={estilos.tipoSolicitud}>COMPROBANTE DE PAGO</Text>
                </View>
                <Text style={estilos.modalTitulo} numberOfLines={1}>
                  {pagoSeleccionado.periodo}
                </Text>
              </View>
              <BotonAnimado onPress={() => setModalDetalleVisible(false)} scaleTo={0.92} style={estilos.botonCerrarModal}>
                <Feather name="x" size={18} color={colores.texto} />
              </BotonAnimado>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.scrollModal}>
              {/* Tarjeta Destacada de Monto Neto */}
              <View style={estilos.modalHeroNeto}>
                <Text style={estilos.modalHeroNetoLabel}>Total Neto Acreditado</Text>
                <Text style={estilos.modalHeroNetoAmount}>
                  {money(pagoSeleccionado.salario_neto, pagoSeleccionado.moneda)}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                  <View
                    style={[
                      estilos.badgeEstado,
                      {
                        backgroundColor: obtenerColorEstado(pagoSeleccionado.estado) + '18',
                        borderColor: obtenerColorEstado(pagoSeleccionado.estado) + '40',
                      },
                    ]}
                  >
                    <Text style={[estilos.textoBadge, { color: obtenerColorEstado(pagoSeleccionado.estado) }]}>
                      {pagoSeleccionado.estado.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={estilos.modalFechaPagoTexto}>
                    Pagado el {dateLabel(pagoSeleccionado.fecha_pago)}
                  </Text>
                </View>
              </View>

              {/* Sección Ingresos */}
              <View style={estilos.detalleSeccionCard}>
                <Text style={estilos.detalleLabel}>Percepciones e Ingresos Brutos</Text>
                <PayrollLineItem label="Salario Base" value={money(pagoSeleccionado.salario_base || pagoSeleccionado.salario_bruto, pagoSeleccionado.moneda)} estilos={estilos} positive />
                {!!pagoSeleccionado.bono && (
                  <PayrollLineItem label="Bonos" value={`+${money(pagoSeleccionado.bono, pagoSeleccionado.moneda)}`} estilos={estilos} positive />
                )}
                {!!pagoSeleccionado.comision && (
                  <PayrollLineItem label="Comisiones" value={`+${money(pagoSeleccionado.comision, pagoSeleccionado.moneda)}`} estilos={estilos} positive />
                )}
                {!!pagoSeleccionado.horas_extra && (
                  <PayrollLineItem label="Horas Extra" value={`+${money(pagoSeleccionado.horas_extra, pagoSeleccionado.moneda)}`} estilos={estilos} positive />
                )}
                {!!pagoSeleccionado.aguinaldo && (
                  <PayrollLineItem label="Aguinaldo" value={`+${money(pagoSeleccionado.aguinaldo, pagoSeleccionado.moneda)}`} estilos={estilos} positive />
                )}
                <View style={[estilos.lineaItem, { borderBottomWidth: 0, paddingTop: 8 }]}>
                  <Text style={[estilos.lineaLabel, { fontWeight: '800', color: colores.texto }]}>Total Bruto</Text>
                  <Text style={[estilos.lineaValue, { color: '#10B981', fontWeight: '800' }]}>{money(pagoSeleccionado.salario_bruto, pagoSeleccionado.moneda)}</Text>
                </View>
              </View>

              {/* Sección Deducciones */}
              <View style={estilos.detalleSeccionCard}>
                <Text style={estilos.detalleLabel}>Retenciones y Deducciones de Ley</Text>
                <PayrollLineItem label="ISSS (Seguro Social 3%)" value={`-${money(pagoSeleccionado.isss, pagoSeleccionado.moneda)}`} estilos={estilos} />
                <PayrollLineItem label="AFP (Fondo de Pensiones 7.25%)" value={`-${money(pagoSeleccionado.afp, pagoSeleccionado.moneda)}`} estilos={estilos} />
                <PayrollLineItem label="Renta (Retención ISR)" value={`-${money(pagoSeleccionado.renta, pagoSeleccionado.moneda)}`} estilos={estilos} />
                {!!pagoSeleccionado.descuentos_adicionales && (
                  <PayrollLineItem label="Otros Descuentos" value={`-${money(pagoSeleccionado.descuentos_adicionales, pagoSeleccionado.moneda)}`} estilos={estilos} />
                )}
                <View style={[estilos.lineaItem, { borderBottomWidth: 0, paddingTop: 8 }]}>
                  <Text style={[estilos.lineaLabel, { fontWeight: '800', color: colores.texto }]}>Total Deducciones</Text>
                  <Text style={[estilos.lineaValue, { color: '#EF4444', fontWeight: '800' }]}>
                    -{money((pagoSeleccionado.isss || 0) + (pagoSeleccionado.afp || 0) + (pagoSeleccionado.renta || 0) + (pagoSeleccionado.descuentos_adicionales || 0), pagoSeleccionado.moneda)}
                  </Text>
                </View>
              </View>

              {/* Sección Datos de Dispersión / Empleado */}
              <View style={estilos.detalleSeccionCard}>
                <Text style={estilos.detalleLabel}>Información de Dispersión</Text>
                <View style={estilos.infoRowModal}>
                  <Text style={estilos.infoRowKey}>Beneficiario</Text>
                  <Text style={estilos.infoRowVal}>{perfil?.nombre || pagoSeleccionado.usuarioNombre || 'Empleado'}</Text>
                </View>
                <View style={estilos.infoRowModal}>
                  <Text style={estilos.infoRowKey}>Cargo / Depto</Text>
                  <Text style={estilos.infoRowVal}>{pagoSeleccionado.cargo || perfil?.cargo || 'General'} · {pagoSeleccionado.departamento || 'Operaciones'}</Text>
                </View>
                {pagoSeleccionado.banco && (
                  <View style={estilos.infoRowModal}>
                    <Text style={estilos.infoRowKey}>Cuenta Bancaria</Text>
                    <Text style={estilos.infoRowVal}>{pagoSeleccionado.banco} {pagoSeleccionado.cuenta_bancaria ? `(***${pagoSeleccionado.cuenta_bancaria.slice(-4)})` : ''}</Text>
                  </View>
                )}
                <View style={estilos.infoRowModal}>
                  <Text style={estilos.infoRowKey}>Folio / ID</Text>
                  <Text style={estilos.infoRowVal} numberOfLines={1}>{pagoSeleccionado.id}</Text>
                </View>
              </View>

              {/* Botón de Descarga / Compartir en Modal */}
              <BotonAnimado
                onPress={() => downloadReceipt(pagoSeleccionado)}
                disabled={downloadingReceiptId === pagoSeleccionado.id}
                scaleTo={0.96}
                style={estilos.receiptButtonModal}
              >
                {downloadingReceiptId === pagoSeleccionado.id ? (
                  <ActivityIndicator size="small" color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
                ) : (
                  <>
                    <Feather name="share-2" size={17} color={esOscuro ? '#0B0C1E' : '#FFFFFF'} />
                    <Text style={estilos.receiptButtonText}>Descargar / Compartir Recibo</Text>
                  </>
                )}
              </BotonAnimado>
            </ScrollView>
          </View>
        )}
      </ModalShell>
    </SafeAreaView>
  );
}

function PayrollLineItem({
  label,
  value,
  estilos,
  positive,
}: {
  label: string;
  value: string;
  estilos: ReturnType<typeof crearEstilosSalario>;
  positive?: boolean;
}) {
  return (
    <View style={estilos.lineaItem}>
      <Text style={estilos.lineaLabel}>{label}</Text>
      <Text style={[estilos.lineaValue, positive && estilos.lineaValuePositive]}>{value}</Text>
    </View>
  );
}

function crearEstilosSalario(c: any, esOscuro: boolean) {
  const glassMini = c.vidrioSutil;
  const inputBg = esOscuro ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)';
  const activeSurface = esOscuro ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.06)';
  const activeBorder = esOscuro ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.18)';
  const modalBg = esOscuro ? 'rgba(11,12,30,0.96)' : 'rgba(248,250,252,0.97)';

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.fondo },
    background: { ...StyleSheet.absoluteFillObject, zIndex: -1, overflow: 'hidden' },

    iconButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
      alignItems: 'center',
      justifyContent: 'center',
      ...SOMBRAS.suave,
    },

    content: { padding: 16, paddingBottom: 110, gap: 16 },

    heroContainer: {
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...SOMBRAS.flotante,
    },
    heroCard: { padding: 20 },
    heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    heroPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: glassMini,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: RADIOS.completo,
      borderWidth: 1,
      borderColor: c.borde,
    },
    heroPillTexto: { fontSize: 10, fontWeight: '800', color: c.textoSuave, letterSpacing: 0.4 },
    badgeEstado: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIOS.completo, borderWidth: 1 },
    textoBadge: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },

    heroLabel: { color: c.textoSuave, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
    heroAmount: { color: c.texto, fontSize: 36, fontWeight: '900', marginTop: 4, letterSpacing: -0.8 },
    heroMeta: { color: c.textoSecundario, fontSize: 12, fontWeight: '600', marginTop: 4, lineHeight: 18 },

    divisorHero: { height: 1, backgroundColor: c.borde, marginVertical: 16 },

    heroGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
    metricItem: { flex: 1, alignItems: 'center' },
    metricLabel: { color: c.textoSuave, fontSize: 11, fontWeight: '700', marginBottom: 2 },
    metricValue: { color: c.texto, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
    divisorVerticalMetric: { width: 1, height: 28, backgroundColor: c.borde },

    cardContainer: {
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...SOMBRAS.suave,
    },
    breakdownCard: { padding: 18 },
    seccionHeaderBreakdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    sectionTitle: { color: c.texto, fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
    sectionSubtitle: { color: c.textoSuave, fontSize: 12, fontWeight: '600', marginTop: 1 },
    botonVerDetalleChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      backgroundColor: activeSurface,
      borderWidth: 1,
      borderColor: activeBorder,
    },
    textoVerDetalleChip: { fontSize: 11, fontWeight: '700', color: c.texto },

    lineasContainer: { gap: 2 },
    lineaItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 36,
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
    },
    lineaLabel: { color: c.textoSecundario, fontSize: 13, fontWeight: '600' },
    lineaValue: { color: '#EF4444', fontSize: 13, fontWeight: '700' },
    lineaValuePositive: { color: '#10B981' },

    totalCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: activeSurface,
      borderRadius: 16,
      padding: 14,
      marginTop: 14,
      borderWidth: 1,
      borderColor: activeBorder,
    },
    totalCardLabel: { color: c.texto, fontSize: 13, fontWeight: '800' },
    totalCardDate: { color: c.textoSuave, fontSize: 11, fontWeight: '600', marginTop: 2 },
    totalCardValue: { color: c.texto, fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },

    receiptButton: {
      minHeight: 48,
      marginTop: 14,
      borderRadius: 24,
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      ...SOMBRAS.suave,
    },
    receiptButtonModal: {
      minHeight: 50,
      marginTop: 8,
      marginBottom: 24,
      borderRadius: 25,
      backgroundColor: esOscuro ? '#FFFFFF' : '#0F172A',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      ...SOMBRAS.suave,
    },
    receiptButtonText: {
      color: esOscuro ? '#0B0C1E' : '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: -0.1,
    },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, marginBottom: -4 },
    badgeCount: {
      backgroundColor: glassMini,
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.borde,
    },
    textoBadgeCount: { fontSize: 11, fontWeight: '700', color: c.textoSuave },

    paymentCard: {
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.borde,
      backgroundColor: c.superficie,
      ...SOMBRAS.suave,
    },
    paymentContent: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
    paymentIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    paymentCopy: { flex: 1 },
    paymentTitle: { color: c.texto, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
    paymentMeta: { color: c.textoSuave, fontSize: 12, fontWeight: '600' },
    puntoSeparador: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: c.textoSuave },
    paymentEstadoTexto: { fontSize: 12, fontWeight: '700' },
    paymentActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    paymentAmount: { color: c.texto, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },

    flexModal: { flex: 1 },
    modalContenido: { backgroundColor: modalBg, height: '88%' },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 12,
    },
    tipoSolicitud: { fontSize: 10, fontWeight: '800', color: c.textoSuave, letterSpacing: 0.4 },
    modalTitulo: { fontSize: 20, fontWeight: '800', color: c.texto, letterSpacing: -0.4 },
    botonCerrarModal: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: glassMini,
      borderWidth: 1,
      borderColor: c.borde,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollModal: { paddingHorizontal: 20, paddingBottom: 30 },

    modalHeroNeto: {
      backgroundColor: activeSurface,
      borderRadius: 20,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: activeBorder,
    },
    modalHeroNetoLabel: { fontSize: 11, fontWeight: '700', color: c.textoSuave, textTransform: 'uppercase', letterSpacing: 0.4 },
    modalHeroNetoAmount: { fontSize: 32, fontWeight: '900', color: c.texto, marginTop: 4, letterSpacing: -0.6 },
    modalFechaPagoTexto: { fontSize: 12, fontWeight: '600', color: c.textoSuave },

    detalleSeccionCard: {
      backgroundColor: inputBg,
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.borde,
    },
    detalleLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: c.textoSuave,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },

    infoRowModal: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: c.borde,
    },
    infoRowKey: { fontSize: 12, fontWeight: '600', color: c.textoSuave },
    infoRowVal: { fontSize: 13, fontWeight: '700', color: c.texto, maxWidth: '60%', textAlign: 'right' },
  });
}
