/**
 * Documentacion Nexxus - apps/mobile/src/presentation/components/Plasma.tsx
 * Capa: presentacion.
 * Proposito: Componente reutilizable de interfaz. Encapsula una pieza visual o interactiva para mantener consistencia entre pantallas.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

// Importa React, { memo, useCallback, useEffect, useRef } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { memo, useCallback, useEffect, useRef } from 'react';
// Importa { StyleProp, StyleSheet, View, ViewStyle } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
// Importa { GLView, ExpoWebGLRenderingContext } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';

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
  style?: StyleProp<ViewStyle>;
};

/**
 * Declaracion hexToRgb. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const hexToRgb = (hex: string) => {
  // Declara result; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!result) return [1, 0.45, 1];
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

/**
 * Declaracion vertex. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const vertex = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

/**
 * Declaracion fragment. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const fragment = `
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uCustomColor;
uniform float uSpeed;
uniform float uDirection;
uniform float uScale;
uniform float uOpacity;

void mainImage(out vec4 o, vec2 C) {
  vec2 center = iResolution.xy * 0.5;
  C = (C - center) / uScale + center;

  float d = 0.0;
  float z = 0.0;
  float T = iTime * uSpeed * uDirection;
  vec3 O = vec3(0.0);
  vec3 p;
  vec3 S;

  for (float i = 0.0; i < 42.0; i++) {
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

void main() {
  vec4 o = vec4(0.0);
  mainImage(o, gl_FragCoord.xy);
  vec3 rgb = max(o.rgb, vec3(0.0));
  float intensity = (rgb.r + rgb.g + rgb.b) / 3.0;
  vec3 auraColor = intensity * uCustomColor * 2.45 + rgb * vec3(0.42, 0.14, 0.72);
  float alpha = clamp(max(length(rgb) * uOpacity * 1.95, 0.56 * uOpacity), 0.0, uOpacity);
  gl_FragColor = vec4(auraColor, alpha);
}
`;

/**
 * Declaracion crearShader. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
function crearShader(gl: ExpoWebGLRenderingContext, type: number, source: string) {
  // Declara shader; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const shader = gl.createShader(type);
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!shader) return null;
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  gl.shaderSource(shader, source);
  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  gl.compileShader(shader);
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    gl.deleteShader(shader);
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return null;
  }
  // Devuelve el valor final calculado para esta funcion o caso de uso.
  return shader;
}

/**
 * Componente Plasma. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
function Plasma({
  color = '#A855F7',
  speed = 1,
  direction = 'forward',
  scale = 1.7,
  opacity = 1,
  fps = 60,
  resolutionScale = 0.75,
  style,
}: PlasmaProps) {
  // Inicializa raf; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const raf = useRef<number | null>(null);

  // Inicializa onContextCreate; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (raf.current) cancelAnimationFrame(raf.current);

    // Declara vertexShader; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const vertexShader = crearShader(gl, gl.VERTEX_SHADER, vertex);
    // Declara fragmentShader; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const fragmentShader = crearShader(gl, gl.FRAGMENT_SHADER, fragment);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!vertexShader || !fragmentShader) return;

    // Declara program; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const program = gl.createProgram();
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!program) return;

    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    gl.attachShader(program, vertexShader);
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    gl.attachShader(program, fragmentShader);
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    gl.linkProgram(program);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    gl.useProgram(program);

    // Declara buffer; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const buffer = gl.createBuffer();
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    // Declara position; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const position = gl.getAttribLocation(program, 'position');
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    gl.enableVertexAttribArray(position);
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    // Declara iResolution; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const iResolution = gl.getUniformLocation(program, 'iResolution');
    // Declara iTime; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const iTime = gl.getUniformLocation(program, 'iTime');
    // Declara uCustomColor; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const uCustomColor = gl.getUniformLocation(program, 'uCustomColor');
    // Declara uSpeed; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const uSpeed = gl.getUniformLocation(program, 'uSpeed');
    // Declara uDirection; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const uDirection = gl.getUniformLocation(program, 'uDirection');
    // Declara uScale; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const uScale = gl.getUniformLocation(program, 'uScale');
    // Declara uOpacity; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const uOpacity = gl.getUniformLocation(program, 'uOpacity');
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!iResolution || !iTime || !uCustomColor || !uSpeed || !uDirection || !uScale || !uOpacity) return;
    // Declara [r, g, b]; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const [r, g, b] = hexToRgb(color);
    // Declara directionMultiplier; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const directionMultiplier = direction === 'reverse' ? -1 : 1;
    // Declara intervaloFrame; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const intervaloFrame = 1000 / Math.max(30, Math.min(fps, 60));
    // Declara escalaResolucion; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const escalaResolucion = Math.max(0.55, Math.min(resolutionScale, 1));
    // Declara ultimoFrame; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let ultimoFrame = 0;
    // Calcula inicio; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const inicio = Date.now();

    // Calcula render; normaliza fechas para comparaciones, filtros o etiquetas visibles.
    const render = () => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      raf.current = requestAnimationFrame(render);
      // Calcula ahora; normaliza fechas para comparaciones, filtros o etiquetas visibles.
      const ahora = Date.now();
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (ahora - ultimoFrame < intervaloFrame) return;
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      ultimoFrame = ahora;

      // Declara width; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const width = Math.max(1, Math.floor(gl.drawingBufferWidth * escalaResolucion));
      // Declara height; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const height = Math.max(1, Math.floor(gl.drawingBufferHeight * escalaResolucion));
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      gl.uniform2f(iResolution, width, height);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      gl.uniform1f(iTime, (ahora - inicio) * 0.001);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      gl.uniform3f(uCustomColor, r, g, b);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      gl.uniform1f(uSpeed, speed * 0.4);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      gl.uniform1f(uDirection, directionMultiplier);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      gl.uniform1f(uScale, scale);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      gl.uniform1f(uOpacity, opacity);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      gl.clearColor(0, 0, 0, 0);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      gl.clear(gl.COLOR_BUFFER_BIT);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      gl.endFrameEXP();
    };

    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    render();
  }, [color, direction, fps, opacity, resolutionScale, scale, speed]);

  // Devuelve el resultado de la operacion para que quien llama pueda continuar el flujo.
  useEffect(() => {
    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
    <View pointerEvents="none" style={[estilos.container, style]}>
      {/* GLView renderiza una pieza visual reutilizable dentro de esta pantalla. */}
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
    </View>
  );
}

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // container: estilo del contenedor principal; define espacio base, fondo y estructura general del bloque.
  container: {
    // Reutiliza propiedades de otro objeto de estilo para mantener consistencia visual.
    ...StyleSheet.absoluteFillObject,
    // overflow controla si el contenido se recorta o puede sobresalir.
    overflow: 'hidden',
  },
});

export default memo(Plasma);
