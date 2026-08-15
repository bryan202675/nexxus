/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/superadmin/SaUsuarios.tsx
 * Capa: presentacion.
 * Proposito: Control total de usuarios de la plataforma para el super admin.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { EmpresaDetalle, PlatformStats, SaResetMode, UserFilters, UsuarioGlobal } from 'domain/entities/SuperAdmin';
import { useCases } from '@/infrastructure/container';
import { useAuth } from '@/presentation/hooks/useAuth';
import { useAdminAppearance } from '../admin/adminTheme';
import { AdminModal } from '../admin/AdminModal';
import { AdminModalFormGlass } from '../admin/AdminModalFormGlass';
import { SaConfirmarEliminacion } from './components/SaConfirmarEliminacion';
import { ROLE_OPTIONS, etiquetaEstadoUsuario, etiquetaRol } from './saFormat';
import {
  useSaTheme, useSaEntrance,
  SaKpiCard, SaSectionCard, SaTableHeader, SaTableRow, SaCell,
  SaAvatarChip, SaStatusIndicator, SaFilterPill, SaBadgeTone,
} from './components/SaWidgets';

type LoadState = 'loading' | 'ready' | 'empty' | 'error';
type EstadoFiltro = 'activos' | 'inactivos' | 'baneados' | 'eliminados' | 'todos';

const FILTROS_ESTADO: { value: EstadoFiltro; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'activos', label: 'Activos' },
  { value: 'inactivos', label: 'Inactivos' },
  { value: 'baneados', label: 'Baneados' },
  { value: 'eliminados', label: 'Eliminados' },
];

const emptyStats: PlatformStats = {
  empresasTotal: 0, empresasActivas: 0, empresasSuspendidas: 0, empresasExpiradas: 0, empresasBaneadas: 0,
  usuariosTotal: 0, usuariosActivos: 0,
  porRol: { super_admin: 0, admin_empresa: 0, admin: 0, jefe: 0, empleado: 0 },
  porPlan: {}, empresasNuevas30d: 0, usuariosNuevos30d: 0, ingresosTotales: 0, ingresos30d: 0,
};

const estadoTone = (estado: string): SaBadgeTone => {
  if (estado === 'Activo') return 'positive';
  if (estado === 'Inactivo') return 'neutral';
  if (estado === 'Baneado') return 'danger';
  if (estado === 'Eliminado') return 'danger';
  return 'neutral';
};

export default function SaUsuarios() {
  const { theme } = useSaTheme();
  const { theme: modalTheme } = useAdminAppearance();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const compact = width < 900;
  useSaEntrance();

  const [state, setState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [usuarios, setUsuarios] = useState<UsuarioGlobal[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaDetalle[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats>(emptyStats);
  const [hayMas, setHayMas] = useState(false);
  const [cursor, setCursor] = useState<unknown>(null);
  const [cargandoMas, setCargandoMas] = useState(false);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>('todos');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<UsuarioGlobal | null>(null);
  const [pestana, setPestana] = useState<'datos' | 'acciones'>('datos');
  const [formEdicion, setFormEdicion] = useState({ nombre: '', rol: 'empleado' });
  const [accionEnCurso, setAccionEnCurso] = useState('');
  const [avisoAccion, setAvisoAccion] = useState('');
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  const [modalReset, setModalReset] = useState(false);
  const [resetParams, setResetParams] = useState({ mode: 'link' as SaResetMode, tempPassword: '' });

  useEffect(() => {
    let vivo = true;
    useCases.admin.superAdmin.getPlatformStats().then((r) => { if (vivo) setPlatformStats(r); }).catch(() => {});
    return () => { vivo = false; };
  }, []);

  const filtros: UserFilters = useMemo(() => ({ estado: filtroEstado === 'todos' ? undefined : filtroEstado, empresaId: selectedCompanyId || undefined }), [filtroEstado, selectedCompanyId]);

  useEffect(() => {
    useCases.admin.superAdmin.loadMoreCompanies({}, 500, null).then((res) => setEmpresas(res.items)).catch(() => {});
  }, []);

  useEffect(() => {
    setState('loading');
    const unsubscribe = useCases.admin.superAdmin.subscribeUsers(filtros, 80, (result) => {
      setUsuarios(result.items);
      setCursor(result.cursor);
      setHayMas(result.hayMas);
      setState(result.items.length > 0 ? 'ready' : 'empty');
    }, (error) => {
      setErrorMessage(error.message || 'No se pudieron cargar los usuarios.');
      setState('error');
    });
    return () => unsubscribe();
  }, [filtros]);

  useEffect(() => {
    if (detalleId) {
      const u = usuarios.find((x) => x.id === detalleId) || null;
      setDetalle(u);
      if (u) setFormEdicion({ nombre: u.nombre, rol: u.rol });
    } else {
      setDetalle(null);
    }
  }, [detalleId, usuarios]);

  const usuariosFiltrados = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return usuarios;
    return usuarios.filter((u) =>
      u.nombre.toLowerCase().includes(term) ||
      u.correo.toLowerCase().includes(term) ||
      u.id.toLowerCase().includes(term)
    );
  }, [usuarios, busqueda]);

  const empresasFiltradas = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    if (!term) return empresas;
    return empresas.filter((e) =>
      e.nombre.toLowerCase().includes(term) ||
      e.codigo.toLowerCase().includes(term) ||
      e.id.toLowerCase().includes(term)
    );
  }, [empresas, busqueda]);

  const cargarMas = async () => {
    if (!hayMas || cargandoMas) return;
    setCargandoMas(true);
    try {
      const result = await useCases.admin.superAdmin.loadMoreUsers(filtros, 80, cursor);
      setUsuarios((prev) => [...prev, ...result.items]);
      setCursor(result.cursor);
      setHayMas(result.hayMas);
    } catch (error: any) {
      setErrorMessage(error.message || 'No se pudieron cargar más usuarios.');
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
      if (tipo === 'eliminar') {
        setConfirmarEliminar(false);
        cerrarDetalle();
      }
    } catch (error: any) {
      setAvisoAccion(error?.message || 'No se pudo completar la acción.');
    } finally {
      setAccionEnCurso('');
    }
  };

  const guardarEdicion = () => detalle && ejecutarAccion('editar', () =>
    useCases.admin.superAdmin.updateUser(detalle.id, { nombre: formEdicion.nombre, rol: formEdicion.rol as any }, formEdicion.rol, detalle.empresaId));

  const cambiarEstado = (accion: 'suspender' | 'reactivar') => detalle && user && ejecutarAccion(accion, () =>
    useCases.admin.superAdmin.updateUser(detalle.id, { activo: accion === 'reactivar' }));

  const cambiarBaneo = (banned: boolean) => detalle && ejecutarAccion(banned ? 'banear' : 'desbanear', () =>
    useCases.admin.superAdmin.setUserBan(detalle.id, banned));

  const aplicarReset = () => {
    if (!detalle) return;
    ejecutarAccion('reset', () => useCases.admin.superAdmin.resetPassword(detalle.id, resetParams.mode, resetParams.tempPassword));
    setModalReset(false);
  };

  const empresaNombre = (id: string) => empresas.find((e) => e.id === id)?.nombre || id;

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
          <SaKpiCard index={0} theme={theme} icon="groups" label="Usuarios totales" value={String(platformStats.usuariosTotal)} delta={`${platformStats.usuariosActivos} activos`} tone="positive" />
          <SaKpiCard index={1} theme={theme} icon="admin-panel-settings" label="Propietarios" value={String(platformStats.porRol.admin_empresa || 0)} delta="Admin de empresa" />
          <SaKpiCard index={2} theme={theme} icon="supervisor-account" label="Jefes" value={String(platformStats.porRol.jefe || 0)} delta="Líderes de equipo" />
          <SaKpiCard index={3} theme={theme} icon="badge" label="Empleados" value={String(platformStats.porRol.empleado || 0)} delta={`+${platformStats.usuariosNuevos30d} en 30 días`} tone={platformStats.usuariosNuevos30d > 0 ? 'positive' : 'neutral'} />
        </View>

        {!selectedCompanyId ? (
          <>
            <View>
              <MaterialIcons name="search" size={20} />
              <TextInput
                value={busqueda}
                onChangeText={setBusqueda}
                placeholder="Buscar empresa por nombre, código o ID"
              />
            </View>

            <SaSectionCard theme={theme} title="Directorio de empresas">
              {!compact && empresasFiltradas.length > 0 ? (
                <SaTableHeader theme={theme} columns={[{ label: 'EMPRESA', flex: 2 }, { label: 'CÓDIGO' }, { label: 'PLAN' }]} />
              ) : null}
              {empresasFiltradas.map((emp, i) => (
                <SaTableRow key={emp.id} theme={theme} last={i === empresasFiltradas.length - 1} onPress={() => { setSelectedCompanyId(emp.id); setBusqueda(''); }}>
                  <SaCell flex={2}>
                    <View>
                      <SaAvatarChip name={emp.nombre} />
                      <Text numberOfLines={1}>{emp.nombre}</Text>
                    </View>
                  </SaCell>
                  {!compact ? (
                    <>
                      <SaCell><Text numberOfLines={1}>{emp.codigo}</Text></SaCell>
                      <SaCell><Text numberOfLines={1}>{emp.plan}</Text></SaCell>
                    </>
                  ) : (
                    <SaCell><MaterialIcons name="chevron-right" size={20} /></SaCell>
                  )}
                </SaTableRow>
              ))}
              {empresasFiltradas.length === 0 ? <Text>No se encontraron empresas.</Text> : null}
            </SaSectionCard>
          </>
        ) : (
          <>
            <View>
              <TouchableOpacity onPress={() => { setSelectedCompanyId(null); setBusqueda(''); }}>
                <MaterialIcons name="arrow-back" size={18} />
                <Text>Volver a empresas</Text>
              </TouchableOpacity>

              <View>
                <MaterialIcons name="search" size={20} />
                <TextInput
                  value={busqueda}
                  onChangeText={setBusqueda}
                  placeholder="Buscar empleado por nombre o correo"
                />
              </View>
            </View>

            <SaSectionCard theme={theme} title={`Empleados de ${empresaNombre(selectedCompanyId)}`}>
              <View>
                {FILTROS_ESTADO.map((item) => (
                  <SaFilterPill key={item.value} theme={theme} label={item.label} active={filtroEstado === item.value} onPress={() => setFiltroEstado(item.value)} />
                ))}
              </View>

              {state === 'loading' ? (
                <View>
                  {[0, 1, 2].map((i) => <View key={i} />)}
                </View>
              ) : (
                <>
                  {!compact && usuariosFiltrados.length > 0 ? (
                    <SaTableHeader theme={theme} columns={[{ label: 'NOMBRE', flex: 2 }, { label: 'ROL' }, { label: 'ESTADO' }]} />
                  ) : null}
                  {usuariosFiltrados.map((u, i) => {
                    const estado = etiquetaEstadoUsuario(u);
                    return (
                      <SaTableRow key={u.id} theme={theme} last={i === usuariosFiltrados.length - 1} onPress={() => setDetalleId(u.id)}>
                        <SaCell flex={2}>
                          <View>
                            <SaAvatarChip name={u.nombre} round />
                            <View>
                              <Text numberOfLines={1}>{u.nombre}{u.esPropietario ? ' · Propietario' : ''}</Text>
                              <Text numberOfLines={1}>{u.correo}</Text>
                            </View>
                          </View>
                        </SaCell>
                        {!compact ? (
                          <>
                            <SaCell><SaStatusIndicator theme={theme} label={etiquetaRol(u.rol)} tone="neutral" /></SaCell>
                            <SaCell><SaStatusIndicator theme={theme} label={estado} tone={estadoTone(estado)} /></SaCell>
                          </>
                        ) : (
                          <SaCell><SaStatusIndicator theme={theme} label={estado} tone={estadoTone(estado)} /></SaCell>
                        )}
                      </SaTableRow>
                    );
                  })}
                  {usuariosFiltrados.length === 0 ? <Text>Esta empresa aún no tiene usuarios registrados con este estado.</Text> : null}
                  {hayMas ? (
                    <TouchableOpacity onPress={cargarMas} disabled={cargandoMas}>
                      {cargandoMas ? <ActivityIndicator /> : <Text>Cargar más empleados</Text>}
                    </TouchableOpacity>
                  ) : null}
                </>
              )}
            </SaSectionCard>
          </>
        )}
      </View>

      {/* Modal: detalle de usuario */}
      <AdminModal visible={Boolean(detalleId)} onRequestClose={cerrarDetalle} transparent>
        <View>
          <AdminModalFormGlass>
            <View>
              <Text numberOfLines={1}>{detalle?.nombre || 'Usuario'}</Text>
              <TouchableOpacity onPress={cerrarDetalle}><MaterialIcons name="close" size={16} /></TouchableOpacity>
            </View>
            <View>
              <TouchableOpacity onPress={() => setPestana('datos')}>
                <Text>Datos</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPestana('acciones')}>
                <Text>Acciones y Acceso</Text>
              </TouchableOpacity>
            </View>

            {avisoAccion ? <Text>{avisoAccion}</Text> : null}

            <ScrollView showsVerticalScrollIndicator={false}>
              {pestana === 'datos' && detalle ? (
                <View>
                  <Text>Correo: {detalle.correo}</Text>
                  <Text>Empresa: {empresaNombre(detalle.empresaId)} ({detalle.empresaId})</Text>
                  <Text>Nombre</Text>
                  <TextInput value={formEdicion.nombre} onChangeText={(v) => setFormEdicion((f) => ({ ...f, nombre: v }))} />
                  <Text>Rol</Text>
                  <View>
                    {ROLE_OPTIONS.map((rol) => (
                      <TouchableOpacity key={rol.value} onPress={() => setFormEdicion((f) => ({ ...f, rol: rol.value }))}>
                        <Text>{rol.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity onPress={guardarEdicion} disabled={accionEnCurso === 'editar'}>
                    <Text>{accionEnCurso === 'editar' ? 'Guardando…' : 'Guardar cambios'}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {pestana === 'acciones' && detalle ? (
                <View>
                  <Text>Estado en la empresa</Text>
                  <View>
                    {detalle.activo ? (
                      <TouchableOpacity onPress={() => cambiarEstado('suspender')} disabled={!!accionEnCurso}>
                        <Text>{accionEnCurso === 'suspender' ? 'Aplicando…' : 'Suspender'}</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={() => cambiarEstado('reactivar')} disabled={!!accionEnCurso}>
                        <Text>{accionEnCurso === 'reactivar' ? 'Aplicando…' : 'Reactivar'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text>Autenticación</Text>
                  <Text>Banear impide que el usuario inicie sesión. Resetear contraseña genera un enlace por correo o fuerza una contraseña temporal.</Text>
                  <View>
                    {detalle.baneado ? (
                      <TouchableOpacity onPress={() => cambiarBaneo(false)} disabled={!!accionEnCurso}>
                        <Text>{accionEnCurso === 'desbanear' ? 'Aplicando…' : 'Desbanear'}</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={() => cambiarBaneo(true)} disabled={!!accionEnCurso}>
                        <Text>{accionEnCurso === 'banear' ? 'Aplicando…' : 'Banear'}</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => { setResetParams({ mode: 'link', tempPassword: '' }); setModalReset(true); }} disabled={!!accionEnCurso}>
                      <Text>{accionEnCurso === 'reset' ? 'Aplicando…' : 'Resetear contraseña'}</Text>
                    </TouchableOpacity>
                  </View>

                  <Text>Zona de peligro</Text>
                  <Text>Borra la cuenta del usuario permanentemente (solo del Auth, sus registros quedan huérfanos).</Text>
                  <TouchableOpacity onPress={() => setConfirmarEliminar(true)}>
                    <Text>Eliminar cuenta</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </ScrollView>
          </AdminModalFormGlass>
        </View>
      </AdminModal>

      {/* Modal: reset password */}
      <AdminModal visible={modalReset} onRequestClose={() => setModalReset(false)} transparent>
        <View>
          <AdminModalFormGlass>
            <View>
              <Text>Resetear contraseña</Text>
              <TouchableOpacity onPress={() => setModalReset(false)}><MaterialIcons name="close" size={16} /></TouchableOpacity>
            </View>
            <View>
              <View>
                <TouchableOpacity onPress={() => setResetParams((p) => ({ ...p, mode: 'link' }))}>
                  <Text>Enviar link</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setResetParams((p) => ({ ...p, mode: 'set' }))}>
                  <Text>Clave temporal</Text>
                </TouchableOpacity>
              </View>
              {resetParams.mode === 'link' ? (
                <Text>Se enviará un correo a {detalle?.correo} con un enlace seguro de Firebase para que el usuario elija su nueva contraseña.</Text>
              ) : (
                <>
                  <Text>Escribe la nueva contraseña manualmente. Si el usuario intenta entrar de inmediato, funcionará.</Text>
                  <TextInput value={resetParams.tempPassword} onChangeText={(v) => setResetParams((p) => ({ ...p, tempPassword: v }))} placeholder="Nueva contraseña (mín 6 chars)" secureTextEntry />
                </>
              )}
              <TouchableOpacity onPress={aplicarReset}>
                <Text>Confirmar reset</Text>
              </TouchableOpacity>
            </View>
          </AdminModalFormGlass>
        </View>
      </AdminModal>

      <SaConfirmarEliminacion
        visible={confirmarEliminar}
        theme={modalTheme}
        titulo="Eliminar cuenta"
        mensaje="Esta acción borra la cuenta en Firebase Auth. Sus datos seguirán existiendo referenciados a su ID, pero no podrá iniciar sesión nunca más."
        nombreEsperado={detalle?.correo || ''}
        procesando={accionEnCurso === 'eliminar'}
        onCancelar={() => setConfirmarEliminar(false)}
        onConfirmar={() => ejecutarAccion('eliminar', () => useCases.admin.superAdmin.deleteUser(detalle!.id, detalle!.correo))}
      />
    </ScrollView>
  );
}
