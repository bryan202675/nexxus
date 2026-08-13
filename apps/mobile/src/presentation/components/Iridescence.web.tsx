/**
 * Documentacion Nexxus - apps/mobile/src/presentation/components/Iridescence.web.tsx
 * Capa: presentacion.
 * Proposito: Componente reutilizable de interfaz. Encapsula una pieza visual o interactiva para mantener consistencia entre pantallas.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa { createElement, memo, useEffect, useMemo, useRef } desde React; habilita componentes, hooks y tipos base para esta pieza.
import { createElement, memo, useEffect, useMemo, useRef } from 'react';
// Importa { Renderer, Program, Mesh, Color, Triangle } desde ogl; agrega una dependencia externa necesaria para este modulo.
import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';
// Importa estilos CSS; aplica clases, animaciones o efectos visuales usados por este componente web.
import './Iridescence.css';

/**
 * Declaracion vertexShader. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

/**
 * Declaracion fragmentShader. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;

varying vec2 vUv;

void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;

  uv += (uMouse - vec2(0.5)) * uAmplitude;

  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
  gl_FragColor = vec4(col, 1.0);
}
`;

/**
 * Describe la forma tipada IridescenceProps; ayuda a que estados, props o respuestas mantengan una estructura predecible.
 */
type IridescenceProps = {
  color?: [number, number, number] | number[];
  speed?: number;
  amplitude?: number;
  mouseReact?: boolean;
  fps?: number;
  resolutionScale?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Componente Iridescence. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function Iridescence({
  color = [1, 1, 1],
  speed = 1.0,
  amplitude = 0.1,
  mouseReact = true,
  fps = 30,
  resolutionScale = 0.65,
  className,
  style,
  ...rest
}: IridescenceProps) {
  // Inicializa ctnDom; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const ctnDom = useRef<HTMLDivElement | null>(null);
  // Inicializa mousePos; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const mousePos = useRef({ x: 0.5, y: 0.5 });
  // Inicializa rgb; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const rgb = useMemo<[number, number, number]>(() => [
    Number(color[0] ?? 1),
    Number(color[1] ?? 1),
    Number(color[2] ?? 1),
  ], [color[0], color[1], color[2]]);

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!ctnDom.current) return;
    // Declara ctn; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const ctn = ctnDom.current;
    // Declara dpr; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const dpr = Math.max(0.35, Math.min(window.devicePixelRatio || 1, 1.25) * resolutionScale);
    // Declara renderer; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const renderer = new Renderer({ dpr });
    // Declara gl; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const gl = renderer.gl;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    gl.clearColor(1, 1, 1, 1);

    // Declara program; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let program: Program | null = null;
    // Declara resizeFrame; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let resizeFrame = 0;

    // resize agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
    function resize() {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      cancelAnimationFrame(resizeFrame);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      resizeFrame = requestAnimationFrame(() => {
        // Declara width; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const width = Math.max(ctn.offsetWidth, 1);
        // Declara height; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
        const height = Math.max(ctn.offsetHeight, 1);
        // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
        renderer.setSize(width, height);
        // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
        if (program) {
          // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
          program.uniforms.uResolution.value = new Color(
            gl.canvas.width,
            gl.canvas.height,
            gl.canvas.width / gl.canvas.height
          );
        }
      });
    }

    // resizeNow agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
    function resizeNow() {
      // Declara width; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const width = Math.max(ctn.offsetWidth, 1);
      // Declara height; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const height = Math.max(ctn.offsetHeight, 1);
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      renderer.setSize(width, height);
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (program) {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        program.uniforms.uResolution.value = new Color(
          gl.canvas.width,
          gl.canvas.height,
          gl.canvas.width / gl.canvas.height
        );
      }
    }

    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    window.addEventListener('resize', resize, false);
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    resizeNow();

    // Declara geometry; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const geometry = new Triangle(gl);
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(...rgb) },
        uResolution: {
          value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height),
        },
        uMouse: { value: new Float32Array([mousePos.current.x, mousePos.current.y]) },
        uAmplitude: { value: amplitude },
        uSpeed: { value: speed },
      },
    });

    // Declara mesh; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const mesh = new Mesh(gl, { geometry, program });
    // Declara animateId; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let animateId = 0;
    // Declara lastRender; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let lastRender = 0;
    // Declara frameInterval; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const frameInterval = 1000 / Math.max(12, Math.min(fps, 60));

    // update agrupa una parte de la logica del modulo para mantener el flujo principal mas legible.
    function update(t: number) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      animateId = requestAnimationFrame(update);
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (!program) return;
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (document.hidden || t - lastRender < frameInterval) return;
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      lastRender = t;
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      program.uniforms.uTime.value = t * 0.001;
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      renderer.render({ scene: mesh });
    }

    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    animateId = requestAnimationFrame(update);
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    ctn.appendChild(gl.canvas);

    // Maneja la accion handleMouseMove; conecta la interaccion del usuario con cambios de estado, navegacion o persistencia.
    function handleMouseMove(e: MouseEvent) {
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (!program) return;
      // Declara rect; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const rect = ctn.getBoundingClientRect();
      // Declara x; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const x = (e.clientX - rect.left) / rect.width;
      // Declara y; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      mousePos.current = { x, y };
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      program.uniforms.uMouse.value[0] = x;
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      program.uniforms.uMouse.value[1] = y;
    }

    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (mouseReact) {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      ctn.addEventListener('mousemove', handleMouseMove);
    }

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      cancelAnimationFrame(animateId);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      cancelAnimationFrame(resizeFrame);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      window.removeEventListener('resize', resize);
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (mouseReact) {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        ctn.removeEventListener('mousemove', handleMouseMove);
      }
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (gl.canvas.parentNode === ctn) {
        // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
        ctn.removeChild(gl.canvas);
      }
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [rgb, speed, amplitude, mouseReact, fps, resolutionScale]);

  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return createElement('div', {
    ref: ctnDom,
    className: ['iridescence-container', className].filter(Boolean).join(' '),
    style,
    ...rest,
  });
}

export default memo(Iridescence);
