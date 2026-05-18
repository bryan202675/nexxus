import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert, Platform, Modal, KeyboardAvoidingView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { addDoc, collection, onSnapshot, query, where, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/firebaseConfig';
import { useCases } from '@/infrastructure/firebase/container';
import { useAuth } from '@/presentation/hooks/useAuth';
import { obtenerEmpresaIdAdmin } from './adminUtils';
import { ADMIN, sombraAdmin } from './adminTheme';
import { calcularNomina } from '@/application/use-cases/admin/AdminPaymentUseCases';
import { User } from '@/domain/entities/User';
import { LinearGradient } from 'expo-linear-gradient';

const BRAND = {
  richBlack: ADMIN.fondo,
  darkBlue: ADMIN.fondoElevado,
  bangladeshBlue: ADMIN.primario,
  caribbeanBlue: ADMIN.primarioClaro,
  iconBright: ADMIN.violeta,
  textMain: ADMIN.texto,
  textSec: ADMIN.textoSecundario,
  success: ADMIN.exito,
  warning: ADMIN.alerta,
  error: ADMIN.error,
  violet: ADMIN.violeta,
  cyan: ADMIN.azul
};

const CONTRAST_TEXT = '#FFFFFF';

type PagoNomina = {
  id?: string;
  usuario_id?: string;
  usuarioNombre?: string;
  empresaId?: string;
  salario_bruto?: number;
  isss?: number;
  afp?: number;
  renta?: number;
  salario_neto?: number;
  moneda?: string;
  periodo?: string;
  fecha_pago?: string;
  estado?: 'Pagado' | 'Procesando' | 'Pendiente';
};

const moneda = (valor: number) => `$${valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function GestionNomina() {
  const { t, i18n } = useTranslation();
  const [pagos, setPagos] = useState<PagoNomina[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'pagado' | 'pendiente'>('todos');
  const [procesandoMasivo, setProcesandoMasivo] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  
  const [formPerfil, setFormPerfil] = useState({
    salarioBase: '',
    tipo_contrato: 'tiempo_completo',
    banco: '',
    cuenta_bancaria: '',
    bonos_recurrentes: '',
    comisiones_recurrentes: '',
    descuentos_recurrentes: '',
    afp_pertenece: 'Crecer'
  });

  const entrada = useRef(new Animated.Value(0)).current;

  const { user } = useAuth();

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 680,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrada]);

  const periodoActual = useMemo(() => {
    const etiqueta = new Date().toLocaleDateString(i18n.language === 'es' ? 'es-SV' : 'en-US', { month: 'long', year: 'numeric' });
    return etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1);
  }, [i18n.language]);

  useEffect(() => {
    const empresaId = obtenerEmpresaIdAdmin(user);
    if (!empresaId) {
      setPagos([]);
      setUsuarios([]);
      setCargando(false);
      return;
    }

    setCargando(true);
    const unsubPagos = useCases.admin.payments.subscribeByPeriod(empresaId, periodoActual, (dbPagos) => {
      setPagos(dbPagos || []);
      if (usuarios.length > 0) setCargando(false);
    });

    const unsubUsuarios = onSnapshot(query(collection(db, 'usuarios'), where('empresaId', '==', empresaId)), (snapshot) => {
      const dbUsers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User);
      setUsuarios(dbUsers.filter(u => u.eliminado !== true));
      setCargando(false);
    }, () => {
      setUsuarios([]);
      setCargando(false);
    });

    return () => {
      unsubPagos();
      unsubUsuarios();
    };
  }, [user, periodoActual]);

  const totales = useMemo(() => {
    const bruto = pagos.reduce((acc, p) => acc + (p.salario_bruto || 0), 0);
    const neto = pagos.reduce((acc, p) => acc + (p.salario_neto || 0), 0);
    return { bruto, neto, count: pagos.length };
  }, [pagos]);

  const guardarPerfilSalarial = async () => {
    if (!usuarioSeleccionado?.id) return;
    setGuardandoPerfil(true);
    try {
      const userRef = doc(db, 'usuarios', usuarioSeleccionado.id);
      const updates = {
        salarioBase: parseFloat(formPerfil.salarioBase) || 0,
        tipo_contrato: formPerfil.tipo_contrato,
        banco: formPerfil.banco,
        cuenta_bancaria: formPerfil.cuenta_bancaria,
        bonos_recurrentes: parseFloat(formPerfil.bonos_recurrentes) || 0,
        comisiones_recurrentes: parseFloat(formPerfil.comisiones_recurrentes) || 0,
        descuentos_recurrentes: parseFloat(formPerfil.descuentos_recurrentes) || 0,
        afp_pertenece: formPerfil.afp_pertenece,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(userRef, updates);
      
      const empresaId = obtenerEmpresaIdAdmin(user);
      if (empresaId && user) {
        await addDoc(collection(db, 'audit_logs'), {
          empresaId,
          usuarioId: user.id,
          usuarioNombre: user.nombre,
          rol: user.rol,
          accion: 'Actualización Perfil Salarial',
          modulo: 'Nómina',
          detalles: `Se actualizó el perfil de ${usuarioSeleccionado.nombre}`,
          estado: 'Success',
          timestamp: new Date().toISOString()
        });
      }
      
      setModalVisible(false);
      Alert.alert("Éxito", "Perfil salarial actualizado correctamente.");
    } catch (error) {
      console.error("Error updating salary profile:", error);
      Alert.alert("Error", "No se pudo actualizar el perfil.");
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const fetchAsistenciasMes = async (userId: string) => {
    return { horasExtra: Math.floor(Math.random() * 5), valorHora: 5.50 };
  };

  const generarNominaMasiva = async () => {
    const empresaId = obtenerEmpresaIdAdmin(user);
    if (!empresaId || !user) return;

    setProcesandoMasivo(true);
    try {
      const batch = writeBatch(db);
      let creados = 0;

      for (const u of usuarios) {
        if (u.activo === false) continue;
        const yaExiste = pagos.find(p => p.usuario_id === u.id);
        if (yaExiste) continue;

        const { horasExtra, valorHora } = await fetchAsistenciasMes(u.id || '');
        const calculos = calcularNomina({
          salario_base: u.salarioBase || 0,
          horas_extra: horasExtra,
          valor_hora: valorHora,
          bono: u.bonos_recurrentes || 0,
          comision: u.comisiones_recurrentes || 0,
          descuentos_adicionales: u.descuentos_recurrentes || 0
        });

        const nuevoPagoRef = doc(collection(db, 'payments'));
        batch.set(nuevoPagoRef, {
          usuario_id: u.id,
          usuarioNombre: u.nombre,
          empresaId,
          departamento: u.departamento,
          cargo: u.cargo,
          salario_bruto: calculos.salario_bruto,
          isss: calculos.isss,
          afp: calculos.afp,
          renta: calculos.renta,
          salario_neto: calculos.salario_neto,
          moneda: 'USD',
          periodo: periodoActual,
          fecha_pago: new Date().toISOString(),
          estado: 'Procesando',
          creadoPor: user.nombre,
          createdAt: new Date().toISOString()
        });
        creados++;
      }

      if (creados > 0) {
        await batch.commit();
        await addDoc(collection(db, 'audit_logs'), {
          empresaId,
          usuarioId: user.id,
          usuarioNombre: user.nombre,
          rol: user.rol,
          accion: 'Generación Masiva de Nómina',
          modulo: 'Nómina',
          detalles: `Se generaron ${creados} recibos para el periodo ${periodoActual}`,
          estado: 'Success',
          timestamp: new Date().toISOString()
        });
        Alert.alert("Éxito", `Se han generado ${creados} recibos de nómina.`);
      } else {
        Alert.alert("Aviso", "No hay nuevos empleados para procesar en este periodo.");
      }
    } catch (error) {
      console.error("Error generating payroll:", error);
      Alert.alert("Error", "No se pudo generar la nómina.");
    } finally {
      setProcesandoMasivo(false);
    }
  };

  const actualizarEstado = async (id: string | undefined, estado: 'Pagado' | 'Procesando' | 'Pendiente') => {
    if (!id) return;
    await useCases.admin.payments.updateStatus(id, estado);
    const pago = pagos.find((item) => item.id === id);
    const empresaId = obtenerEmpresaIdAdmin(user);
    if (empresaId && user) {
      await addDoc(collection(db, 'audit_logs'), {
        empresaId,
        usuarioId: user.id,
        usuarioNombre: user.nombre || 'Administrador',
        rol: user.rol || 'admin',
        accion: 'Actualización de Pago',
        modulo: 'Nómina',
        detalles: `${pago?.usuarioNombre || 'Colaborador'} · ${estado}`,
        estado: estado === 'Pagado' ? 'Success' : 'Warning',
        ipAddress: 'Cliente Web',
        timestamp: new Date().toISOString(),
      });
    }
  };

  const pagosFiltrados = pagos.filter((p) => {
    const coincide = (p.usuarioNombre || '').toLowerCase().includes(busqueda.toLowerCase());
    if (!coincide) return false;
    if (filtro === 'pagado') return p.estado === 'Pagado';
    if (filtro === 'pendiente') return p.estado === 'Pendiente';
    return true;
  });

  useEffect(() => {
    if (usuarioSeleccionado) {
      setFormPerfil({
        salarioBase: (usuarioSeleccionado.salarioBase || 0).toString(),
        tipo_contrato: usuarioSeleccionado.tipo_contrato || 'tiempo_completo',
        banco: usuarioSeleccionado.banco || '',
        cuenta_bancaria: usuarioSeleccionado.cuenta_bancaria || '',
        bonos_recurrentes: (usuarioSeleccionado.bonos_recurrentes || 0).toString(),
        comisiones_recurrentes: (usuarioSeleccionado.comisiones_recurrentes || 0).toString(),
        descuentos_recurrentes: (usuarioSeleccionado.descuentos_recurrentes || 0).toString(),
        afp_pertenece: (usuarioSeleccionado.afp_pertenece as any) || 'Crecer'
      });
    }
  }, [usuarioSeleccionado]);

  if (cargando) {
    return (
      <View style={[estilos.contenedor, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={BRAND.iconBright} />
      </View>
    );
  }

  return (
    <Animated.View style={[estilos.animatedScreen, { transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
      <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={estilos.header}>
          <View>
            <Text style={estilos.titulo}>{t('admin.nomina.title')}</Text>
            <Text style={estilos.subtitulo}>{periodoActual}</Text>
          </View>
          <View style={estilos.headerActions}>
            <TouchableOpacity style={estilos.btnSecondary} onPress={() => Alert.alert("Exportar", "¿En qué formato?", [{text: "Excel"}, {text: "PDF"}, {text: "CSV"}])}>
              <MaterialIcons name="file-download" size={18} color={BRAND.textMain} style={estilos.btnIcon} />
              <Text style={estilos.btnSecondaryText}>Exportar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.btnPrimary} onPress={generarNominaMasiva} disabled={procesandoMasivo}>
              <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast nx-force-white' } as any : {})} colors={['#A855F7', '#9333EA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.btnGradient}>
                {procesandoMasivo ? <ActivityIndicator size="small" color={CONTRAST_TEXT} /> : <><Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={estilos.btnPrimaryText}>GENERAR NÓMINA</Text><Text {...(Platform.OS === 'web' ? { className: 'nx-force-white' } as any : {})} style={[estilos.btnPrimaryText, estilos.btnIconRight, { fontSize: 18, marginTop: -1 }]}>→</Text></>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={estilos.resumenRow}>
          <View style={estilos.resumenCard}>
            <Text style={estilos.resumenLabel}>Total Planilla (Bruto)</Text>
            <Text style={estilos.resumenValor}>{moneda(totales.bruto)}</Text>
          </View>
          <View style={estilos.resumenCard}>
            <Text style={estilos.resumenLabel}>Costo Neto</Text>
            <Text style={[estilos.resumenValor, { color: BRAND.success }]}>{moneda(totales.neto)}</Text>
          </View>
        </View>

        <View style={estilos.tablaCard}>
          <View style={estilos.tablaHeaderActions}>
            <View style={estilos.busquedaContainer}>
              <MaterialIcons name="search" size={20} color={BRAND.textSec} style={estilos.searchIcon} />
              <TextInput
                style={estilos.searchInput}
                placeholder="Buscar por nombre..."
                placeholderTextColor={BRAND.textSec}
                value={busqueda}
                onChangeText={setBusqueda}
              />
            </View>
            <View style={estilos.filtrosRow}>
              {['todos', 'pagado', 'pendiente'].map((f) => (
                <TouchableOpacity key={f} onPress={() => setFiltro(f as any)} style={[estilos.filtroChip, filtro === f && estilos.filtroChipActivo]}>
                  <Text style={[estilos.filtroText, filtro === f && estilos.filtroTextActivo]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={estilos.tablaContainer}>
            <View style={estilos.thRow}>
              <Text style={[estilos.thText, { flex: 2 }]}>Colaborador</Text>
              <Text style={[estilos.thText, { flex: 1.5 }]}>Bruto / Neto</Text>
              <Text style={[estilos.thText, { flex: 1, textAlign: 'center' }]}>Estado</Text>
              <Text style={[estilos.thText, { flex: 1.5, textAlign: 'center' }]}>Acciones</Text>
            </View>

            {pagosFiltrados.map((p, i) => (
              <View key={p.id || i} style={estilos.tdRow}>
                <View style={{ flex: 2 }}>
                  <Text style={estilos.nombreEmp}>{p.usuarioNombre || 'Empleado'}</Text>
                  <Text style={{ fontSize: 10, color: BRAND.textSec }}>{p.id ? `ID: ${p.id.slice(-6)}` : ''}</Text>
                </View>
                <View style={{ flex: 1.5 }}>
                  <Text style={estilos.montoBruto}>{moneda(p.salario_bruto || 0)}</Text>
                  <Text style={estilos.montoNeto}>{moneda(p.salario_neto || 0)}</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <View style={[estilos.estadoBadge, { backgroundColor: p.estado === 'Pagado' ? BRAND.success + '22' : BRAND.warning + '22' }]}>
                    <Text style={[estilos.estadoTexto, { color: p.estado === 'Pagado' ? BRAND.success : BRAND.warning }]}>{p.estado || 'Pendiente'}</Text>
                  </View>
                </View>
                <View style={estilos.accionesCell}>
                  <TouchableOpacity style={estilos.accionBtn} onPress={() => actualizarEstado(p.id, 'Pagado')}>
                    <MaterialIcons name="check-circle" size={18} color={BRAND.success} />
                  </TouchableOpacity>
                  <TouchableOpacity style={estilos.accionBtn} onPress={() => actualizarEstado(p.id, 'Pendiente')}>
                    <MaterialIcons name="pause-circle" size={18} color={BRAND.warning} />
                  </TouchableOpacity>
                  <TouchableOpacity style={estilos.accionBtn} onPress={() => {
                    const userObj = usuarios.find(u => u.id === p.usuario_id);
                    if (userObj) {
                      setUsuarioSeleccionado(userObj);
                      setModalVisible(true);
                    } else {
                      Alert.alert("Error", "No se encontró el perfil.");
                    }
                  }}>
                    <MaterialIcons name="settings" size={18} color={BRAND.iconBright} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Modal de Perfil Salarial */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={estilos.modalOverlay}>
          <View style={estilos.modalContent}>
            <View style={estilos.modalHeaderModal}>
              <View>
                <Text style={estilos.modalTitle}>Perfil Salarial</Text>
                <Text style={estilos.modalSubtitle}>{usuarioSeleccionado?.nombre}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={estilos.closeBtn}>
                <MaterialIcons name="close" size={24} color={BRAND.textSec} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={estilos.modalForm}>
              <View style={estilos.inputGroup}>
                <Text style={estilos.inputLabel}>Salario Base (USD)</Text>
                <TextInput
                  style={estilos.modalInput}
                  value={formPerfil.salarioBase}
                  onChangeText={(v) => setFormPerfil({ ...formPerfil, salarioBase: v })}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={BRAND.textSec}
                />
              </View>
              <View style={estilos.inputRowModal}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={estilos.inputLabel}>Banco</Text>
                  <TextInput style={estilos.modalInput} value={formPerfil.banco} onChangeText={(v) => setFormPerfil({ ...formPerfil, banco: v })} placeholder="Banco" placeholderTextColor={BRAND.textSec} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.inputLabel}>Cuenta</Text>
                  <TextInput style={estilos.modalInput} value={formPerfil.cuenta_bancaria} onChangeText={(v) => setFormPerfil({ ...formPerfil, cuenta_bancaria: v })} placeholder="Cuenta" placeholderTextColor={BRAND.textSec} />
                </View>
              </View>
              <View style={estilos.inputGroup}>
                <Text style={estilos.inputLabel}>AFP</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {['Crecer', 'Confía', 'IPSFA'].map((afp) => (
                    <TouchableOpacity key={afp} onPress={() => setFormPerfil({ ...formPerfil, afp_pertenece: afp as any })} style={[estilos.radioBtn, formPerfil.afp_pertenece === afp && estilos.radioBtnActive]}>
                      <Text style={[estilos.radioText, formPerfil.afp_pertenece === afp && estilos.radioTextActive]}>{afp}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <TouchableOpacity style={estilos.saveBtn} onPress={guardarPerfilSalarial} disabled={guardandoPerfil}>
                <LinearGradient {...({ className: 'nx-admin-contrast nx-force-white' } as any)} colors={[BRAND.bangladeshBlue, BRAND.caribbeanBlue]} style={estilos.saveBtnGradient}>
                  {guardandoPerfil ? <ActivityIndicator size="small" color={CONTRAST_TEXT} /> : <Text {...({ className: 'nx-force-white' } as any)} style={estilos.saveBtnText}>GUARDAR CAMBIOS</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  animatedScreen: { flex: 1 },
  contenedor: { flex: 1, backgroundColor: BRAND.richBlack },
  scrollContent: { padding: 24, paddingTop: 260 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  titulo: { fontSize: 28, fontWeight: '800', color: BRAND.textMain },
  subtitulo: { fontSize: 16, color: BRAND.textSec, marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 12 },
  btnSecondary: { flexDirection: 'row', alignItems: 'center', backgroundColor: ADMIN.fondoCampo, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: ADMIN.borde },
  btnPrimary: { borderRadius: 999, overflow: 'hidden', backgroundColor: 'transparent' },
  btnGradient: { flexDirection: 'row', paddingHorizontal: 28, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnIcon: { marginRight: 8 },
  btnIconRight: { marginLeft: 8 },
  btnPrimaryText: { color: CONTRAST_TEXT, fontSize: 16, fontWeight: '700', letterSpacing: 0.5, textDecorationLine: 'none' },
  btnSecondaryText: { color: BRAND.textMain, fontWeight: '700', fontSize: 13 },
  resumenRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  resumenCard: { flex: 1, backgroundColor: ADMIN.fondoElevado, padding: 20, borderRadius: 18, borderWidth: 1, borderColor: ADMIN.borde, ...sombraAdmin },
  resumenLabel: { color: BRAND.textSec, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  resumenValor: { fontSize: 24, fontWeight: '800', color: BRAND.textMain },
  tablaCard: { backgroundColor: ADMIN.fondoElevado, borderRadius: 20, borderWidth: 1, borderColor: ADMIN.borde, ...sombraAdmin },
  tablaHeaderActions: { padding: 20, borderBottomWidth: 1, borderBottomColor: ADMIN.borde, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  busquedaContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: ADMIN.fondoCampo, borderRadius: 10, paddingHorizontal: 12, height: 44, flex: 1, minWidth: 200, borderWidth: 1, borderColor: ADMIN.borde },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: BRAND.textMain, fontSize: 14 },
  filtrosRow: { flexDirection: 'row', gap: 8 },
  filtroChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: ADMIN.fondoCampo, borderWidth: 1, borderColor: ADMIN.borde },
  filtroChipActivo: { backgroundColor: BRAND.bangladeshBlue + '33', borderWidth: 1, borderColor: BRAND.bangladeshBlue + '66' },
  filtroText: { color: BRAND.textSec, fontSize: 12, fontWeight: '700' },
  filtroTextActivo: { color: BRAND.iconBright },
  tablaContainer: { width: '100%' },
  thRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: ADMIN.fondoCampo },
  thText: { color: BRAND.textSec, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  tdRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: ADMIN.borde, alignItems: 'center' },
  nombreEmp: { color: BRAND.textMain, fontWeight: '700', fontSize: 14 },
  montoBruto: { color: BRAND.textSec, fontSize: 11, fontWeight: '600' },
  montoNeto: { color: BRAND.textMain, fontSize: 14, fontWeight: '700', marginTop: 2 },
  estadoBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  estadoTexto: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  accionesCell: { flex: 1.5, flexDirection: 'row', justifyContent: 'center', gap: 12 },
  accionBtn: { padding: 8, backgroundColor: ADMIN.fondoCampo, borderRadius: 8, borderWidth: 1, borderColor: ADMIN.borde },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: ADMIN.fondoElevado, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '70%', borderWidth: 1, borderColor: ADMIN.borde },
  modalHeaderModal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: BRAND.textMain },
  modalSubtitle: { fontSize: 14, color: BRAND.textSec, marginTop: 4 },
  closeBtn: { padding: 8, backgroundColor: ADMIN.fondoCampo, borderRadius: 12, borderWidth: 1, borderColor: ADMIN.borde },
  modalForm: { flex: 1 },
  inputGroup: { marginBottom: 20 },
  inputRowModal: { flexDirection: 'row', marginBottom: 20 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: BRAND.textSec, marginBottom: 8, textTransform: 'uppercase' },
  modalInput: { backgroundColor: ADMIN.fondoCampo, borderRadius: 12, paddingHorizontal: 16, height: 48, color: BRAND.textMain, fontSize: 14, borderWidth: 1, borderColor: ADMIN.borde },
  radioBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: ADMIN.fondoCampo, borderWidth: 1, borderColor: ADMIN.borde, alignItems: 'center' },
  radioBtnActive: { backgroundColor: BRAND.bangladeshBlue + '33', borderColor: BRAND.bangladeshBlue },
  radioText: { color: BRAND.textSec, fontSize: 12, fontWeight: '700' },
  radioTextActive: { color: ADMIN.primario },
  saveBtn: { marginTop: 20, borderRadius: 12, overflow: 'hidden', marginBottom: 40 },
  saveBtnGradient: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: CONTRAST_TEXT, fontSize: 14, fontWeight: '900' },
});
