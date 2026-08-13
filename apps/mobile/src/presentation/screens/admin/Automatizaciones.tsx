import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text as NativeText, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/presentation/hooks/useAuth';
import { useCases } from '@/infrastructure/container';
import { AutomationActionTarget, AutomationRule, AutomationTriggerType } from 'domain/entities/AutomationRule';
import { obtenerEmpresaIdAdmin } from './adminUtils';
import { ADMIN, useAdminAppearance } from './adminTheme';
import { useAdminToast } from './adminToast';

const Text = NativeText;

const TRIGGER_LABELS: Record<AutomationTriggerType, string> = {
  tarea_vencida: 'Tarea vencida',
  solicitud_pendiente_tiempo: 'Solicitud pendiente de tiempo',
  checkin_faltante: 'Check-in faltante',
};

const DESTINO_LABELS: Record<AutomationActionTarget, string> = {
  asignado: 'Al responsable',
  creador: 'A quien la creó',
  admins: 'A los administradores',
};

type Plantilla = {
  triggerTipo: AutomationTriggerType;
  nombre: string;
  descripcion: string;
  accionDestino: AutomationActionTarget;
  condiciones: Record<string, number>;
};

const PLANTILLAS: Plantilla[] = [
  {
    triggerTipo: 'tarea_vencida',
    nombre: 'Tarea vencida → avisar al responsable',
    descripcion: 'Publica en la Bandeja Unificada cuando una tarea supera su fecha límite sin completarse.',
    accionDestino: 'asignado',
    condiciones: {},
  },
  {
    triggerTipo: 'solicitud_pendiente_tiempo',
    nombre: 'Solicitud sin resolver por 48h → escalar a admins',
    descripcion: 'Avisa a los administradores cuando una solicitud de ausencia o interna lleva más de 48h pendiente.',
    accionDestino: 'admins',
    condiciones: { horasUmbral: 48 },
  },
  {
    triggerTipo: 'checkin_faltante',
    nombre: 'Sin check-in a las 10am → avisar a admins',
    descripcion: 'Detecta empleados activos que no han hecho check-in después de las 10:00 (UTC).',
    accionDestino: 'admins',
    condiciones: { horaLimite: 10 },
  },
];

export default function Automatizaciones() {
  const { user } = useAuth();
  const { theme } = useAdminAppearance();
  const toast = useAdminToast();
  const { width } = useWindowDimensions();
  const isPhone = width < 900;
  const empresaId = obtenerEmpresaIdAdmin(user);
  const styles = useMemo(() => crearEstilos(theme.isDark, width), [theme.isDark, width]);

  const [reglas, setReglas] = useState<AutomationRule[]>([]);
  const [cargando, setCargando] = useState(true);
  const [ejecutando, setEjecutando] = useState(false);
  const [formAbierto, setFormAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [trigger, setTrigger] = useState<AutomationTriggerType>('tarea_vencida');
  const [destino, setDestino] = useState<AutomationActionTarget>('admins');
  const [horasUmbral, setHorasUmbral] = useState('48');
  const [horaLimite, setHoraLimite] = useState('10');
  const [guardando, setGuardando] = useState(false);

  const cargarReglas = async () => {
    if (!empresaId) return;
    setCargando(true);
    try {
      setReglas(await useCases.automations.getByCompany.execute(empresaId));
    } catch (error: any) {
      toast.error({ title: 'No se pudieron cargar las reglas', description: error?.message || 'Intenta nuevamente.' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReglas().catch(() => {});
  }, [empresaId]);

  const tiposExistentes = useMemo(() => new Set(reglas.map((r) => r.triggerTipo)), [reglas]);

  const crearRegla = async (input: {
    nombre: string; descripcion?: string; triggerTipo: AutomationTriggerType;
    accionDestino: AutomationActionTarget; condiciones: Record<string, number>;
  }) => {
    if (!empresaId || !user) return;
    setGuardando(true);
    try {
      await useCases.automations.create.execute({
        empresaId,
        nombre: input.nombre,
        descripcion: input.descripcion,
        triggerTipo: input.triggerTipo,
        condiciones: input.condiciones,
        accionDestino: input.accionDestino,
        activa: true,
        creadoPor: user.id,
      });
      toast.success({ title: 'Regla creada', description: 'Ejecuta "Evaluar ahora" para aplicarla sobre datos reales.' });
      setFormAbierto(false);
      setNombre('');
      cargarReglas().catch(() => {});
    } catch (error: any) {
      toast.error({ title: 'No se pudo crear la regla', description: error?.message || 'Intenta nuevamente.' });
    } finally {
      setGuardando(false);
    }
  };

  const crearDesdePlantilla = (plantilla: Plantilla) => crearRegla({
    nombre: plantilla.nombre,
    descripcion: plantilla.descripcion,
    triggerTipo: plantilla.triggerTipo,
    accionDestino: plantilla.accionDestino,
    condiciones: plantilla.condiciones,
  });

  const crearPersonalizada = () => {
    if (!nombre.trim()) {
      toast.warning({ title: 'Falta el nombre', description: 'Dale un nombre a la regla antes de guardarla.' });
      return;
    }
    const condiciones: Record<string, number> = {};
    if (trigger === 'solicitud_pendiente_tiempo') condiciones.horasUmbral = Number(horasUmbral) || 48;
    if (trigger === 'checkin_faltante') condiciones.horaLimite = Number(horaLimite) || 10;
    crearRegla({ nombre: nombre.trim(), triggerTipo: trigger, accionDestino: destino, condiciones });
  };

  const alternarActiva = async (regla: AutomationRule) => {
    try {
      await useCases.automations.setActive.execute(regla.id, !regla.activa);
      setReglas((prev) => prev.map((r) => (r.id === regla.id ? { ...r, activa: !r.activa } : r)));
    } catch (error: any) {
      toast.error({ title: 'No se pudo actualizar', description: error?.message || 'Intenta nuevamente.' });
    }
  };

  const eliminarRegla = async (regla: AutomationRule) => {
    try {
      await useCases.automations.remove.execute(regla.id);
      setReglas((prev) => prev.filter((r) => r.id !== regla.id));
      toast.success({ title: 'Regla eliminada' });
    } catch (error: any) {
      toast.error({ title: 'No se pudo eliminar', description: error?.message || 'Intenta nuevamente.' });
    }
  };

  const ejecutarAhora = async () => {
    if (!empresaId) return;
    setEjecutando(true);
    try {
      const resultados = await useCases.automations.runNow.execute(empresaId);
      const totalEjecutadas = resultados.reduce((acc, r) => acc + r.ejecutadas, 0);
      const detalle = resultados.length
        ? resultados.map((r) => `${r.nombre}: ${r.ejecutadas}/${r.evaluadas}`).join(' · ')
        : 'No hay reglas activas.';
      toast.success({ title: `${totalEjecutadas} notificaciones publicadas`, description: detalle });
    } catch (error: any) {
      toast.error({ title: 'No se pudo evaluar', description: error?.message || 'Intenta nuevamente.' });
    } finally {
      setEjecutando(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Automatizaciones</Text>
          <Text style={styles.subtitle}>Reglas SI/ENTONCES que publican avisos reales en la Bandeja Unificada.</Text>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={ejecutarAhora} disabled={ejecutando || !reglas.some((r) => r.activa)}>
          {ejecutando ? <ActivityIndicator color="#fff" /> : <MaterialIcons name="bolt" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />}
          <Text style={styles.primaryButtonText}>{ejecutando ? 'Evaluando…' : 'Evaluar ahora'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Plantillas rápidas</Text>
        <Text style={styles.muted}>Crea una de las 3 reglas de ejemplo con un toque; luego ajústala si hace falta.</Text>
        <View style={styles.plantillasGrid}>
          {PLANTILLAS.map((plantilla) => {
            const yaExiste = tiposExistentes.has(plantilla.triggerTipo);
            return (
              <TouchableOpacity
                key={plantilla.triggerTipo}
                style={[styles.plantillaCard, yaExiste && styles.plantillaCardDisabled]}
                disabled={yaExiste || guardando}
                onPress={() => crearDesdePlantilla(plantilla)}
              >
                <MaterialIcons name={yaExiste ? 'check-circle' : 'add-circle-outline'} size={20} color={yaExiste ? ADMIN.exito : ADMIN.iconos.tareas} />
                <Text style={styles.plantillaNombre}>{plantilla.nombre}</Text>
                <Text style={styles.plantillaDesc}>{plantilla.descripcion}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Regla personalizada</Text>
          <TouchableOpacity onPress={() => setFormAbierto((v) => !v)}>
            <MaterialIcons name={formAbierto ? 'expand-less' : 'expand-more'} size={22} color={theme.text} />
          </TouchableOpacity>
        </View>
        {formAbierto && (
          <View style={{ gap: 12 }}>
            <TextInput
              style={styles.input}
              placeholder="Nombre de la regla"
              placeholderTextColor={ADMIN.textoSuave}
              value={nombre}
              onChangeText={setNombre}
            />
            <Text style={styles.fieldLabel}>SI (disparador)</Text>
            <View style={styles.chipsRow}>
              {(Object.keys(TRIGGER_LABELS) as AutomationTriggerType[]).map((tipo) => (
                <TouchableOpacity key={tipo} style={[styles.chip, trigger === tipo && styles.chipActivo]} onPress={() => setTrigger(tipo)}>
                  <Text style={[styles.chipText, trigger === tipo && styles.chipTextActivo]}>{TRIGGER_LABELS[tipo]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {trigger === 'solicitud_pendiente_tiempo' && (
              <>
                <Text style={styles.fieldLabel}>Horas pendiente antes de avisar</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={horasUmbral} onChangeText={setHorasUmbral} />
              </>
            )}
            {trigger === 'checkin_faltante' && (
              <>
                <Text style={styles.fieldLabel}>Hora límite (0-23, UTC)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={horaLimite} onChangeText={setHoraLimite} />
              </>
            )}
            <Text style={styles.fieldLabel}>ENTONCES notificar</Text>
            <View style={styles.chipsRow}>
              {(Object.keys(DESTINO_LABELS) as AutomationActionTarget[]).map((tipo) => (
                <TouchableOpacity key={tipo} style={[styles.chip, destino === tipo && styles.chipActivo]} onPress={() => setDestino(tipo)}>
                  <Text style={[styles.chipText, destino === tipo && styles.chipTextActivo]}>{DESTINO_LABELS[tipo]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={crearPersonalizada} disabled={guardando}>
              {guardando ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Crear regla</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Reglas de la empresa</Text>
          <Text style={styles.muted}>{reglas.length}</Text>
        </View>
        {cargando ? (
          <ActivityIndicator color={ADMIN.primario} />
        ) : reglas.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialIcons name="rule" size={30} color={ADMIN.textoSecundario} />
            <Text style={styles.emptyText}>Sin reglas todavía. Usa una plantilla arriba.</Text>
          </View>
        ) : reglas.map((regla) => (
          <View key={regla.id} style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{regla.nombre}</Text>
              <Text style={styles.muted}>{TRIGGER_LABELS[regla.triggerTipo]} · {DESTINO_LABELS[regla.accionDestino]}</Text>
            </View>
            <TouchableOpacity style={[styles.badge, regla.activa ? styles.badgeActiva : styles.badgeInactiva]} onPress={() => alternarActiva(regla)}>
              <Text style={styles.badgeText}>{regla.activa ? 'Activa' : 'Inactiva'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButtonDanger} onPress={() => eliminarRegla(regla)}>
              <MaterialIcons name="delete-outline" size={18} color={ADMIN.error} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const crearEstilos = (isDark: boolean, width: number) => {
  const isPhone = width < 900;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: ADMIN.fondo },
    content: { padding: isPhone ? 12 : 24, paddingTop: isPhone ? 90 : 260, paddingBottom: 64, gap: isPhone ? 14 : 18 },
    header: { flexDirection: isPhone ? 'column' : 'row', alignItems: isPhone ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 14 },
    title: { color: ADMIN.texto, fontSize: isPhone ? 24 : 28, fontWeight: '900' },
    subtitle: { color: ADMIN.textoSecundario, fontSize: isPhone ? 12 : 14, fontWeight: '700', marginTop: 6, maxWidth: 520 },
    primaryButton: { minHeight: 44, paddingHorizontal: 18, borderRadius: 14, backgroundColor: '#6320A6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 13 },
    panel: { borderRadius: 20, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: ADMIN.fondoElevado, padding: isPhone ? 14 : 20, gap: 12 },
    panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    panelTitle: { color: ADMIN.texto, fontSize: 17, fontWeight: '900' },
    muted: { color: ADMIN.textoSecundario, fontSize: 13, fontWeight: '700', lineHeight: 19 },
    plantillasGrid: { flexDirection: isPhone ? 'column' : 'row', gap: 12 },
    plantillaCard: { flex: 1, borderRadius: 14, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: ADMIN.fondoCampo, padding: 14, gap: 6 },
    plantillaCardDisabled: { opacity: 0.55 },
    plantillaNombre: { color: ADMIN.texto, fontSize: 13, fontWeight: '900' },
    plantillaDesc: { color: ADMIN.textoSecundario, fontSize: 12, fontWeight: '600', lineHeight: 17 },
    input: { minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: ADMIN.fondoCampo, paddingHorizontal: 14, color: ADMIN.texto, fontWeight: '700' },
    fieldLabel: { color: ADMIN.textoSecundario, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.6 },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: ADMIN.fondoCampo },
    chipActivo: { backgroundColor: ADMIN.primario, borderColor: ADMIN.primario },
    chipText: { color: ADMIN.textoSecundario, fontSize: 12, fontWeight: '800' },
    chipTextActivo: { color: '#fff' },
    row: { minHeight: 60, flexDirection: isPhone ? 'column' : 'row', alignItems: isPhone ? 'stretch' : 'center', gap: 12, borderTopWidth: 1, borderTopColor: ADMIN.bordeSuave, paddingVertical: 12 },
    rowBody: { flex: 1, minWidth: 0 },
    rowTitle: { color: ADMIN.texto, fontSize: 14, fontWeight: '900' },
    badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
    badgeActiva: { backgroundColor: 'rgba(34,197,94,0.14)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
    badgeInactiva: { backgroundColor: 'rgba(148,163,184,0.14)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.3)' },
    badgeText: { color: ADMIN.texto, fontSize: 11, fontWeight: '900' },
    iconButtonDanger: { width: isPhone ? '100%' : 38, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.10)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' },
    emptyBox: { minHeight: 110, borderRadius: 14, borderWidth: 1, borderColor: ADMIN.borde, backgroundColor: ADMIN.fondoCampo, alignItems: 'center', justifyContent: 'center', gap: 10 },
    emptyText: { color: ADMIN.textoSecundario, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  });
};
