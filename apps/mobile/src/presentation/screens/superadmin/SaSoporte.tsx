/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/superadmin/SaSoporte.tsx
 * Capa: presentacion.
 * Proposito: Sesiones de soporte auditadas y respaldos de la plataforma.
 */

import React, { useEffect, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { ScrollView, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import { EmpresaDetalle, SupportSessionRow, PublicSupportRequest } from 'domain/entities/SuperAdmin';
import { useCases } from '@/infrastructure/container';
import { formatoFechaHora } from './saFormat';
import {
  useSaTheme, useSaEntrance,
  SaSectionCard, SaTableHeader, SaTableRow, SaCell, SaAvatarChip, SaStatusIndicator, SaBadgeTone,
} from './components/SaWidgets';

const Text = AdminTranslatedText;

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

export default function SaSoporte() {
  const { t } = useTranslation();
  const { theme } = useSaTheme();
  const { width } = useWindowDimensions();
  const compact = width < 900;
  useSaEntrance();

  const [state, setState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [sesiones, setSesiones] = useState<SupportSessionRow[]>([]);
  const [solicitudes, setSolicitudes] = useState<PublicSupportRequest[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaDetalle[]>([]);
  const [iniciando, setIniciando] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [ticketExpandido, setTicketExpandido] = useState<string | null>(null);

  useEffect(() => {
    useCases.admin.superAdmin.loadMoreCompanies({}, 500, null).then((result) => setEmpresas(result.items)).catch(() => {});
  }, []);

  useEffect(() => {
    const unsubscribe = useCases.admin.superAdmin.subscribeSupportSessions((rows) => {
      setSesiones(rows);
      setState(rows.length > 0 ? 'ready' : 'empty');
    }, (error) => {
      setErrorMessage(error.message || t('superadmin.saSoporte.error.cargaSesiones'));
      setState('error');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsub = useCases.admin.superAdmin.subscribePublicSupportRequests((reqs) => {
      setSolicitudes(reqs);
    }, (err) => {
      console.warn('[SaSoporte] Error al cargar tickets de soporte público:', err);
    });
    return () => unsub();
  }, []);

  const empresaNombre = (id: string) => empresas.find((e) => e.id === id)?.nombre || id;

  const iniciarSoporte = async (empresaId: string) => {
    setIniciando(empresaId);
    setMensaje('');
    try {
      const session = await useCases.admin.superAdmin.startSupportSession(empresaId);
      setMensaje(`Soporte iniciado para ${session.targetEmail}. Tu sesión actual ahora actúa como ese administrador — cierra sesión y vuelve a entrar como super admin cuando termines.`);
    } catch (error: any) {
      setMensaje(error?.message || t('superadmin.saSoporte.error.iniciarSoporte'));
    } finally {
      setIniciando('');
    }
  };

  const cambiarEstadoTicket = async (id: string, nuevoEstado: PublicSupportRequest['estado']) => {
    try {
      await useCases.admin.superAdmin.updatePublicSupportRequestStatus(id, nuevoEstado);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al actualizar el estado del ticket.');
    }
  };

  const tonePorEstado = (estado: string): SaBadgeTone => {
    if (estado === 'resuelto') return 'positive';
    if (estado === 'contactado') return 'info';
    if (estado === 'en_revision') return 'warning';
    return 'danger';
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View>
        <View>
          <MaterialIcons name="info-outline" size={20} />
          <Text>{t('superadmin.saSoporte.avisoInicial')}</Text>
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

        {/* Sección: Solicitudes de Soporte General y Onboarding */}
        <SaSectionCard theme={theme} title={`Mesa de Ayuda Global y Onboarding (${solicitudes.length})`}>
          {!compact && solicitudes.length > 0 ? (
            <SaTableHeader
              theme={theme}
              columns={[
                { label: 'Ticket / Asunto', flex: 1.6 },
                { label: 'Contacto', flex: 1.4 },
                { label: 'Categoría' },
                { label: 'Prioridad' },
                { label: 'Estado' },
                { label: 'Fecha' },
              ]}
            />
          ) : null}

          {solicitudes.map((sol, i) => {
            const expandido = ticketExpandido === sol.id;
            return (
              <View key={sol.id}>
                <TouchableOpacity
                  onPress={() => setTicketExpandido(expandido ? null : sol.id)}
                  activeOpacity={0.8}
                >
                  <SaTableRow theme={theme} last={i === solicitudes.length - 1 && !expandido}>
                    <SaCell flex={compact ? 1 : 1.6}>
                      <View>
                        <Text style={{ fontWeight: '800', color: theme.text }}>{sol.ticketCodigo}</Text>
                        <Text numberOfLines={1} style={{ fontSize: 12, color: theme.soft }}>{sol.asunto}</Text>
                      </View>
                    </SaCell>
                    {!compact ? (
                      <>
                        <SaCell flex={1.4}>
                          <View>
                            <Text numberOfLines={1} style={{ fontWeight: '600', color: theme.text }}>{sol.nombre}</Text>
                            <Text numberOfLines={1} style={{ fontSize: 11, color: theme.soft }}>{sol.correo}</Text>
                            {sol.empresa ? <Text numberOfLines={1} style={{ fontSize: 10, color: theme.muted }}>{sol.empresa}</Text> : null}
                          </View>
                        </SaCell>
                        <SaCell>
                          <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: theme.soft }}>
                            {sol.categoria}
                          </Text>
                        </SaCell>
                        <SaCell>
                          <Text style={{ fontSize: 11, fontWeight: '800', textTransform: 'uppercase', color: sol.prioridad === 'urgente' || sol.prioridad === 'alta' ? '#EF4444' : theme.soft }}>
                            {sol.prioridad}
                          </Text>
                        </SaCell>
                        <SaCell>
                          <SaStatusIndicator theme={theme} label={sol.estado.replace('_', ' ')} tone={tonePorEstado(sol.estado)} />
                        </SaCell>
                        <SaCell>
                          <Text style={{ fontSize: 11 }}>{formatoFechaHora(sol.createdAt)}</Text>
                        </SaCell>
                      </>
                    ) : (
                      <SaCell>
                        <SaStatusIndicator theme={theme} label={sol.estado.replace('_', ' ')} tone={tonePorEstado(sol.estado)} />
                      </SaCell>
                    )}
                  </SaTableRow>
                </TouchableOpacity>

                {/* Detalle Desplegable del Ticket con Acciones de Estado */}
                {expandido && (
                  <View style={{ backgroundColor: theme.surfaceHover, padding: 14, marginHorizontal: 8, marginBottom: 8, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ fontWeight: '800', color: theme.text, marginBottom: 4 }}>Descripción del Problema:</Text>
                      <Text style={{ fontSize: 13, lineHeight: 19, color: theme.text }}>{sol.mensaje}</Text>
                    </View>

                    {sol.telefono ? (
                      <Text style={{ fontSize: 11, color: theme.soft, marginBottom: 8 }}>Teléfono: {sol.telefono}</Text>
                    ) : null}

                    {/* Selector Rápido de Estado */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: theme.soft, marginRight: 4 }}>Marcar estado:</Text>
                      {(['pendiente', 'en_revision', 'contactado', 'resuelto'] as PublicSupportRequest['estado'][]).map((st) => (
                        <TouchableOpacity
                          key={st}
                          onPress={() => cambiarEstadoTicket(sol.id, st)}
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                            backgroundColor: sol.estado === st ? (tonePorEstado(st) === 'positive' ? '#10B981' : tonePorEstado(st) === 'warning' ? '#F59E0B' : tonePorEstado(st) === 'info' ? '#3B82F6' : '#EF4444') : theme.surface,
                            borderWidth: 1,
                            borderColor: theme.border,
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: '800', color: sol.estado === st ? '#FFFFFF' : theme.soft }}>
                            {st.replace('_', ' ').toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            );
          })}

          {solicitudes.length === 0 ? (
            <Text style={{ padding: 12, color: theme.soft }}>No hay solicitudes de soporte público pendientes.</Text>
          ) : null}
        </SaSectionCard>

        {/* Sección: Impersonación / Acceso a Empresas */}
        <SaSectionCard theme={theme} title={t('superadmin.saSoporte.secciones.iniciarSesion')}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              {empresas.map((e) => (
                <TouchableOpacity key={e.id} onPress={() => iniciarSoporte(e.id)} disabled={!!iniciando}>
                  <Text>{iniciando === e.id ? t('superadmin.saSoporte.iniciando') : e.nombre}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SaSectionCard>

        {/* Sección: Sesiones Activas de Soporte */}
        <SaSectionCard theme={theme} title={t('superadmin.saSoporte.secciones.sesionesSoporte')}>
          {!compact && sesiones.length > 0 ? (
            <SaTableHeader theme={theme} columns={[{ label: t('superadmin.saSoporte.tabla.empresa'), flex: 1.6 }, { label: t('superadmin.saSoporte.tabla.destino'), flex: 1.4 }, { label: t('superadmin.saSoporte.tabla.actor') }, { label: t('superadmin.saSoporte.tabla.estado') }, { label: t('superadmin.saSoporte.tabla.expira') }]} />
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
              {state === 'loading' ? t('superadmin.saSoporte.vacio.cargando') : t('superadmin.saSoporte.vacio.sinSesiones')}
            </Text>
          ) : null}
        </SaSectionCard>
      </View>
    </ScrollView>
  );
}
