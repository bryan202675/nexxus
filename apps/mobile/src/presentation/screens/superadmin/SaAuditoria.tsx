/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/superadmin/SaAuditoria.tsx
 * Capa: presentacion.
 * Proposito: Auditoría global — todos los eventos auditados de todas las empresas, sin excepción.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { AuditResumen } from 'domain/entities/SuperAdmin';
import { useCases } from '@/infrastructure/container';
import { formatoFechaHora } from './saFormat';
import {
  useSaTheme, useSaEntrance,
  SaSectionCard, SaTableHeader, SaTableRow, SaCell, SaStatusIndicator, SaFilterPill, SaBadgeTone,
} from './components/SaWidgets';

type LoadState = 'loading' | 'ready' | 'empty' | 'error';
type FiltroEstado = 'todos' | 'success' | 'warning' | 'error';

const estadoTone = (estado: string): SaBadgeTone => {
  const value = estado.toLowerCase();
  if (value === 'error') return 'danger';
  if (value === 'warning') return 'warning';
  return 'positive';
};

export default function SaAuditoria() {
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
      setErrorMessage(error.message || 'No se pudo cargar la auditoría global.');
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
      setErrorMessage(error.message || 'No se pudieron cargar más eventos.');
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

        <SaSectionCard theme={theme} title="Registro de auditoría">
          <View>
            {(['todos', 'success', 'warning', 'error'] as FiltroEstado[]).map((item) => (
              <SaFilterPill
                key={item}
                theme={theme}
                active={filtroEstado === item}
                onPress={() => setFiltroEstado(item)}
                label={item === 'todos' ? 'Todos' : item === 'success' ? 'Éxito' : item === 'warning' ? 'Advertencia' : 'Error'}
              />
            ))}
          </View>

          {!compact && logsFiltrados.length > 0 ? (
            <SaTableHeader theme={theme} columns={[{ label: 'EVENTO', flex: 2 }, { label: 'EMPRESA', flex: 1.2 }, { label: 'MÓDULO', flex: 1.2 }, { label: 'ESTADO' }, { label: 'FECHA' }]} />
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
              {state === 'loading' ? 'Cargando eventos…' : 'Sin eventos auditados. Cuando ocurran acciones administrativas en cualquier empresa aparecerán aquí.'}
            </Text>
          ) : null}
          {hayMas ? (
            <TouchableOpacity onPress={cargarMas} disabled={cargandoMas}>
              {cargandoMas ? <ActivityIndicator /> : <Text>Cargar más</Text>}
            </TouchableOpacity>
          ) : null}
        </SaSectionCard>
      </View>
    </ScrollView>
  );
}
