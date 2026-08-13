/**
 * Documentacion Nexxus - apps/mobile/src/Landing/BorderGlow.tsx
 * Capa: landing.
 * Proposito: Pantalla o recurso visual del flujo publico de autenticacion/landing. Centraliza la presentacion inicial antes de entrar a la app privada.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

import React, { CSSProperties, ReactNode, useCallback, useEffect, useMemo, useRef, memo } from 'react';
import './BorderGlow.css';

type BorderGlowProps = {
  animated?: boolean;
  backgroundColor?: string;
  borderRadius?: number;
  children?: ReactNode;
  className?: string;
  colors?: string[];
  coneSpread?: number;
  edgeSensitivity?: number;
  fillOpacity?: number;
  glowColor?: string;
  glowIntensity?: number;
  glowRadius?: number;
};

// =========================================================================
// Helpers: color y gradiente (variables CSS del glow y del fondo)
// =========================================================================

function parseHSL(hslStr: string) {
  const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
  if (!match) return { h: 40, s: 80, l: 80 };
  return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
}

function buildGlowVars(glowColor: string, intensity: number) {
  const { h, s, l } = parseHSL(glowColor);
  const base = `${h}deg ${s}% ${l}%`;
  const opacities = [100, 60, 50, 40, 30, 20, 10];
  const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10'];
  const vars: Record<string, string> = {};
  for (let i = 0; i < opacities.length; i += 1) {
    vars[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(opacities[i] * intensity, 100)}%)`;
  }
  return vars;
}

const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
const GRADIENT_KEYS = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven'];
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

function buildGradientVars(colors: string[]) {
  const vars: Record<string, string> = {};
  for (let i = 0; i < 7; i += 1) {
    const color = colors[Math.min(COLOR_MAP[i], colors.length - 1)];
    vars[GRADIENT_KEYS[i]] = `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${color} 0px, transparent 50%)`;
  }
  vars['--gradient-base'] = `linear-gradient(${colors[0]} 0 100%)`;
  return vars;
}

// =========================================================================
// Helpers: easing y animacion por tiempo (usados en el "sweep" de entrada)
// =========================================================================

function easeOutCubic(x: number) {
  return 1 - Math.pow(1 - x, 3);
}

function easeInCubic(x: number) {
  return x * x * x;
}

function animateValue({
  delay = 0,
  duration = 1000,
  ease = easeOutCubic,
  end = 100,
  onEnd,
  onUpdate,
  start = 0,
}: {
  delay?: number;
  duration?: number;
  ease?: (x: number) => number;
  end?: number;
  onEnd?: () => void;
  onUpdate: (value: number) => void;
  start?: number;
}) {
  let cancelado = false;
  let frame = 0;
  let timeout = 0;
  const t0 = performance.now() + delay;
  function tick() {
    if (cancelado) return;
    const elapsed = performance.now() - t0;
    const t = Math.min(elapsed / duration, 1);
    onUpdate(start + (end - start) * ease(t));
    if (t < 1) frame = requestAnimationFrame(tick);
    else onEnd?.();
  }
  timeout = window.setTimeout(() => {
    frame = requestAnimationFrame(tick);
  }, delay);
  return () => {
    cancelado = true;
    window.clearTimeout(timeout);
    if (frame) cancelAnimationFrame(frame);
  };
}

function canUsePointerGlow() {
  return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

// =========================================================================
// Componente principal
// =========================================================================

const BorderGlow = memo(function BorderGlow({
  animated = false,
  backgroundColor = 'rgba(18, 15, 23, 0.78)',
  borderRadius = 28,
  children,
  className = '',
  colors = ['#c084fc', '#f472b6', '#38bdf8'],
  coneSpread = 25,
  edgeSensitivity = 34,
  fillOpacity = 0,
  glowColor = '268 90 72',
  glowIntensity = 0.85,
  glowRadius = 28,
}: BorderGlowProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const pointerGlowEnabled = useMemo(canUsePointerGlow, []);

  // -- Geometria del cursor respecto a la tarjeta ---------------------------

  const getCenterOfRect = useCallback((rect: DOMRect) => {
    const { width, height } = rect;
    return [width / 2, height / 2];
  }, []);

  const getEdgeProximity = useCallback((rect: DOMRect, x: number, y: number) => {
    const [cx, cy] = getCenterOfRect(rect);
    const dx = x - cx;
    const dy = y - cy;
    let kx = Infinity;
    let ky = Infinity;
    if (dx !== 0) kx = cx / Math.abs(dx);
    if (dy !== 0) ky = cy / Math.abs(dy);
    return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
  }, [getCenterOfRect]);

  const getCursorAngle = useCallback((rect: DOMRect, x: number, y: number) => {
    const [cx, cy] = getCenterOfRect(rect);
    const dx = x - cx;
    const dy = y - cy;
    if (dx === 0 && dy === 0) return 0;
    const radians = Math.atan2(dy, dx);
    let degrees = radians * (180 / Math.PI) + 90;
    if (degrees < 0) degrees += 360;
    return degrees;
  }, [getCenterOfRect]);

  // -- Eventos de puntero ----------------------------------------------------

  const handlePointerEnter = useCallback(() => {
    if (!pointerGlowEnabled || !cardRef.current) return;
    rectRef.current = cardRef.current.getBoundingClientRect();
  }, [pointerGlowEnabled]);

  const handlePointerLeave = useCallback(() => {
    rectRef.current = null;
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--edge-proximity', '0');
  }, []);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card || !pointerGlowEnabled) return;

    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const rect = rectRef.current ?? card.getBoundingClientRect();
      rectRef.current = rect;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const edge = getEdgeProximity(rect, x, y);
      const angle = getCursorAngle(rect, x, y);
      card.style.setProperty('--edge-proximity', `${(edge * 100).toFixed(3)}`);
      card.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
      frameRef.current = null;
    });
  }, [getCursorAngle, getEdgeProximity, pointerGlowEnabled]);

  // -- Animacion de entrada ("sweep") -----------------------------------------

  useEffect(() => {
    if (!animated || !cardRef.current || !pointerGlowEnabled) return;
    const card = cardRef.current;
    const angleStart = 110;
    const angleEnd = 465;
    card.classList.add('sweep-active');
    card.style.setProperty('--cursor-angle', `${angleStart}deg`);

    const stops = [
      animateValue({ duration: 500, onUpdate: (value) => card.style.setProperty('--edge-proximity', `${value}`) }),
      animateValue({
        duration: 1500,
        ease: easeInCubic,
        end: 50,
        onUpdate: (value) => card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (value / 100) + angleStart}deg`),
      }),
      animateValue({
        delay: 1500,
        duration: 2250,
        ease: easeOutCubic,
        end: 100,
        start: 50,
        onUpdate: (value) => card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (value / 100) + angleStart}deg`),
      }),
      animateValue({
        delay: 2500,
        duration: 1500,
        ease: easeInCubic,
        end: 0,
        onEnd: () => card.classList.remove('sweep-active'),
        onUpdate: (value) => card.style.setProperty('--edge-proximity', `${value}`),
        start: 100,
      }),
    ];
    return () => {
      stops.forEach((stop) => stop());
      card.classList.remove('sweep-active');
    };
  }, [animated, pointerGlowEnabled]);

  useEffect(() => () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  }, []);

  useEffect(() => {
    if (!pointerGlowEnabled) return;
    const clearRect = () => {
      rectRef.current = null;
    };
    window.addEventListener('resize', clearRect);
    window.addEventListener('scroll', clearRect, { passive: true });
    return () => {
      window.removeEventListener('resize', clearRect);
      window.removeEventListener('scroll', clearRect);
    };
  }, [pointerGlowEnabled]);

  // -- Render ------------------------------------------------------------------

  return (
    <div
      className={`border-glow-card ${className}`}
      onPointerEnter={pointerGlowEnabled ? handlePointerEnter : undefined}
      onPointerLeave={pointerGlowEnabled ? handlePointerLeave : undefined}
      onPointerMove={pointerGlowEnabled ? handlePointerMove : undefined}
      ref={cardRef}
      style={{
        '--border-radius': `${borderRadius}px`,
        '--card-bg': backgroundColor,
        '--cone-spread': coneSpread,
        '--edge-sensitivity': edgeSensitivity,
        '--fill-opacity': fillOpacity,
        '--glow-padding': `${glowRadius}px`,
        ...buildGlowVars(glowColor, glowIntensity),
        ...buildGradientVars(colors),
      } as CSSProperties}
    >
      <span className="edge-light" />
      <div className="border-glow-inner">{children}</div>
    </div>
  );
});

export default BorderGlow;