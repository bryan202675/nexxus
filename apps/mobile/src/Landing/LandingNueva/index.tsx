import { useEffect, useState } from 'react';
import { siteData } from './config/site-data';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Admin from './components/Admin';
import Implementation from './components/Implementation';
import Pricing from './components/Pricing';
import AIShowcase from './components/AIShowcase';
import FinalCta from './components/FinalCta';
import Footer from './components/Footer';
import './LandingNueva.css';

const SECTION_IDS = ['hero', 'sistema', 'modulos', 'admin', 'planes', 'ia'];

function scrollToId(id: string) {
  const element = document.getElementById(id);
  if (!element) return;
  const top = element.getBoundingClientRect().top + window.scrollY - 96;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

function goToAuth(plan = 'Business') {
  const params = new URLSearchParams({ plan });
  window.history.pushState({}, '', `/landing/registro?${params.toString()}`);
  window.dispatchEvent(new Event('nexxus:navigate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export default function LandingNueva() {
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    document.title = siteData.meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', siteData.meta.description);

    const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (!visible.length) return;
        visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5] },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="nxn-page">
      <Navbar activeSection={activeSection} onNavigate={scrollToId} onCta={() => goToAuth()} />

      <Hero onPrimaryCta={() => goToAuth()} onSecondaryCta={() => scrollToId('planes')} />

      <Features
        id="sistema"
        eyebrow={siteData.system.eyebrow}
        title={siteData.system.title}
        text={siteData.system.text}
        cards={siteData.system.cards}
        columns={3}
        numbered
      />

      <Features
        id="modulos"
        eyebrow={siteData.modules.eyebrow}
        title={siteData.modules.title}
        text={siteData.modules.text}
        cards={siteData.modules.cards}
        columns={4}
      />

      <Admin />

      <Features
        id="seguridad"
        eyebrow={siteData.security.eyebrow}
        title={siteData.security.title}
        text={siteData.security.text}
        cards={siteData.security.cards}
        columns={4}
      />

      <Implementation />

      <Pricing onChoosePlan={(plan) => goToAuth(plan)} />

      <AIShowcase />

      <FinalCta onCta={() => goToAuth()} />

      <Footer onNavigate={scrollToId} />
    </div>
  );
}
