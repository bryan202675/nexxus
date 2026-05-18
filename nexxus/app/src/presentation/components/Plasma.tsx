import React, { memo, useCallback, useEffect, useRef } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';

type DireccionPlasma = 'forward' | 'reverse' | 'pingpong';

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

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 0.45, 1];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

const vertex = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

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

function crearShader(gl: ExpoWebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

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
  const raf = useRef<number | null>(null);

  const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    if (raf.current) cancelAnimationFrame(raf.current);

    const vertexShader = crearShader(gl, gl.VERTEX_SHADER, vertex);
    const fragmentShader = crearShader(gl, gl.FRAGMENT_SHADER, fragment);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const iResolution = gl.getUniformLocation(program, 'iResolution');
    const iTime = gl.getUniformLocation(program, 'iTime');
    const uCustomColor = gl.getUniformLocation(program, 'uCustomColor');
    const uSpeed = gl.getUniformLocation(program, 'uSpeed');
    const uDirection = gl.getUniformLocation(program, 'uDirection');
    const uScale = gl.getUniformLocation(program, 'uScale');
    const uOpacity = gl.getUniformLocation(program, 'uOpacity');
    if (!iResolution || !iTime || !uCustomColor || !uSpeed || !uDirection || !uScale || !uOpacity) return;
    const [r, g, b] = hexToRgb(color);
    const directionMultiplier = direction === 'reverse' ? -1 : 1;
    const intervaloFrame = 1000 / Math.max(30, Math.min(fps, 60));
    const escalaResolucion = Math.max(0.55, Math.min(resolutionScale, 1));
    let ultimoFrame = 0;
    const inicio = Date.now();

    const render = () => {
      raf.current = requestAnimationFrame(render);
      const ahora = Date.now();
      if (ahora - ultimoFrame < intervaloFrame) return;
      ultimoFrame = ahora;

      const width = Math.max(1, Math.floor(gl.drawingBufferWidth * escalaResolucion));
      const height = Math.max(1, Math.floor(gl.drawingBufferHeight * escalaResolucion));
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.uniform2f(iResolution, width, height);
      gl.uniform1f(iTime, (ahora - inicio) * 0.001);
      gl.uniform3f(uCustomColor, r, g, b);
      gl.uniform1f(uSpeed, speed * 0.4);
      gl.uniform1f(uDirection, directionMultiplier);
      gl.uniform1f(uScale, scale);
      gl.uniform1f(uOpacity, opacity);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.endFrameEXP();
    };

    render();
  }, [color, direction, fps, opacity, resolutionScale, scale, speed]);

  useEffect(() => {
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <View pointerEvents="none" style={[estilos.container, style]}>
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});

export default memo(Plasma);
