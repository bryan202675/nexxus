import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, useWindowDimensions, DeviceEventEmitter } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/presentation/hooks/useAuth';
import {
  SaIconGlobe,
  SaIconBuilding,
  SaIconUsers,
  SaIconSparkles,
  SaIconCard,
  SaIconAudit,
  SaIconSupport,
  SaIconSliders,
  SaIconSearch,
  SaIconBell,
  SaIconSun,
  SaIconMoon
} from './components/SaIcons';
import { useAdminAppearance } from '../admin/adminTheme';
import { SaHeroBanner } from './components/SaWidgets';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
  currentRoute: string;
}

const HERO_COPY: Record<string, { eyebrow: string; title: string; subtitle: string }> = {
  SaResumen: { eyebrow: 'NEXXUS PLATFORM', title: 'Resumen global', subtitle: 'Empresas, usuarios, planes e ingresos de toda la plataforma en un solo panel.' },
  SaEmpresas: { eyebrow: 'NEXXUS PLATFORM', title: 'Empresas', subtitle: 'Administra las organizaciones registradas, sus planes y su estado.' },
  SaUsuarios: { eyebrow: 'NEXXUS PLATFORM', title: 'Usuarios', subtitle: 'Propietarios, jefes y empleados de todas las empresas activas.' },
  SaNexxusIA: { eyebrow: 'NEXXUS PLATFORM', title: 'Nexxus AI', subtitle: 'Uso del asistente inteligente en toda la plataforma.' },
  SaPagosPlanes: { eyebrow: 'NEXXUS PLATFORM', title: 'Pagos y planes', subtitle: 'Suscripciones, facturación e ingresos por plan.' },
  SaAuditoria: { eyebrow: 'NEXXUS PLATFORM', title: 'Auditoría', subtitle: 'Registro de eventos y cambios críticos de la plataforma.' },
  SaSoporte: { eyebrow: 'NEXXUS PLATFORM', title: 'Soporte', subtitle: 'Sesiones de soporte auditadas para las empresas clientes.' },
  SaConfiguracion: { eyebrow: 'NEXXUS PLATFORM', title: 'Configuración', subtitle: 'Preferencias de cuenta, apariencia y seguridad del panel.' },
};

export default function SuperAdminLayout({ children, currentRoute }: SuperAdminLayoutProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const avatarInitial = (user?.nombre || 'N').charAt(0).toUpperCase();

  const { mode: globalMode, toggleMode: globalToggleMode } = useAdminAppearance();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const toggleDark = () => {
    if (globalToggleMode) globalToggleMode();
  };

  const navItems = [
    { key: 'SaResumen', label: 'Resumen global', icon: SaIconGlobe },
    { key: 'SaEmpresas', label: 'Empresas', icon: SaIconBuilding },
    { key: 'SaUsuarios', label: 'Usuarios', icon: SaIconUsers },
    { key: 'SaNexxusIA', label: 'Nexxus AI', icon: SaIconSparkles },
    { key: 'SaPagosPlanes', label: 'Pagos y planes', icon: SaIconCard },
    { key: 'SaAuditoria', label: 'Auditoría', icon: SaIconAudit },
    { key: 'SaSoporte', label: 'Soporte', icon: SaIconSupport },
    { key: 'SaConfiguracion', label: 'Configuración', icon: SaIconSliders },
  ];

  const handleNav = (route: string) => {
    navigation.navigate('AppAdmin', { screen: route });
    setMobileNavOpen(false);
  };

  const renderSidebar = () => (
    <View>
      <View>
        <View>
          <Text>N</Text>
        </View>
        <View>
          <Text>Nexxus</Text>
          <Text>PLATFORM CONTROL</Text>
        </View>
      </View>

      <View>
        <Text>NEXXUS OS</Text>
        <Text>Nexxus Platform</Text>
        <View>
          <View />
          <Text>Nexxus Cloud</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {navItems.map(item => {
          const IconComponent = item.icon;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => handleNav(item.key)}
            >
              <IconComponent size={18} />
              <Text>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View>
        <View>
          <Text>NE</Text>
        </View>
        <View>
          <Text>Nexxus Super Admin</Text>
          <Text>SUPER ADMIN</Text>
        </View>
      </View>
    </View>
  );

  const TopbarContent = () => (
    <View>
      {isMobile ? (
        <TouchableOpacity onPress={() => setMobileNavOpen(true)}>
          <View>
            <SaIconSun size={20} />
          </View>
        </TouchableOpacity>
      ) : null}
      <View>
        <Text numberOfLines={1}>Bienvenido, {user?.nombre?.split(' ')[0] || 'Nexxus'}</Text>
        <Text numberOfLines={1}>Datos vivos y módulos sincronizados</Text>
      </View>

      <View>
        <View>
          <SaIconSearch size={13} />
        </View>
        <TextInput
          placeholder="Buscar en admin"
        />
      </View>

      <View>
        <TouchableOpacity onPress={toggleDark}>
          <View>
            {globalMode === 'dark' ? <SaIconSun size={17} /> : <SaIconMoon size={17} />}
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => DeviceEventEmitter.emit('openAdminProfile')}>
          <View>
            <SaIconBell size={17} />
            <View />
          </View>
        </TouchableOpacity>
        <View>
          <Text>{avatarInitial}</Text>
        </View>
      </View>
    </View>
  );

  const renderTopbar = () => (
    <View>
      <TopbarContent />
    </View>
  );

  const hero = HERO_COPY[currentRoute] || HERO_COPY.SaResumen;

  if (isMobile) {
    return (
      <View>
        {renderTopbar()}
        <View>
          <SaHeroBanner eyebrow={hero.eyebrow} title={hero.title} subtitle={hero.subtitle} compact />
        </View>
        <View>
          {children}
        </View>
        {mobileNavOpen ? (
          <View>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setMobileNavOpen(false)}
            />
            {renderSidebar()}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View>
      {renderSidebar()}
      <View>
        {renderTopbar()}
        <View>
          <SaHeroBanner eyebrow={hero.eyebrow} title={hero.title} subtitle={hero.subtitle} />
        </View>
        <View>
          {children}
        </View>
      </View>
    </View>
  );
}
