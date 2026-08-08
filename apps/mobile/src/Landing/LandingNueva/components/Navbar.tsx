import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { siteData } from '../config/site-data';

type NavbarProps = {
  activeSection: string;
  onNavigate: (id: string) => void;
  onCta: () => void;
};

export default function Navbar({ activeSection, onNavigate, onCta }: NavbarProps) {
  const [open, setOpen] = useState(false);

  const handleNavigate = (id: string) => {
    setOpen(false);
    onNavigate(id);
  };

  return (
    <motion.div
      className="nxn-navbar-layer"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
    >
      <nav className="nxn-navbar">
        <button className="nxn-brand" onClick={() => handleNavigate('hero')}>
          <span>N</span>
          {siteData.footer.brand}
        </button>

        <div className="nxn-nav-links">
          {siteData.nav.map((item) => (
            <button
              key={item.id}
              className={activeSection === item.id ? 'is-active' : ''}
              onClick={() => handleNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <motion.button
          className="nxn-btn nxn-btn-primary nxn-btn-sm"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCta}
        >
          Registrarse
        </motion.button>

        <button
          className="nxn-nav-mobile-toggle"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
        </button>
      </nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="nxn-mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'min(920px, calc(100% - 32px))',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              padding: 12,
              borderRadius: 20,
              border: '1px solid var(--nxn-border)',
              background: 'var(--nxn-panel-strong)',
              backdropFilter: 'blur(18px)',
            }}
          >
            {siteData.nav.map((item) => (
              <button
                key={item.id}
                className={activeSection === item.id ? 'is-active' : ''}
                onClick={() => handleNavigate(item.id)}
                style={{ textAlign: 'left', padding: '12px 14px' }}
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
