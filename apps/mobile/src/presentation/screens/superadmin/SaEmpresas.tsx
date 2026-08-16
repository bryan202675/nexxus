/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/superadmin/SaEmpresas.tsx
 * Capa: presentacion.
 * Proposito: Control total de empresas de la plataforma para el super admin.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import { CompanyFilters, EmpresaDetalle, PagoResumen, PlatformStats, UsuarioGlobal } from 'domain/entities/SuperAdmin';
import { useCases } from '@/infrastructure/container';
import { useAuth } from '@/presentation/hooks/useAuth';
import { useAdminAppearance } from '../admin/adminTheme';
import { AdminModal } from '../admin/AdminModal';
import { AdminModalFormGlass } from '../admin/AdminModalFormGlass';
import { SaConfirmarEliminacion } from './components/SaConfirmarEliminacion';
import { etiquetaEstadoEmpresa, etiquetaRol, formatoFecha, formatoMoneda } from './saFormat';
import {
  useSaTheme, useSaEntrance,
  SaKpiCard, SaSectionCard, SaTableHeader, SaTableRow, SaCell,
  SaAvatarChip, SaStatusIndicator, SaFilterPill, SaBadgeTone, SaIconBox,
} from './components/SaWidgets';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;

type LoadState = 'loading' | 'ready' | 'empty' | 'error';
type EstadoFiltro = 'todas' | 'activas' | 'baneadas';
type Pestana = 'datos' | 'propietario' | 'usuarios' | 'pagos' | 'acciones';

const emptyStats: PlatformStats = {
  empresasTotal: 0, empresasActivas: 0, empresasSuspendidas: 0, empresasExpiradas: 0, empresasBaneadas: 0,
  usuariosTotal: 0, usuariosActivos: 0,
  porRol: { super_admin: 0, admin_empresa: 0, admin: 0, jefe: 0, empleado: 0 },
  porPlan: {}, empresasNuevas30d: 0, usuariosNuevos30d: 0, ingresosTotales: 0, ingresos30d: 0,
};

const estadoTone = (estado: string): SaBadgeTone => {
  switch (estado) {
    case 'Activa': return 'positive';
    case 'Baneada': return 'danger';
    default: return 'neutral';
  }
};

export default function SaEmpresas() {
  const { t } = useTranslation();
  const { theme } = useSaTheme();
  const { theme: modalTheme } = useAdminAppearance();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const compact = width < 900;
  useSaEntrance();

  const FILTROS_ESTADO: { value: EstadoFiltro; label: string }[] = [
    { value: 'todas', label: t('superadmin.saEmpresas.filtros.todas') },
    { value: 'activas', label: t('superadmin.saEmpresas.filtros.activas') },
    { value: 'baneadas', label: t('superadmin.saEmpresas.filtros.baneadas') },
  ];

  const [state, setState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [empresas, setEmpresas] = useState<EmpresaDetalle[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats>(emptyStats);
  const [hayMas, setHayMas] = useState(false);
  const [cursor, setCursor] = useState<unknown>(null);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>('todas');

  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<{ empresa: EmpresaDetalle | null; usuarios: UsuarioGlobal[]; pagos: PagoResumen[] }>({ empresa: null, usuarios: [], pagos: [] });
  const [pestana, setPestana] = useState<Pestana>('datos');
  const [accionEnCurso, setAccionEnCurso] = useState('');
  const [avisoAccion, setAvisoAccion] = useState('');
  const [formEdicion, setFormEdicion] = useState({ nombre: '', giro: '', tamanoEquipo: '' });
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [modalCrear, setModalCrear] = useState(false);
  const [crearForm, setCrearForm] = useState({ nombreEmpresa: '', nombreAdmin: '', correoAdmin: '', contrasenaAdmin: '', usuarioInterno: '' });
  const [creando, setCreando] = useState(false);
  const [erroCrear, setErrorCrear] = useState('');

  useEffect(() => {
    let vivo = true;
    useCases.admin.superAdmin.getPlatformStats().then((r) => { if (vivo) setPlatformStats(r); }).catch(() => {});
    return () => { vivo = false; };
  }, []);

  const filtros: CompanyFilters = useMemo(() => ({ estado: filtroEstado === 'todas' ? undefined : filtroEstado }), [filtroEstado]);

  useEffect(() => {
    setState('loading');
    const unsubscribe = useCases.admin.superAdmin.subscribeCompanies(filtros, 50, (result) => {
      setEmpresas(result.items);
      setCursor(result.cursor);
      setHayMas(result.hayMas);
      setState(result.items.length > 0 ? 'ready' : 'empty');
    }, (error) => {
      setErrorMessage(error.message || 'No se pudieron cargar las empresas.');
      setState('error');
    });
    return () => unsubscribe();
  }, [filtros]);

  useEffect(() => {
    if (!detalleId) { setDetalle({ empresa: null, usuarios: [], pagos: [] }); return; }
    const unsubscribe = useCases.admin.superAdmin.subscribeCompanyDetail(detalleId, (data) => {
      setDetalle(data);
      if (data.empresa) setFormEdicion({ nombre: data.empresa.nombre, giro: data.empresa.giro, tamanoEquipo: data.empresa.tamanoEquipo });
    }, () => {});
    return () => unsubscribe();
  }, [detalleId]);

  const empresasFiltradas = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return empresas;
    return empresas.filter((empresa) =>
      empresa.nombre.toLowerCase().includes(term) ||
      empresa.codigo.toLowerCase().includes(term) ||
      empresa.id.toLowerCase().includes(term)
    );
  }, [empresas, busqueda]);

  const ingresoMensualPromedio = platformStats.empresasActivas > 0 ? platformStats.ingresos30d / platformStats.empresasActivas : 0;

  const cargarMas = async () => {
    if (!hayMas || cargandoMas) return;
    setCargandoMas(true);
    try {
      const result = await useCases.admin.superAdmin.loadMoreCompanies(filtros, 50, cursor);
      setEmpresas((prev) => [...prev, ...result.items]);
      setCursor(result.cursor);
      setHayMas(result.hayMas);
    } catch (error: any) {
      setErrorMessage(error.message || 'No se pudieron cargar más empresas.');
    } finally {
      setCargandoMas(false);
    }
  };

  const cerrarDetalle = () => {
    setDetalleId(null);
    setPestana('datos');
    setAvisoAccion('');
    setConfirmarEliminar(false);
  };

  const ejecutarAccion = async (tipo: string, fn: () => Promise<any>) => {
    if (!user) return;
    setAccionEnCurso(tipo);
    setAvisoAccion('');
    try {
      await fn();
      setAvisoAccion('Acción aplicada correctamente.');
    } catch (error: any) {
      setAvisoAccion(error?.message || 'No se pudo completar la acción.');
    } finally {
      setAccionEnCurso('');
    }
  };

  const guardarEdicion = () => detalleId && ejecutarAccion('editar', () =>
    useCases.admin.superAdmin.updateCompanyProfile(detalleId, formEdicion));

  const cambiarBaneo = (banned: boolean) => detalleId && ejecutarAccion(banned ? 'banear' : 'desbanear', () =>
    useCases.admin.superAdmin.setCompanyBan(detalleId, banned));

  const cambiarEstado = (accion: 'reactivar_business' | 'suspender' | 'expirar') => detalleId && user && ejecutarAccion(accion, () =>
    useCases.admin.superAdmin.applyCompanyAction(detalleId, accion, { id: user.id, nombre: user.nombre, rol: user.rol }));

  const iniciarSoporte = () => detalleId && ejecutarAccion('soporte', async () => {
    const session = await useCases.admin.superAdmin.startSupportSession(detalleId);
    setAvisoAccion(`Soporte iniciado para ${session.targetEmail}. Tu sesión ahora actúa como ese administrador.`);
  });

  const confirmarEliminarEmpresa = async () => {
    if (!detalleId || !detalle.empresa) return;
    setAccionEnCurso('eliminar');
    try {
      await useCases.admin.superAdmin.deleteCompany(detalleId, detalle.empresa.nombre);
      setConfirmarEliminar(false);
      cerrarDetalle();
    } catch (error: any) {
      setAvisoAccion(error?.message || 'No se pudo eliminar la empresa.');
    } finally {
      setAccionEnCurso('');
    }
  };

  const crearEmpresa = async () => {
    setErrorCrear('');
    if (!crearForm.nombreEmpresa || !crearForm.nombreAdmin || !crearForm.correoAdmin || !crearForm.contrasenaAdmin) {
      setErrorCrear('Completa nombre de empresa, nombre y correo del propietario, y una contraseña.');
      return;
    }
    setCreando(true);
    try {
      await useCases.admin.superAdmin.createCompany(crearForm);
      setModalCrear(false);
      setCrearForm({ nombreEmpresa: '', nombreAdmin: '', correoAdmin: '', contrasenaAdmin: '', usuarioInterno: '' });
    } catch (error: any) {
      setErrorCrear(error?.message || 'No se pudo crear la empresa.');
    } finally {
      setCreando(false);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View>
        {errorMessage ? (
          <View>
            <SaIconBox icon="error-outline" tone="danger" theme={theme} size={28} />
            <Text>{errorMessage}</Text>
          </View>
        ) : null}

        <View>
          <SaKpiCard index={0} theme={theme} icon="domain" label={t('superadmin.saEmpresas.kpi.empresasTotales')} value={String(platformStats.empresasTotal)} delta={t('superadmin.saEmpresas.kpi.deltaEn30Dias', { count: platformStats.empresasNuevas30d })} tone={platformStats.empresasNuevas30d > 0 ? 'positive' : 'neutral'} />
          <SaKpiCard index={1} theme={theme} icon="verified" label={t('superadmin.saEmpresas.kpi.activas')} value={String(platformStats.empresasActivas)} delta={t('superadmin.saEmpresas.kpi.suscripcionVigente')} />
          <SaKpiCard index={2} theme={theme} icon="health-and-safety" label={t('superadmin.saEmpresas.kpi.baneadas')} value={String(platformStats.empresasBaneadas)} tone={platformStats.empresasBaneadas > 0 ? 'warning' : 'neutral'} />
          <SaKpiCard index={3} theme={theme} icon="payments" label={t('superadmin.saEmpresas.kpi.ingresoMensualPromedio')} value={formatoMoneda(ingresoMensualPromedio)} delta={t('superadmin.saEmpresas.kpi.porEmpresaActiva')} />
        </View>

        <View>
          <View>
            <SaIconBox icon="search" tone="neutral" theme={theme} size={26} />
            <TextInput
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Buscar por nombre, código o ID"
            />
          </View>
          <TouchableOpacity onPress={() => setModalCrear(true)}>
            <MaterialIcons name="add-business" size={18} />
            <Text>{t('superadmin.saEmpresas.acciones.crearEmpresa')}</Text>
          </TouchableOpacity>
        </View>

        <SaSectionCard theme={theme} title={t('superadmin.saEmpresas.seccion.todasEmpresas')}>
          <View>
            {FILTROS_ESTADO.map((item) => (
              <SaFilterPill key={item.value} theme={theme} label={item.label} active={filtroEstado === item.value} onPress={() => setFiltroEstado(item.value)} />
            ))}
          </View>

          {state === 'loading' ? (
            <View>
              {[0, 1, 2, 3].map((i) => <View key={i} />)}
            </View>
          ) : (
            <>
              {!compact && empresasFiltradas.length > 0 ? (
                <SaTableHeader theme={theme} columns={[{ label: t('superadmin.saEmpresas.tabla.empresa'), flex: 2 }, { label: t('superadmin.saEmpresas.tabla.plan') }, { label: t('superadmin.saEmpresas.tabla.estado') }, { label: t('superadmin.saEmpresas.tabla.usuarios'), flex: 0.8 }, { label: t('superadmin.saEmpresas.tabla.alta') }]} />
              ) : null}
              {empresasFiltradas.map((empresa, i) => {
                const estado = empresa.baneada ? 'Baneada' : etiquetaEstadoEmpresa(empresa.subscriptionStatus);
                const tone: SaBadgeTone = empresa.baneada ? 'danger' : estadoTone(estado);
                return (
                  <SaTableRow key={empresa.id} theme={theme} last={i === empresasFiltradas.length - 1} onPress={() => setDetalleId(empresa.id)}>
                    <SaCell flex={2}>
                      <View>
                        <SaAvatarChip name={empresa.nombre} />
                        <Text numberOfLines={1}>{empresa.nombre}</Text>
                      </View>
                    </SaCell>
                    {!compact ? (
                      <>
                        <SaCell><Text numberOfLines={1}>{empresa.plan}</Text></SaCell>
                        <SaCell><SaStatusIndicator theme={theme} label={estado} tone={tone} /></SaCell>
                        <SaCell flex={0.8}><Text>{empresa.usuariosTotal}</Text></SaCell>
                        <SaCell><Text>{formatoFecha(empresa.fechaCreacion)}</Text></SaCell>
                      </>
                    ) : (
                      <SaCell><SaStatusIndicator theme={theme} label={estado} tone={tone} /></SaCell>
                    )}
                  </SaTableRow>
                );
              })}
              {empresasFiltradas.length === 0 ? (
                <Text>
                  {state === 'empty' ? t('superadmin.saEmpresas.vacio.sinEmpresasCrear') : t('superadmin.saEmpresas.vacio.sinFiltro')}
                </Text>
              ) : null}
              {hayMas ? (
                <TouchableOpacity onPress={cargarMas} disabled={cargandoMas}>
                  {cargandoMas ? <ActivityIndicator /> : <Text>{t('superadmin.saEmpresas.cargarMas')}</Text>}
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </SaSectionCard>
      </View>

      {/* Modal: detalle de empresa */}
      <AdminModal visible={Boolean(detalleId)} onRequestClose={cerrarDetalle} transparent>
        <View>
          <AdminModalFormGlass>
            <View>
              <Text numberOfLines={1}>{detalle.empresa?.nombre || t('superadmin.saEmpresas.modal.empresaFallback')}</Text>
              <TouchableOpacity onPress={cerrarDetalle}><MaterialIcons name="close" size={16} /></TouchableOpacity>
            </View>
            <View>
              {(['datos', 'propietario', 'usuarios', 'pagos', 'acciones'] as Pestana[]).map((tab) => (
                <TouchableOpacity key={tab} onPress={() => setPestana(tab)}>
                  <Text>
                    {tab === 'datos' ? t('superadmin.saEmpresas.modal.tabs.datos') : tab === 'propietario' ? t('superadmin.saEmpresas.modal.tabs.propietario') : tab === 'usuarios' ? t('superadmin.saEmpresas.modal.tabs.usuarios') : tab === 'pagos' ? t('superadmin.saEmpresas.modal.tabs.pagos') : t('superadmin.saEmpresas.modal.tabs.acciones')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {avisoAccion ? <Text>{avisoAccion}</Text> : null}

            <ScrollView showsVerticalScrollIndicator={false}>
              {pestana === 'datos' && detalle.empresa ? (
                <View>
                  <Text>Nombre</Text>
                  <TextInput value={formEdicion.nombre} onChangeText={(v) => setFormEdicion((f) => ({ ...f, nombre: v }))} />
                  <Text>Giro</Text>
                  <TextInput value={formEdicion.giro} onChangeText={(v) => setFormEdicion((f) => ({ ...f, giro: v }))} />
                  <Text>Tamaño de equipo</Text>
                  <TextInput value={formEdicion.tamanoEquipo} onChangeText={(v) => setFormEdicion((f) => ({ ...f, tamanoEquipo: v }))} />
                  <Text>Código: {detalle.empresa.codigo} · Creada: {formatoFecha(detalle.empresa.fechaCreacion)}</Text>
                  <TouchableOpacity onPress={guardarEdicion} disabled={accionEnCurso === 'editar'}>
                    <Text>{accionEnCurso === 'editar' ? t('superadmin.saEmpresas.guardar.guardando') : t('superadmin.saEmpresas.guardar.cambios')}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {pestana === 'propietario' && detalle.empresa ? (
                <View>
                  <Text>Nombre: {detalle.empresa.adminNombre || '—'}</Text>
                  <Text>Correo: {detalle.empresa.adminCorreo || '—'}</Text>
                  <Text>ID de usuario: {detalle.empresa.adminId || '—'}</Text>
                </View>
              ) : null}

              {pestana === 'usuarios' ? (
                <View>
                  {detalle.usuarios.length === 0 ? <Text>{t('superadmin.saEmpresas.vacio.sinUsuarios')}</Text> : null}
                  {detalle.usuarios.map((u) => (
                    <View key={u.id}>
                      <View>
                        <Text numberOfLines={1}>{u.nombre}{u.esPropietario ? ' · Propietario' : ''}</Text>
                        <Text numberOfLines={1}>{u.correo} · {etiquetaRol(u.rol)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}

              {pestana === 'pagos' && detalle.empresa ? (
                <View>
                  <Text>Plan: {detalle.empresa.plan} ({detalle.empresa.planBilling})</Text>
                  <Text>Estado de pago: {detalle.empresa.paymentStatus}</Text>
                  <Text>Vence: {formatoFecha(detalle.empresa.planExpiresAt)}</Text>
                  <Text>{t('superadmin.saEmpresas.pagos.recientes')}</Text>
                  {detalle.pagos.length === 0 ? <Text>{t('superadmin.saEmpresas.vacio.sinPagos')}</Text> : null}
                  {detalle.pagos.map((pago) => (
                    <View key={pago.id}>
                      <View>
                        <Text>{pago.plan}</Text>
                        <Text>{formatoMoneda(pago.amount)} · {pago.status}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}

              {pestana === 'acciones' && detalle.empresa ? (
                <View>
                  <Text>{t('superadmin.saEmpresas.accionesTab.suscripcion')}</Text>
                  <View>
                    <TouchableOpacity onPress={() => cambiarEstado('reactivar_business')} disabled={!!accionEnCurso}>
                      <Text>{accionEnCurso === 'reactivar_business' ? t('superadmin.saEmpresas.accionesTab.aplicando') : t('superadmin.saEmpresas.accionesTab.reactivar')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => cambiarEstado('suspender')} disabled={!!accionEnCurso}>
                      <Text>{accionEnCurso === 'suspender' ? t('superadmin.saEmpresas.accionesTab.aplicando') : t('superadmin.saEmpresas.accionesTab.suspender')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => cambiarEstado('expirar')} disabled={!!accionEnCurso}>
                      <Text>{accionEnCurso === 'expirar' ? t('superadmin.saEmpresas.accionesTab.aplicando') : t('superadmin.saEmpresas.accionesTab.expirar')}</Text>
                    </TouchableOpacity>
                  </View>

                  <Text>{t('superadmin.saEmpresas.accionesTab.acceso')}</Text>
                  <Text>Banear bloquea el acceso de la empresa y de todos sus usuarios. Es reversible.</Text>
                  <View>
                    {detalle.empresa.baneada ? (
                      <TouchableOpacity onPress={() => cambiarBaneo(false)} disabled={!!accionEnCurso}>
                        <Text>{accionEnCurso === 'desbanear' ? t('superadmin.saEmpresas.accionesTab.aplicando') : t('superadmin.saEmpresas.accionesTab.desbanear')}</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={() => cambiarBaneo(true)} disabled={!!accionEnCurso}>
                        <Text>{accionEnCurso === 'banear' ? t('superadmin.saEmpresas.accionesTab.aplicando') : t('superadmin.saEmpresas.accionesTab.banear')}</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={iniciarSoporte} disabled={!!accionEnCurso}>
                      <Text>{accionEnCurso === 'soporte' ? t('superadmin.saEmpresas.accionesTab.iniciando') : t('superadmin.saEmpresas.accionesTab.iniciarSoporte')}</Text>
                    </TouchableOpacity>
                  </View>

                  <Text>{t('superadmin.saEmpresas.accionesTab.zonaPeligro')}</Text>
                  <Text>Elimina permanentemente la empresa, sus cuentas de acceso y todos sus datos. No se puede deshacer.</Text>
                  <TouchableOpacity onPress={() => setConfirmarEliminar(true)}>
                    <Text>{t('superadmin.saEmpresas.accionesTab.eliminarEmpresa')}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </ScrollView>
          </AdminModalFormGlass>
        </View>
      </AdminModal>

      <SaConfirmarEliminacion
        visible={confirmarEliminar}
        theme={modalTheme}
        titulo={t('superadmin.saEmpresas.eliminarModal.titulo')}
        mensaje={t('superadmin.saEmpresas.eliminarModal.mensaje')}
        nombreEsperado={detalle.empresa?.nombre || ''}
        procesando={accionEnCurso === 'eliminar'}
        onCancelar={() => setConfirmarEliminar(false)}
        onConfirmar={confirmarEliminarEmpresa}
      />

      {/* Modal: crear empresa */}
      <AdminModal visible={modalCrear} onRequestClose={() => setModalCrear(false)} transparent>
        <View>
          <AdminModalFormGlass>
            <View>
              <Text>{t('superadmin.saEmpresas.crearModal.titulo')}</Text>
              <TouchableOpacity onPress={() => setModalCrear(false)}><MaterialIcons name="close" size={16} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View>
                <Text>Nombre de la empresa</Text>
                <TextInput value={crearForm.nombreEmpresa} onChangeText={(v) => setCrearForm((f) => ({ ...f, nombreEmpresa: v }))} />
                <Text>Nombre del propietario</Text>
                <TextInput value={crearForm.nombreAdmin} onChangeText={(v) => setCrearForm((f) => ({ ...f, nombreAdmin: v }))} />
                <Text>Correo del propietario</Text>
                <TextInput value={crearForm.correoAdmin} onChangeText={(v) => setCrearForm((f) => ({ ...f, correoAdmin: v }))} autoCapitalize="none" />
                <Text>Contraseña inicial</Text>
                <TextInput value={crearForm.contrasenaAdmin} onChangeText={(v) => setCrearForm((f) => ({ ...f, contrasenaAdmin: v }))} secureTextEntry />
                <Text>Usuario de acceso (opcional)</Text>
                <TextInput value={crearForm.usuarioInterno} onChangeText={(v) => setCrearForm((f) => ({ ...f, usuarioInterno: v }))} autoCapitalize="none" />
                {erroCrear ? <Text>{erroCrear}</Text> : null}
                <TouchableOpacity onPress={crearEmpresa} disabled={creando}>
                  <Text>{creando ? t('superadmin.saEmpresas.crearModal.creando') : t('superadmin.saEmpresas.acciones.crearEmpresa')}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </AdminModalFormGlass>
        </View>
      </AdminModal>
    </ScrollView>
  );
}
