/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/superadmin/SaAuditoria.tsx
 * Capa: presentacion.
 * Proposito: Auditoría global — todos los eventos auditados de todas las empresas, sin excepción.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import { AuditResumen } from 'domain/entities/SuperAdmin';
import { useCases } from '@/infrastructure/container';
import { formatoFechaHora } from './saFormat';
import {
  useSaTheme, useSaEntrance,
  SaSectionCard, SaTableHeader, SaTableRow, SaCell, SaStatusIndicator, SaFilterPill, SaBadgeTone,
} from './components/SaWidgets';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;

type LoadState = 'loading' | 'ready' | 'empty' | 'error';
type FiltroEstado = 'todos' | 'success' | 'warning' | 'error';

const estadoTone = (estado: string): SaBadgeTone => {
  const value = estado.toLowerCase();
  if (value === 'error') return 'danger';
  if (value === 'warning') return 'warning';
  return 'positive';
};

export default function SaAuditoria() {
  const { t } = useTranslation();
  const { theme } = useSaTheme();
  const { width } = useWindowDimensions();
  const compact = width < 900;
  useSaEntrance();

  const [state, setState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [logs, setLogs] = useState<AuditResumen[]>([]);
  const [hayMas, setHayMas] = useState(false);
  const [cursor, setCursor] = useState<unknown>(null);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');

  useEffect(() => {
    const unsubscribe = useCases.admin.superAdmin.subscribeAuditGlobal(80, (result) => {
      setLogs(result.items);
      setCursor(result.cursor);
      setHayMas(result.hayMas);
      setState(result.items.length > 0 ? 'ready' : 'empty');
    }, (error) => {
      setErrorMessage(error.message || t('superadmin.saAuditoria.error.cargaAuditoria'));
      setState('error');
    });
    return () => unsubscribe();
  }, []);

  const logsFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    return logs.filter((log) => {
      if (filtroEstado !== 'todos' && log.estado.toLowerCase() !== filtroEstado) return false;
      if (!term) return true;
      return `${log.accion} ${log.modulo} ${log.empresaNombre || ''} ${log.actorNombre || ''} ${log.detalles || ''}`.toLowerCase().includes(term);
    });
  }, [logs, busqueda, filtroEstado]);

  const cargarMas = async () => {
    if (!hayMas || cargandoMas) return;
    setCargandoMas(true);
    try {
      const result = await useCases.admin.superAdmin.loadMoreAuditGlobal(80, cursor);
      setLogs((prev) => [...prev, ...result.items]);
      setCursor(result.cursor);
      setHayMas(result.hayMas);
    } catch (error: any) {
      setErrorMessage(error.message || t('superadmin.saAuditoria.error.cargaMasEventos'));
    } finally {
      setCargandoMas(false);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View>
        {errorMessage ? (
          <View>
            <MaterialIcons name="error-outline" size={20} />
            <Text>{errorMessage}</Text>
          </View>
        ) : null}

        <View>
          <MaterialIcons name="search" size={20} />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar por acción, módulo, empresa o actor"
          />
        </View>

        <SaSectionCard theme={theme} title={t('superadmin.saAuditoria.seccion.registroAuditoria')}>
          <View>
            {(['todos', 'success', 'warning', 'error'] as FiltroEstado[]).map((item) => (
              <SaFilterPill
                key={item}
                theme={theme}
                active={filtroEstado === item}
                onPress={() => setFiltroEstado(item)}
                label={item === 'todos' ? t('superadmin.saAuditoria.filtros.todos') : item === 'success' ? t('superadmin.saAuditoria.filtros.exito') : item === 'warning' ? t('superadmin.saAuditoria.filtros.advertencia') : t('superadmin.saAuditoria.filtros.error')}
              />
            ))}
          </View>

          {!compact && logsFiltrados.length > 0 ? (
            <SaTableHeader theme={theme} columns={[{ label: t('superadmin.saAuditoria.tabla.evento'), flex: 2 }, { label: t('superadmin.saAuditoria.tabla.empresa'), flex: 1.2 }, { label: t('superadmin.saAuditoria.tabla.modulo'), flex: 1.2 }, { label: t('superadmin.saAuditoria.tabla.estado') }, { label: t('superadmin.saAuditoria.tabla.fecha') }]} />
          ) : null}
          {logsFiltrados.map((log, i) => (
            <SaTableRow key={log.id} theme={theme} last={i === logsFiltrados.length - 1}>
              <SaCell flex={compact ? 1 : 2}>
                <Text numberOfLines={1}>{log.accion}</Text>
                {log.detalles ? <Text numberOfLines={1}>{log.detalles}</Text> : null}
              </SaCell>
              {!compact ? (
                <>
                  <SaCell flex={1.2}><Text numberOfLines={1}>{log.empresaNombre || 'Plataforma'}</Text></SaCell>
                  <SaCell flex={1.2}><Text numberOfLines={1}>{log.modulo}</Text></SaCell>
                  <SaCell><SaStatusIndicator theme={theme} label={log.estado} tone={estadoTone(log.estado)} /></SaCell>
                  <SaCell><Text>{formatoFechaHora(log.timestamp)}</Text></SaCell>
                </>
              ) : (
                <SaCell><SaStatusIndicator theme={theme} label={log.estado} tone={estadoTone(log.estado)} /></SaCell>
              )}
            </SaTableRow>
          ))}
          {logsFiltrados.length === 0 ? (
            <Text>
              {state === 'loading' ? t('superadmin.saAuditoria.vacio.cargando') : t('superadmin.saAuditoria.vacio.sinEventos')}
            </Text>
          ) : null}
          {hayMas ? (
            <TouchableOpacity onPress={cargarMas} disabled={cargandoMas}>
              {cargandoMas ? <ActivityIndicator /> : <Text>{t('superadmin.saAuditoria.cargarMas')}</Text>}
            </TouchableOpacity>
          ) : null}
        </SaSectionCard>
      </View>
    </ScrollView>
  );
}
