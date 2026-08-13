import { siteData } from '../config/site-data';

export default function Footer({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { footer } = siteData;

  return (
    <footer className="nxn-footer">
      <div className="nxn-footer-main">
        <span className="nxn-footer-brand">{footer.brand}</span>
        <nav className="nxn-footer-links" aria-label="Enlaces">
          <button onClick={() => onNavigate('sistema')}>{footer.links.product}</button>
          <button onClick={() => onNavigate('planes')}>{footer.links.plans}</button>
          <button onClick={() => onNavigate('seguridad')}>{footer.links.security}</button>
          <a href="mailto:soporte@nexxus.app">{footer.links.contact}</a>
          <button onClick={() => onNavigate('planes')}>{footer.links.privacy}</button>
        </nav>
      </div>
      <div className="nxn-footer-bottom">
        <span>© 2026 {footer.brand}. Todos los derechos reservados.</span>
        <span>{footer.tagline}</span>
      </div>
    </footer>
  );
}
