/**
 * Documentacion Nexxus - nexxus/app/src/Landing/BorderGlow.tsx
 * Capa: landing.
 * Proposito: Pantalla o recurso visual del flujo publico de autenticacion/landing. Centraliza la presentacion inicial antes de entrar a la app privada.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa { CSSProperties, ReactNode, useCallback, useEffect, useRef } desde React; habilita componentes, hooks y tipos base para esta pieza.
import { CSSProperties, ReactNode, useCallback, useEffect, useRef } from 'react';
// Importa { createElement } desde React; habilita componentes, hooks y tipos base para esta pieza.
import { createElement } from 'react';
// Importa estilos CSS; aplica clases, animaciones o efectos visuales usados por este componente web.
import './BorderGlow.css';

/**
 * Describe la forma tipada BorderGlowProps; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
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

/**
 * Declaracion parseHSL. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function parseHSL(hslStr: string) {
  // Declara match; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!match) return { h: 40, s: 80, l: 80 };
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
}

/**
 * Declaracion buildGlowVars. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function buildGlowVars(glowColor: string, intensity: number) {
  // Declara { h, s, l }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const { h, s, l } = parseHSL(glowColor);
  // Declara base; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const base = `${h}deg ${s}% ${l}%`;
  // Declara opacities; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const opacities = [100, 60, 50, 40, 30, 20, 10];
  // Declara keys; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10'];
  // Declara vars; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const vars: Record<string, string> = {};
  // Recorre una coleccion para procesar cada elemento con la misma regla.
  for (let i = 0; i < opacities.length; i += 1) {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    vars[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(opacities[i] * intensity, 100)}%)`;
  }
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return vars;
}

/**
 * Componente GRADIENT_POSITIONS. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
/**
 * Componente GRADIENT_KEYS. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const GRADIENT_KEYS = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven'];
/**
 * Componente COLOR_MAP. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

/**
 * Declaracion buildGradientVars. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function buildGradientVars(colors: string[]) {
  // Declara vars; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const vars: Record<string, string> = {};
  // Recorre una coleccion para procesar cada elemento con la misma regla.
  for (let i = 0; i < 7; i += 1) {
    // Declara color; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const color = colors[Math.min(COLOR_MAP[i], colors.length - 1)];
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    vars[GRADIENT_KEYS[i]] = `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${color} 0px, transparent 50%)`;
  }
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  vars['--gradient-base'] = `linear-gradient(${colors[0]} 0 100%)`;
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return vars;
}

/**
 * Declaracion easeOutCubic. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function easeOutCubic(x: number) {
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return 1 - Math.pow(1 - x, 3);
}

/**
 * Declaracion easeInCubic. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function easeInCubic(x: number) {
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return x * x * x;
}

/**
 * Declaracion animateValue. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
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
  // Declara t0; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const t0 = performance.now() + delay;
  // tick agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
  function tick() {
    // Declara elapsed; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const elapsed = performance.now() - t0;
    // Declara t; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const t = Math.min(elapsed / duration, 1);
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    onUpdate(start + (end - start) * ease(t));
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (t < 1) requestAnimationFrame(tick);
    else onEnd?.();
  }
  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  setTimeout(() => requestAnimationFrame(tick), delay);
}

/**
 * Componente BorderGlow. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export default function BorderGlow({
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
  // Inicializa cardRef; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const cardRef = useRef<HTMLDivElement | null>(null);
  // Inicializa frameRef; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const frameRef = useRef<number | null>(null);

  // Inicializa getCenterOfElement; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const getCenterOfElement = useCallback((el: HTMLDivElement) => {
    // Declara { width, height }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const { width, height } = el.getBoundingClientRect();
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return [width / 2, height / 2];
  }, []);

  // Inicializa getEdgeProximity; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const getEdgeProximity = useCallback((el: HTMLDivElement, x: number, y: number) => {
    // Declara [cx, cy]; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const [cx, cy] = getCenterOfElement(el);
    // Declara dx; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const dx = x - cx;
    // Declara dy; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const dy = y - cy;
    // Declara kx; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let kx = Infinity;
    // Declara ky; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let ky = Infinity;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (dx !== 0) kx = cx / Math.abs(dx);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (dy !== 0) ky = cy / Math.abs(dy);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
  }, [getCenterOfElement]);

  // Inicializa getCursorAngle; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const getCursorAngle = useCallback((el: HTMLDivElement, x: number, y: number) => {
    // Declara [cx, cy]; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const [cx, cy] = getCenterOfElement(el);
    // Declara dx; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const dx = x - cx;
    // Declara dy; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const dy = y - cy;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (dx === 0 && dy === 0) return 0;
    // Declara radians; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const radians = Math.atan2(dy, dx);
    // Declara degrees; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let degrees = radians * (180 / Math.PI) + 90;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (degrees < 0) degrees += 360;
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return degrees;
  }, [getCenterOfElement]);

  // Inicializa handlePointerMove; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const handlePointerMove = useCallback((event: PointerEvent) => {
    // Declara card; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const card = cardRef.current;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!card) return;

    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    frameRef.current = requestAnimationFrame(() => {
      // Declara rect; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const rect = card.getBoundingClientRect();
      // Declara x; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const x = event.clientX - rect.left;
      // Declara y; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const y = event.clientY - rect.top;
      // Declara edge; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const edge = getEdgeProximity(card, x, y);
      // Declara angle; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const angle = getCursorAngle(card, x, y);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      card.style.setProperty('--edge-proximity', `${(edge * 100).toFixed(3)}`);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      card.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
    });
  }, [getCursorAngle, getEdgeProximity]);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!animated || !cardRef.current) return;
    // Declara card; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const card = cardRef.current;
    // Declara angleStart; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const angleStart = 110;
    // Declara angleEnd; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const angleEnd = 465;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    card.classList.add('sweep-active');
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    card.style.setProperty('--cursor-angle', `${angleStart}deg`);

    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    animateValue({ duration: 500, onUpdate: (value) => card.style.setProperty('--edge-proximity', `${value}`) });
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    animateValue({
      duration: 1500,
      ease: easeInCubic,
      end: 50,
      onUpdate: (value) => card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (value / 100) + angleStart}deg`),
    });
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    animateValue({
      delay: 1500,
      duration: 2250,
      ease: easeOutCubic,
      end: 100,
      start: 50,
      onUpdate: (value) => card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (value / 100) + angleStart}deg`),
    });
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    animateValue({
      delay: 2500,
      duration: 1500,
      ease: easeInCubic,
      end: 0,
      onEnd: () => card.classList.remove('sweep-active'),
      onUpdate: (value) => card.style.setProperty('--edge-proximity', `${value}`),
      start: 100,
    });
  }, [animated]);

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => () => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  }, []);

  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return createElement(
    'div',
    {
      className: `border-glow-card ${className}`,
      onPointerMove: handlePointerMove,
      ref: cardRef,
      style: {
        '--border-radius': `${borderRadius}px`,
        '--card-bg': backgroundColor,
        '--cone-spread': coneSpread,
        '--edge-sensitivity': edgeSensitivity,
        '--fill-opacity': fillOpacity,
        '--glow-padding': `${glowRadius}px`,
        ...buildGlowVars(glowColor, glowIntensity),
        ...buildGradientVars(colors),
      } as CSSProperties,
    },
    createElement('span', { className: 'edge-light' }),
    createElement('div', { className: 'border-glow-inner' }, children)
  );
}
