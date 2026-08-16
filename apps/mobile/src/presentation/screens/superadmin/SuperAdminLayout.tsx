import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView, useWindowDimensions, DeviceEventEmitter } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText, AdminTranslatedTextInput } from '@/shared/i18n/AdminTranslatedText';
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

const Text = AdminTranslatedText;
const TextInput = AdminTranslatedTextInput;

interface SuperAdminLayoutProps {
  children: React.ReactNode;
  currentRoute: string;
}

export default function SuperAdminLayout({ children, currentRoute }: SuperAdminLayoutProps) {
  const { t } = useTranslation();
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

  const HERO_COPY: Record<string, { eyebrow: string; title: string; subtitle: string }> = {
    SaResumen: { eyebrow: t('superadmin.saLayout.hero.eyebrow'), title: t('superadmin.saLayout.hero.saResumen.titulo'), subtitle: t('superadmin.saLayout.hero.saResumen.subtitulo') },
    SaEmpresas: { eyebrow: t('superadmin.saLayout.hero.eyebrow'), title: t('superadmin.saLayout.hero.saEmpresas.titulo'), subtitle: t('superadmin.saLayout.hero.saEmpresas.subtitulo') },
    SaUsuarios: { eyebrow: t('superadmin.saLayout.hero.eyebrow'), title: t('superadmin.saLayout.hero.saUsuarios.titulo'), subtitle: t('superadmin.saLayout.hero.saUsuarios.subtitulo') },
    SaNexxusIA: { eyebrow: t('superadmin.saLayout.hero.eyebrow'), title: t('superadmin.saLayout.hero.saNexxusIA.titulo'), subtitle: t('superadmin.saLayout.hero.saNexxusIA.subtitulo') },
    SaPagosPlanes: { eyebrow: t('superadmin.saLayout.hero.eyebrow'), title: t('superadmin.saLayout.hero.saPagosPlanes.titulo'), subtitle: t('superadmin.saLayout.hero.saPagosPlanes.subtitulo') },
    SaAuditoria: { eyebrow: t('superadmin.saLayout.hero.eyebrow'), title: t('superadmin.saLayout.hero.saAuditoria.titulo'), subtitle: t('superadmin.saLayout.hero.saAuditoria.subtitulo') },
    SaSoporte: { eyebrow: t('superadmin.saLayout.hero.eyebrow'), title: t('superadmin.saLayout.hero.saSoporte.titulo'), subtitle: t('superadmin.saLayout.hero.saSoporte.subtitulo') },
    SaConfiguracion: { eyebrow: t('superadmin.saLayout.hero.eyebrow'), title: t('superadmin.saLayout.hero.saConfiguracion.titulo'), subtitle: t('superadmin.saLayout.hero.saConfiguracion.subtitulo') },
  };

  const navItems = [
    { key: 'SaResumen', label: t('superadmin.saLayout.nav.resumenGlobal'), icon: SaIconGlobe },
    { key: 'SaEmpresas', label: t('superadmin.saLayout.nav.empresas'), icon: SaIconBuilding },
    { key: 'SaUsuarios', label: t('superadmin.saLayout.nav.usuarios'), icon: SaIconUsers },
    { key: 'SaNexxusIA', label: t('superadmin.saLayout.nav.nexxusAI'), icon: SaIconSparkles },
    { key: 'SaPagosPlanes', label: t('superadmin.saLayout.nav.pagosPlanes'), icon: SaIconCard },
    { key: 'SaAuditoria', label: t('superadmin.saLayout.nav.auditoria'), icon: SaIconAudit },
    { key: 'SaSoporte', label: t('superadmin.saLayout.nav.soporte'), icon: SaIconSupport },
    { key: 'SaConfiguracion', label: t('superadmin.saLayout.nav.configuracion'), icon: SaIconSliders },
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
          <Text>{t('superadmin.saLayout.sidebar.marca')}</Text>
          <Text>{t('superadmin.saLayout.sidebar.platformControl')}</Text>
        </View>
      </View>

      <View>
        <Text>{t('superadmin.saLayout.sidebar.nexxusOS')}</Text>
        <Text>{t('superadmin.saLayout.sidebar.nexxusPlatform')}</Text>
        <View>
          <View />
          <Text>{t('superadmin.saLayout.sidebar.nexxusCloud')}</Text>
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
          <Text>{t('superadmin.saLayout.sidebar.superAdminNombre')}</Text>
          <Text>{t('superadmin.saLayout.sidebar.superAdminBadge')}</Text>
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
        <Text numberOfLines={1}>{t('superadmin.saLayout.topbar.bienvenido', { nombre: user?.nombre?.split(' ')[0] || 'Nexxus' })}</Text>
        <Text numberOfLines={1}>{t('superadmin.saLayout.topbar.datosVivos')}</Text>
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
