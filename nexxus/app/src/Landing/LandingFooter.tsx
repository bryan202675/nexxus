import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../shared/i18n/config';

type LandingFooterProps = {
  onSection?: (id: string) => void;
};

function navigateTo(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new Event('nexxus:navigate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollLandingSection(id: string, onSection?: (id: string) => void) {
  if (onSection) {
    onSection(id);
    return;
  }

  navigateTo('/landing');
  window.setTimeout(() => {
    const element = document.getElementById(id);
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top, behavior: 'smooth' });
  }, 80);
}

function FooterIcon({ name }: { name: 'mail' | 'shield' }) {
  const paths = {
    mail: ['M4 6h16v12H4z', 'M4 7l8 6 8-6'],
    shield: ['M12 2l8 4v6c0 5-3.3 8.6-8 10-4.7-1.4-8-5-8-10V6l8-4z', 'M9 12l2 2 4-5'],
  };

  return (
    <svg className="nx-footer-icon" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      {paths[name].map((path) => (
        <path d={path} key={path} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} />
      ))}
    </svg>
  );
}

export default function LandingFooter({ onSection }: LandingFooterProps) {
  const { t, i18n } = useTranslation();

  return (
    <footer className="nx-footer">
      <div className="nx-footer-topline" />
      <div className="nx-footer-main">
        <div className="nx-footer-brand">
          <strong>Nexxus</strong>
          <p>Plataforma inteligente para operar personas, procesos y decisiones desde un solo lugar.</p>
          <div className="nx-footer-trust">
            <FooterIcon name="shield" />
            <span>
              <b>Operación segura.</b>
              <small>Datos protegidos. Confianza empresarial.</small>
            </span>
          </div>
        </div>

        <nav className="nx-footer-column" aria-label="Producto">
          <h3>Producto</h3>
          <button onClick={() => scrollLandingSection('sistema', onSection)}>Sistema</button>
          <button onClick={() => scrollLandingSection('modulos', onSection)}>Módulos</button>
          <button onClick={() => scrollLandingSection('admin', onSection)}>Administrador</button>
          <button onClick={() => scrollLandingSection('ia', onSection)}>Nexxus IA</button>
        </nav>

        <nav className="nx-footer-column" aria-label="Planes">
          <h3>Planes</h3>
          <button onClick={() => scrollLandingSection('planes', onSection)}>Precios</button>
          <button onClick={() => scrollLandingSection('planes', onSection)}>Comparar planes</button>
          <button onClick={() => navigateTo('/landing/registro')}>Registrarse</button>
        </nav>

        <nav className="nx-footer-column" aria-label="Recursos">
          <h3>Recursos</h3>
          <button onClick={() => navigateTo('/landing/soporte')}>Centro de ayuda</button>
          <a href="mailto:soporte@nexxus.app?subject=Soporte%20Nexxus">Soporte técnico</a>
          <a href="mailto:facturacion@nexxus.app?subject=Facturacion%20Nexxus">Facturación</a>
        </nav>

        <nav className="nx-footer-column" aria-label="Empresa">
          <h3>Empresa</h3>
          <button onClick={() => navigateTo('/landing/seguridad')}>{t('landing.footer_security')}</button>
          <button onClick={() => navigateTo('/landing/privacidad')}>{t('landing.footer_privacy')}</button>
          <button onClick={() => navigateTo('/landing/soporte')}>{t('landing.footer_contact')}</button>
          <button onClick={() => navigateTo('/landing/login')}>{t('landing.login')}</button>
          <a href="http://localhost:3000/workspace/auth/sa-login">Nexxus admin</a>
        </nav>

        <div className="nx-footer-contact">
          <h3>Contacto</h3>
          <a href="mailto:soporte@nexxus.app?subject=Contacto%20Nexxus">
            <FooterIcon name="mail" />
            soporte@nexxus.app
          </a>
          <a href="mailto:ventas@nexxus.app?subject=Ventas%20Nexxus">
            <FooterIcon name="mail" />
            ventas@nexxus.app
          </a>
          <div className="nx-footer-lang" aria-label={t('common.language')}>
            <span>{t('common.language')}</span>
            <button className={i18n.language === 'es' ? 'active' : ''} onClick={() => changeLanguage('es')}>ES</button>
            <button className={i18n.language === 'en' ? 'active' : ''} onClick={() => changeLanguage('en')}>EN</button>
          </div>
        </div>
      </div>

      <div className="nx-footer-bottom">
        <span>© 2026 Nexxus. Todos los derechos reservados.</span>
        <span>{t('landing.footer_tagline')}</span>
      </div>
    </footer>
  );
}
