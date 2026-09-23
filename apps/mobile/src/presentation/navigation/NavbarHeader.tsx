/**
 * Documentacion Nexxus - apps/mobile/src/presentation/navigation/NavbarHeader.tsx
 * Capa: presentacion.
 * Proposito: Barra superior del panel de administracion (busqueda, notificaciones, perfil, banner), extraida de AdminNavigator.tsx.
 * Dependencias clave: useAdminSignals, NotificationPanel, AdminProfilePanel, BannerPantalla, adminNavigatorHelpers/Primitives.
 * Consideracion de mantenimiento: preservar las props (routeName/sidebarOpen/setSidebarOpen) que le pasa AdminNavigator.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions, DeviceEventEmitter } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Bell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '@/infrastructure/supabase/supabaseClient';
import { cloudinaryOptimizedUrl } from '@/infrastructure/storage/cloudinaryStorage';
import { isSuperAdminRole } from '@/shared/auth/roles';
import { AdminModalBackdrop } from '../screens/admin/AdminModalBackdrop';
import { useAdminAppearance } from '../screens/admin/adminTheme';
import { ADMIN_ROUTE_NAMES, getAdminSearchItems, getScreenBanners } from './adminMenuConfig';
import { crearEstilos } from './adminNavigatorStyles';
import {
  obtenerEmpresaId,
  obtenerFotoPerfil,
  normalizarBusquedaAdmin,
  AdminSearchResult,
  AdminSearchRecord,
} from './adminNavigatorHelpers';
import { BotonAnimado } from './adminNavigatorPrimitives';
import { useAdminSignals } from './useAdminSignals';
import { NotificationPanel } from './NotificationPanel';
import { AdminProfilePanel } from './AdminProfilePanel';
import { BannerPantalla } from './BannerPantalla';
import { useAdminToast } from '../screens/admin/adminToast';

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;

/**
 * Componente NavbarHeader. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export function NavbarHeader({ routeName, sidebarOpen, setSidebarOpen }: { routeName: string; sidebarOpen: boolean; setSidebarOpen: (o: boolean) => void }) {
  // Inicializa { t }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { t } = useTranslation();
  // Inicializa { user }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { user } = useAuth();
  // Declara navigation; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const navigation = useNavigation<any>();
  // Declara navigateAdmin; maneja la navegacion a pantallas del panel de admin (anidadas) o globales.
  const navigateAdmin = (route: string, params?: Record<string, any>) => {
    if (ADMIN_ROUTE_NAMES.includes(route)) {
      navigation.navigate('AppAdmin', { screen: route, params });
    } else {
      navigation.navigate(route, params);
    }
  };
  // Inicializa { theme, mode, toggleMode }; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const { theme, mode, toggleMode } = useAdminAppearance();
  const { width } = useWindowDimensions();
  const isMobileOrTablet = width < 1024;
  // Inicializa estilos; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const estilos = useMemo(() => crearEstilos(theme, width), [theme, width]);
  // Inicializa [searchValue, setSearchValue]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [searchValue, setSearchValue] = useState('');
  // Inicializa [searchFocused, setSearchFocused]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [searchFocused, setSearchFocused] = useState(false);
  // Inicializa [searchData, setSearchData]; agrupa datos reales para la busqueda global del admin.
  const [searchData, setSearchData] = useState<{
    empleados: AdminSearchRecord[];
    sedes: AdminSearchRecord[];
    departamentos: AdminSearchRecord[];
    cargos: AdminSearchRecord[];
  }>({ empleados: [], sedes: [], departamentos: [], cargos: [] });
  // Inicializa [notificationsOpen, setNotificationsOpen]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  // Inicializa [profileOpen, setProfileOpen]; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const [profileOpen, setProfileOpen] = useState(false);
  // Inicializa adminSignals; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const adminSignals = useAdminSignals(user);
  const adminToast = useAdminToast();
  const taskSignalsSeen = useRef<Set<string> | null>(null);
  const isSuperAdmin = isSuperAdminRole(user?.rol);
  // Inicializa entrada; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const entrada = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const taskIds = adminSignals.filter((item) => item.type === 'task').map((item) => item.id);
    if (taskSignalsSeen.current === null) {
      taskSignalsSeen.current = new Set(taskIds);
      return;
    }
    taskIds.filter((id) => !taskSignalsSeen.current?.has(id)).forEach((id) => {
      const signal = adminSignals.find((item) => item.id === id);
      if (signal) adminToast.success({ title: signal.title, description: signal.detail });
    });
    taskSignalsSeen.current = new Set(taskIds);
  }, [adminSignals, adminToast]);

  // Escuchar evento global para abrir el panel de perfil desde otras pantallas (ej. ConfiguracionAdmin)
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('openAdminProfile', () => {
      setProfileOpen(true);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  // Declaraciones de traducción dinámicas
  const welcomeMsgBase = `${t('common.welcome')}, {name}`;
  const syncStatus = 'Datos vivos y módulos sincronizados';
  const searchPlaceholder = 'Buscar en admin';

  useEffect(() => {
    const empresaId = obtenerEmpresaId(user);
    if (!empresaId) {
      setSearchData({ empleados: [], sedes: [], departamentos: [], cargos: [] });
      return;
    }

    const crearListener = (key: keyof typeof searchData, tabla: string) => {
      const run = async () => {
        const { data, error } = await supabase.from(tabla).select('*').eq('empresa_id', empresaId).limit(200);
        const items = tabla === 'cargos' ? (data || []).map((row: any) => ({ ...row, nombre: row.titulo })) : (data || []);
        setSearchData((actual) => ({ ...actual, [key]: error ? [] : items }));
      };
      run();
      const channel = supabase
        .channel(`admin-search:${tabla}:${empresaId}:${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: tabla, filter: `empresa_id=eq.${empresaId}` }, run)
        .subscribe();
      return () => supabase.removeChannel(channel);
    };

    const unsubs = [
      crearListener('empleados', 'usuarios'),
      crearListener('sedes', 'sedes'),
      crearListener('departamentos', 'departamentos'),
      crearListener('cargos', 'cargos'),
    ];

    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, [user]);

  // Devuelve el resultado de la operacion para que quien llama pueda continuar el flujo.
  useEffect(() => {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    Animated.timing(entrada, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrada]);

  // Declara avatar; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const avatar = (user?.nombre || 'Admin').substring(0, 1).toUpperCase();
  // Declara fotoPerfil; usa la imagen real del administrador cuando existe.
  const fotoPerfil = obtenerFotoPerfil(user);
  // Declara banners; set de banners según el rol de la sesión (para resolver el icono de cada resultado).
  const banners = useMemo(() => getScreenBanners(user?.rol), [user?.rol]);
  // Inicializa searchResults; combina rutas del admin con empleados, sedes, departamentos y cargos reales.
  const searchResults = useMemo<AdminSearchResult[]>(() => {
    const rutas = getAdminSearchItems(user?.rol)
    .map((item) => ({
      id: `route-${item.route}`,
      route: item.route,
      params: {},
      title: item.title,
      detail: item.detail,
      category: 'Módulo',
      icon: (banners[item.route]?.icon || 'apps') as keyof typeof MaterialIcons.glyphMap,
      keywords: `${item.title} ${item.detail}`,
    }));

    const empleados = searchData.empleados.map((empleado) => ({
      id: `empleado-${empleado.id || empleado.correo || empleado.nombre}`,
      route: 'GestionPlantilla',
      params: { adminSearch: { type: 'empleado', id: empleado.id, title: empleado.nombre || empleado.correo, sedeId: empleado.sedeId, sede: empleado.sede } },
      title: empleado.nombre || empleado.correo || 'Empleado',
      detail: [empleado.cargo, empleado.departamento, empleado.sede, empleado.correo].filter(Boolean).join(' · ') || 'Empleado de plantilla',
      category: 'Empleado',
      icon: 'person' as const,
      keywords: [empleado.nombre, empleado.correo, empleado.cargo, empleado.rol, empleado.departamento, empleado.sede].filter(Boolean).join(' '),
    }));

    const sedes = searchData.sedes.map((sede) => ({
      id: `sede-${sede.id || sede.nombre}`,
      route: 'EstructuraOrganizativa',
      params: { adminSearch: { type: 'sede', id: sede.id, title: sede.nombre } },
      title: sede.nombre || 'Sede',
      detail: [sede.ciudad, sede.pais, sede.direccion, sede.responsableNombre].filter(Boolean).join(' · ') || 'Sede empresarial',
      category: 'Sede',
      icon: 'corporate-fare' as const,
      keywords: [sede.nombre, sede.ciudad, sede.pais, sede.direccion, sede.responsableNombre].filter(Boolean).join(' '),
    }));

    const departamentos = searchData.departamentos.map((departamento) => ({
      id: `departamento-${departamento.id || departamento.nombre || departamento.name}`,
      route: 'EstructuraOrganizativa',
      params: { adminSearch: { type: 'departamento', id: departamento.id, title: departamento.nombre || departamento.name } },
      title: departamento.nombre || departamento.name || 'Departamento',
      detail: [departamento.sedeNombre, departamento.jefeNombre, departamento.manager].filter(Boolean).join(' · ') || 'Departamento organizativo',
      category: 'Departamento',
      icon: 'account-tree' as const,
      keywords: [departamento.nombre, departamento.name, departamento.sedeNombre, departamento.jefeNombre, departamento.manager].filter(Boolean).join(' '),
    }));

    const cargos = searchData.cargos.map((cargo) => ({
      id: `cargo-${cargo.id || cargo.nombre}`,
      route: 'EstructuraOrganizativa',
      params: { adminSearch: { type: 'cargo', id: cargo.id, title: cargo.nombre } },
      title: cargo.nombre || 'Cargo',
      detail: [cargo.departamentoNombre, cargo.nivel, cargo.descripcion].filter(Boolean).join(' · ') || 'Cargo de estructura',
      category: 'Cargo',
      icon: 'badge' as const,
      keywords: [cargo.nombre, cargo.departamentoNombre, cargo.nivel, cargo.descripcion].filter(Boolean).join(' '),
    }));

    const todos = [...rutas, ...empleados, ...sedes, ...departamentos, ...cargos];
    const term = normalizarBusquedaAdmin(searchValue);
    if (!term) return todos.slice(0, 6);
    return todos
      .filter((item) => normalizarBusquedaAdmin(`${item.title} ${item.detail} ${item.category} ${item.keywords}`).includes(term))
      .slice(0, 8);
  }, [user?.rol, banners, searchData, searchValue]);
  const mostrarSearchResults = searchFocused || searchValue.trim().length > 0;

  // Declara navigateSearch; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const navigateSearch = (item: AdminSearchResult) => {
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setSearchFocused(false);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setSearchValue('');
    // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
    navigateAdmin(item.route, item.params);
  };

  // Declara submitSearch; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const submitSearch = () => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (searchResults[0]) navigateSearch(searchResults[0]);
  };

  const renderSearchResultsPanel = () => (
    <View style={[estilos.searchResultsPanel, estilos.searchResultsOverlay]}>
      <ScrollView style={estilos.searchResultsScroll} contentContainerStyle={estilos.searchResultsContent} showsVerticalScrollIndicator>
        {searchResults.map((item) => (
        <TouchableOpacity key={item.id} activeOpacity={0.86} onPress={() => navigateSearch(item)} style={estilos.searchResultItem}>
            <View style={estilos.searchResultIcon}>
              <MaterialIcons name={item.icon as any} size={15} color={theme.text} />
            </View>
            <View style={estilos.searchResultCopy}>
              <View style={estilos.searchResultTop}>
                <Text style={estilos.searchResultTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={estilos.searchResultCategory}>{item.category}</Text>
              </View>
              <Text style={estilos.searchResultDetail} numberOfLines={1}>{item.detail}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {searchResults.length === 0 && (
          <View style={estilos.searchEmpty}>
            <Text style={estilos.searchResultDetail}>Sin resultados</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const screenTitle = banners[routeName]?.title || routeName;

  if (isMobileOrTablet && sidebarOpen) {
    return null;
  }

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
    <View pointerEvents="box-none" style={estilos.headerLayer}>
      {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <Animated.View style={[estilos.navbarContainer, { opacity: entrada, transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }) }] }]}>
        {/* Capa con desenfoque; crea efecto de superficie premium sin ocultar el fondo. */}
        <BlurView intensity={theme.isDark ? 34 : 46} tint={theme.navTint} style={estilos.navbarGlass}>
          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.navbarLeft}>
            {isMobileOrTablet && (
              <BotonAnimado style={{ marginRight: 8, padding: 4 }} onPress={() => setSidebarOpen(true)}>
                <MaterialIcons name="menu" size={20} color={theme.text} />
              </BotonAnimado>
            )}
            {!isMobileOrTablet && <View style={estilos.statusDot} />}
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.statusText}>{isMobileOrTablet ? screenTitle : welcomeMsgBase.replace('{name}', user?.nombre?.split(' ')[0] || 'Propietario')}</Text>
              {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
              <Text style={estilos.statusSubtext}>{isMobileOrTablet ? 'Nexxus Command' : syncStatus}</Text>
            </View>
          </View>

          {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
          <View style={estilos.navbarRight}>
            {/* Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion. */}
            <View style={estilos.searchWrap}>
              {/* Campo de entrada; captura texto del usuario y lo conecta con el estado del formulario. */}
              <TextInput
                value={searchValue}
                onChangeText={(value) => {
                  setSearchValue(value);
                  setSearchFocused(true);
                }}
                onFocus={() => setSearchFocused(true)}
                onSubmitEditing={submitSearch}
                placeholder={searchPlaceholder}
                placeholderTextColor={theme.soft}
                style={estilos.searchInput}
              />
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="search" size={16} color={theme.muted} />
            </View>
            {/* BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <BotonAnimado style={estilos.iconCircle} onPress={() => navigateAdmin('ConfiguracionAdmin')}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name="settings" size={17} color={theme.text} />
            </BotonAnimado>
            {/* BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <BotonAnimado style={estilos.iconCircle} onPress={toggleMode}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <MaterialIcons name={mode === 'dark' ? 'light-mode' : 'dark-mode'} size={17} color={theme.text} />
            </BotonAnimado>
            {/* BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <BotonAnimado style={estilos.iconCircle} onPress={() => setNotificationsOpen((value) => !value)}>
              {/* Icono visual; refuerza el significado de la accion, estado o categoria mostrada. */}
              <Bell size={17} color={theme.text} strokeWidth={2} />
              {adminSignals.length > 0 && <View style={estilos.notifDot} />}
            </BotonAnimado>
            {/* BotonAnimado renderiza una pieza visual reutilizable dentro de esta pantalla. */}
            <BotonAnimado style={estilos.avatarButton} onPress={() => setProfileOpen((value) => !value)}>
              {fotoPerfil ? (
                // Imagen visual; muestra foto, avatar, logo o recurso asociado a los datos de la pantalla.
                <Image source={{ uri: cloudinaryOptimizedUrl(fotoPerfil, 96) }} style={estilos.avatarButtonImage} />
              ) : (
                // Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza.
                <LinearGradient {...(Platform.OS === 'web' ? { className: 'nx-admin-contrast' } as any : {})} colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.avatarButtonGradient}>
                  {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
                  <Text style={estilos.avatarButtonText}>{avatar}</Text>
                </LinearGradient>
              )}
            </BotonAnimado>
          </View>
        </BlurView>
      </Animated.View>
        {!isMobileOrTablet && (notificationsOpen || profileOpen) ? (
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => { setNotificationsOpen(false); setProfileOpen(false); }}
            style={estilos.notificationsScrim}
          >
            <AdminModalBackdrop variant="scrim" />
          </TouchableOpacity>
        ) : null}
        <NotificationPanel visible={notificationsOpen} items={adminSignals} onNavigate={(route) => {
          // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
          setNotificationsOpen(false);
          // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
          navigateAdmin(route);
        }} onClose={() => setNotificationsOpen(false)} />
        <AdminProfilePanel visible={profileOpen} user={user} onNavigate={(route) => {
          // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
          setProfileOpen(false);
          // Ejecuta navegacion; cambia la pantalla activa manteniendo el flujo definido por React Navigation.
          navigateAdmin(route);
        }} onClose={() => setProfileOpen(false)} />
      {mostrarSearchResults && renderSearchResultsPanel()}
      {/* BannerPantalla renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      {!isMobileOrTablet && routeName !== 'ChatIAAdmin' && <BannerPantalla routeName={routeName} />}
    </View>
  );
}
