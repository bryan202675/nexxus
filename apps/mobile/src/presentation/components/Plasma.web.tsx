/**
 * Documentacion Nexxus - apps/mobile/src/presentation/components/Plasma.web.tsx
 * Capa: presentacion.
 * Proposito: Componente reutilizable de interfaz. Encapsula una pieza visual o interactiva para mantener consistencia entre pantallas.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React, { memo, useEffect, useRef } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { memo, useEffect, useRef } from 'react';
// Importa { Renderer, Program, Mesh, Triangle } desde ogl; agrega una dependencia externa necesaria para este modulo.
import { Renderer, Program, Mesh, Triangle } from 'ogl';
// Importa estilos CSS; aplica clases, animaciones o efectos visuales usados por este componente web.
import './Plasma.css';

/**
 * Describe la forma tipada DireccionPlasma; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type DireccionPlasma = 'forward' | 'reverse' | 'pingpong';

/**
 * Describe la forma tipada PlasmaProps; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type PlasmaProps = {
  color?: string;
  speed?: number;
  direction?: DireccionPlasma;
  scale?: number;
  opacity?: number;
  mouseInteractive?: boolean;
  fps?: number;
  resolutionScale?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Declaracion hexToRgb. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const hexToRgb = (hex: string) => {
  // Declara result; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!result) return [1, 0.5, 0.2];
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

/**
 * Declaracion vertex. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const vertex = `#version 300 es
precision highp float;
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

/**
 * Declaracion fragment. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uCustomColor;
uniform float uUseCustomColor;
uniform float uSpeed;
uniform float uDirection;
uniform float uScale;
uniform float uOpacity;
uniform vec2 uMouse;
uniform float uMouseInteractive;
out vec4 fragColor;

void mainImage(out vec4 o, vec2 C) {
  vec2 center = iResolution.xy * 0.5;
  C = (C - center) / uScale + center;

  vec2 mouseOffset = (uMouse - center) * 0.0002;
  C += mouseOffset * length(C - center) * step(0.5, uMouseInteractive);

  float d = 0.0;
  float z = 0.0;
  float T = iTime * uSpeed * uDirection;
  vec3 O = vec3(0.0);
  vec3 p;
  vec3 S;

  for (float i = 0.0; i < 36.0; i++) {
    vec2 r = iResolution.xy;
    vec2 Q;
    p = z * normalize(vec3(C - 0.5 * r, r.y));
    p.z -= 4.0;
    S = p;
    d = p.y - T;

    p.x += 0.4 * (1.0 + p.y) * sin(d + p.x * 0.1) * cos(0.34 * d + p.x * 0.05);
    Q = p.xz *= mat2(cos(p.y + vec4(0.0, 11.0, 33.0, 0.0) - T));
    z += d = abs(sqrt(length(Q * Q)) - 0.25 * (5.0 + S.y)) / 3.0 + 8e-4;
    o = 1.0 + sin(S.y + p.z * 0.5 + S.z - length(S - p) + vec4(2.0, 1.0, 0.0, 8.0));
    O += o.w / d * o.xyz;
  }

  o.xyz = tanh(O / 1e4);
}

bool finite1(float x){ return !(isnan(x) || isinf(x)); }
vec3 sanitize(vec3 c){
  return vec3(
    finite1(c.r) ? c.r : 0.0,
    finite1(c.g) ? c.g : 0.0,
    finite1(c.b) ? c.b : 0.0
  );
}

void main() {
  vec4 o = vec4(0.0);
  mainImage(o, gl_FragCoord.xy);
  vec3 rgb = sanitize(o.rgb);

  float intensity = (rgb.r + rgb.g + rgb.b) / 3.0;
  vec3 customColor = intensity * uCustomColor;
  vec3 auraColor = customColor * 1.85 + rgb * vec3(0.32, 0.16, 0.58);
  vec3 finalColor = mix(rgb, auraColor, step(0.5, uUseCustomColor));

  float alpha = clamp(max(length(rgb) * uOpacity * 1.8, 0.48 * uOpacity), 0.0, uOpacity);
  fragColor = vec4(finalColor, alpha);
}`;

/**
 * Componente Plasma. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function Plasma({
  color = '#ffffff',
  speed = 1,
  direction = 'forward',
  scale = 1,
  opacity = 1,
  mouseInteractive = false,
  fps = 60,
  resolutionScale = 0.62,
  className,
  style,
}: PlasmaProps) {
  // Inicializa containerRef; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Declara containerEl; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const containerEl = containerRef.current;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!containerEl || typeof window === 'undefined') return;

    // Declara useCustomColor; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const useCustomColor = color ? 1.0 : 0.0;
    // Declara customColorRgb; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const customColorRgb = color ? hexToRgb(color) : [1, 1, 1];
    // Declara directionMultiplier; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const directionMultiplier = direction === 'reverse' ? -1.0 : 1.0;
    // Declara escalaResolucion; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const escalaResolucion = Math.max(0.45, Math.min(resolutionScale, 1));
    // Declara dpr; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const dpr = Math.max(0.5, Math.min((window.devicePixelRatio || 1) * escalaResolucion, 1.15));
    // Declara intervaloFrame; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const intervaloFrame = 1000 / Math.max(30, Math.min(fps, 60));

    // Declara renderer; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let renderer: Renderer;
    // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
    try {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      renderer = new Renderer({
        webgl: 2,
        alpha: true,
        antialias: false,
        dpr,
      });
    } catch {
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return;
    }

    // Declara gl; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const gl = renderer.gl;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!gl) return;

    // Declara canvas; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const canvas = gl.canvas as HTMLCanvasElement;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    canvas.style.display = 'block';
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    canvas.style.width = '100%';
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    canvas.style.height = '100%';
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    containerEl.appendChild(canvas);

    // Declara geometry; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const geometry = new Triangle(gl);
    // Declara program; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Float32Array([1, 1]) },
        uCustomColor: { value: new Float32Array(customColorRgb) },
        uUseCustomColor: { value: useCustomColor },
        uSpeed: { value: speed * 0.4 },
        uDirection: { value: directionMultiplier },
        uScale: { value: scale },
        uOpacity: { value: opacity },
        uMouse: { value: new Float32Array([0, 0]) },
        uMouseInteractive: { value: mouseInteractive ? 1.0 : 0.0 },
      },
    });
    // Declara mesh; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const mesh = new Mesh(gl, { geometry, program });

    // Declara handleMouseMove; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const handleMouseMove = (event: MouseEvent) => {
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (!mouseInteractive) return;
      // Declara rect; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const rect = containerEl.getBoundingClientRect();
      // Declara mouseUniform; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const mouseUniform = program.uniforms.uMouse.value as Float32Array;
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      mouseUniform[0] = event.clientX - rect.left;
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      mouseUniform[1] = event.clientY - rect.top;
    };

    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (mouseInteractive) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      containerEl.addEventListener('mousemove', handleMouseMove);
    }

    // Declara setSize; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const setSize = () => {
      // Declara rect; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const rect = containerEl.getBoundingClientRect();
      // Declara width; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const width = Math.max(1, Math.floor(rect.width));
      // Declara height; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const height = Math.max(1, Math.floor(rect.height));
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      renderer.setSize(width, height);
      // Declara res; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const res = program.uniforms.iResolution.value as Float32Array;
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      res[0] = gl.drawingBufferWidth;
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      res[1] = gl.drawingBufferHeight;
    };

    // Declara ro; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const ro = new ResizeObserver(setSize);
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    ro.observe(containerEl);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setSize();

    // Declara raf; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let raf = 0;
    // Declara contextLost; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let contextLost = false;
    // Declara isVisible; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let isVisible = true;
    // Declara documentVisible; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let documentVisible = typeof document === 'undefined' ? true : !document.hidden;
    // Declara ultimoFrame; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let ultimoFrame = 0;
    // Declara t0; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const t0 = performance.now();

    // Declara loop; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const loop = (t: number) => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      raf = requestAnimationFrame(loop);
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (contextLost || !isVisible || !documentVisible) return;
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (t - ultimoFrame < intervaloFrame) return;
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      ultimoFrame = t;

      // Declara timeValue; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const timeValue = (t - t0) * 0.001;
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (direction === 'pingpong') {
        // Declara pingpongDuration; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const pingpongDuration = 10;
        // Declara segmentTime; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const segmentTime = timeValue % pingpongDuration;
        // Declara isForward; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const isForward = Math.floor(timeValue / pingpongDuration) % 2 === 0;
        // Declara u; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const u = segmentTime / pingpongDuration;
        // Declara smooth; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const smooth = u * u * (3 - 2 * u);
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        program.uniforms.uDirection.value = 1.0;
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        program.uniforms.iTime.value = isForward ? smooth * pingpongDuration : (1 - smooth) * pingpongDuration;
      } else {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        program.uniforms.iTime.value = timeValue;
      }

      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      renderer.render({ scene: mesh });
    };

    // Declara handleContextLost; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const handleContextLost = (event: Event) => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      event.preventDefault();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      contextLost = true;
    };

    // Declara handleContextRestored; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const handleContextRestored = () => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      contextLost = false;
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      setSize();
    };

    // Declara handleVisibility; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const handleVisibility = () => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      documentVisible = !document.hidden;
    };

    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    canvas.addEventListener('webglcontextlost', handleContextLost);
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    canvas.addEventListener('webglcontextrestored', handleContextRestored);
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    document.addEventListener('visibilitychange', handleVisibility);

    // Declara io; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const io = new IntersectionObserver(([entry]) => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      isVisible = entry.isIntersecting;
    }, { threshold: 0 });
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    io.observe(containerEl);

    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    raf = requestAnimationFrame(loop);

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      cancelAnimationFrame(raf);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      ro.disconnect();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      io.disconnect();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      document.removeEventListener('visibilitychange', handleVisibility);
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (mouseInteractive) {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        containerEl.removeEventListener('mousemove', handleMouseMove);
      }
      // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
      try {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      } catch {}
      // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
      try {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        containerEl.removeChild(canvas);
      } catch {}
    };
  }, [color, direction, fps, mouseInteractive, opacity, resolutionScale, scale, speed]);

  // Devuelve el JSX que React Native renderiza en pantalla.
  return <div ref={containerRef} className={['plasma-container', className].filter(Boolean).join(' ')} style={style} />;
}

export default memo(Plasma);
