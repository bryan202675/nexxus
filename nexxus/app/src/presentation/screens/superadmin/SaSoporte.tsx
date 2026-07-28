/**
 * Documentacion Nexxus - nexxus/app/src/presentation/screens/superadmin/SaSoporte.tsx
 * Capa: presentacion.
 * Proposito: Sesiones de soporte auditadas y respaldos de la plataforma.
 */

import React, { useEffect, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { EmpresaDetalle, SupportSessionRow } from '@/domain/entities/SuperAdmin';
import { useCases } from '@/infrastructure/firebase/container';
import { formatoFechaHora } from './saFormat';
import {
  useSaTheme, useSaEntrance,
  SaSectionCard, SaTableHeader, SaTableRow, SaCell, SaAvatarChip, SaStatusIndicator,
} from './components/SaWidgets';

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

export default function SaSoporte() {
  const { theme } = useSaTheme();
  const { width } = useWindowDimensions();
  const compact = width < 900;
  useSaEntrance();

  const [state, setState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [sesiones, setSesiones] = useState<SupportSessionRow[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaDetalle[]>([]);
  const [iniciando, setIniciando] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    useCases.admin.superAdmin.loadMoreCompanies({}, 500, null).then((result) => setEmpresas(result.items)).catch(() => {});
  }, []);

  useEffect(() => {
    const unsubscribe = useCases.admin.superAdmin.subscribeSupportSessions((rows) => {
      setSesiones(rows);
      setState(rows.length > 0 ? 'ready' : 'empty');
    }, (error) => {
      setErrorMessage(error.message || 'No se pudieron cargar las sesiones de soporte.');
      setState('error');
    });
    return () => unsubscribe();
  }, []);

  const empresaNombre = (id: string) => empresas.find((e) => e.id === id)?.nombre || id;

  const iniciarSoporte = async (empresaId: string) => {
    setIniciando(empresaId);
    setMensaje('');
    try {
      const session = await useCases.admin.superAdmin.startSupportSession(empresaId);
      setMensaje(`Soporte iniciado para ${session.targetEmail}. Tu sesión actual ahora actúa como ese administrador — cierra sesión y vuelve a entrar como super admin cuando termines.`);
    } catch (error: any) {
      setMensaje(error?.message || 'No se pudo iniciar soporte. La empresa necesita un administrador activo.');
    } finally {
      setIniciando('');
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View>
        <View>
          <MaterialIcons name="info-outline" size={20} />
          <Text>Iniciar soporte firma tu sesión actual como el administrador de esa empresa. Vuelve a iniciar sesión como super admin cuando termines.</Text>
        </View>
        {mensaje ? (
          <View>
            <MaterialIcons name="verified-user" size={20} />
            <Text>{mensaje}</Text>
          </View>
        ) : null}
        {errorMessage ? (
          <View>
            <MaterialIcons name="error-outline" size={20} />
            <Text>{errorMessage}</Text>
          </View>
        ) : null}

        <SaSectionCard theme={theme} title="Iniciar sesión de soporte">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              {empresas.map((e) => (
                <TouchableOpacity key={e.id} onPress={() => iniciarSoporte(e.id)} disabled={!!iniciando}>
                  <Text>{iniciando === e.id ? 'Iniciando…' : e.nombre}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SaSectionCard>

        <SaSectionCard theme={theme} title="Sesiones de soporte">
          {!compact && sesiones.length > 0 ? (
            <SaTableHeader theme={theme} columns={[{ label: 'EMPRESA', flex: 1.6 }, { label: 'DESTINO', flex: 1.4 }, { label: 'ACTOR' }, { label: 'ESTADO' }, { label: 'EXPIRA' }]} />
          ) : null}
          {sesiones.map((s, i) => (
            <SaTableRow key={s.id} theme={theme} last={i === sesiones.length - 1}>
              <SaCell flex={compact ? 1 : 1.6}>
                <View>
                  <SaAvatarChip name={empresaNombre(s.empresaId)} />
                  <Text numberOfLines={1}>{empresaNombre(s.empresaId)}</Text>
                </View>
              </SaCell>
              {!compact ? (
                <>
                  <SaCell flex={1.4}><Text numberOfLines={1}>{s.targetEmail}</Text></SaCell>
                  <SaCell><Text numberOfLines={1}>{s.actorName}</Text></SaCell>
                  <SaCell><SaStatusIndicator theme={theme} label={s.status} tone={s.status === 'active' ? 'positive' : 'neutral'} /></SaCell>
                  <SaCell><Text>{formatoFechaHora(s.expiresAt)}</Text></SaCell>
                </>
              ) : (
                <SaCell><SaStatusIndicator theme={theme} label={s.status} tone={s.status === 'active' ? 'positive' : 'neutral'} /></SaCell>
              )}
            </SaTableRow>
          ))}
          {sesiones.length === 0 ? (
            <Text>
              {state === 'loading' ? 'Cargando sesiones…' : 'Sin sesiones de soporte. Cuando inicies soporte para una empresa, la sesión auditada aparecerá aquí.'}
            </Text>
          ) : null}
        </SaSectionCard>
      </View>
    </ScrollView>
  );
}
