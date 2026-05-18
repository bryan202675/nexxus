/**
 * Documentacion Nexxus - nexxus/app/src/presentation/components/Grainient.tsx
 * Capa: presentacion.
 * Proposito: Componente reutilizable de interfaz. Encapsula una pieza visual o interactiva para mantener consistencia entre pantallas.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras Firebase al extender este archivo.
 */

// Importa React, { useEffect, useRef } desde React; habilita componentes, hooks y tipos base para esta pieza.
import React, { useEffect, useRef } from 'react';
// Importa { Renderer, Program, Mesh, Triangle } desde ogl; agrega una dependencia externa necesaria para este modulo.
import { Renderer, Program, Mesh, Triangle } from 'ogl';
// Importa { View, Platform, StyleSheet, Animated } desde React Native; provee bloques nativos de layout, texto, listas, eventos y estilos.
import { View, Platform, StyleSheet, Animated } from 'react-native';
// Importa { LinearGradient } desde Expo; conecta la app con capacidades nativas o web de la plataforma.
import { LinearGradient } from 'expo-linear-gradient';
// Importa estilos CSS; aplica clases, animaciones o efectos visuales usados por este componente web.
import './Grainient.css';

/**
 * Declaracion hexToRgb. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const hexToRgb = (hex: string): [number, number, number] => {
  // Declara result; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (!result) return [1, 1, 1];
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
uniform float uTimeSpeed;
uniform float uColorBalance;
uniform float uWarpStrength;
uniform float uWarpFrequency;
uniform float uWarpSpeed;
uniform float uWarpAmplitude;
uniform float uBlendAngle;
uniform float uBlendSoftness;
uniform float uRotationAmount;
uniform float uNoiseScale;
uniform float uGrainAmount;
uniform float uGrainScale;
uniform float uGrainAnimated;
uniform float uContrast;
uniform float uGamma;
uniform float uSaturation;
uniform vec2 uCenterOffset;
uniform float uZoom;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;

#define S(a,b,t) smoothstep(a,b,t)
mat2 Rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);} 
vec2 hash(vec2 p){p=vec2(dot(p,vec2(2127.1,81.17)),dot(p,vec2(1269.5,283.37)));return fract(sin(p)*43758.5453);} 
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);float n=mix(mix(dot(-1.0+2.0*hash(i+vec2(0.0,0.0)),f-vec2(0.0,0.0)),dot(-1.0+2.0*hash(i+vec2(1.0,0.0)),f-vec2(1.0,0.0)),u.x),mix(dot(-1.0+2.0*hash(i+vec2(0.0,1.0)),f-vec2(0.0,1.0)),dot(-1.0+2.0*hash(i+vec2(1.0,1.0)),f-vec2(1.0,1.0)),u.x),u.y);return 0.5+0.5*n;}

void main() {
  vec2 C = gl_FragCoord.xy;
  float t=iTime*uTimeSpeed;
  vec2 uv=C/iResolution.xy;
  float ratio=iResolution.x/iResolution.y;
  vec2 tuv=uv-0.5+uCenterOffset;
  tuv/=max(uZoom,0.001);

  float degree=noise(vec2(t*0.1,tuv.x*tuv.y)*uNoiseScale);
  tuv.y*=1.0/ratio;
  tuv*=Rot(radians((degree-0.5)*uRotationAmount+180.0));
  tuv.y*=ratio;

  float frequency=uWarpFrequency;
  float ws=max(uWarpStrength,0.001);
  float amplitude=uWarpAmplitude/ws;
  float warpTime=t*uWarpSpeed;
  tuv.x+=sin(tuv.y*frequency+warpTime)/amplitude;
  tuv.y+=sin(tuv.x*(frequency*1.5)+warpTime)/(amplitude*0.5);

  vec3 colLav=uColor1;
  vec3 colOrg=uColor2;
  vec3 colDark=uColor3;
  float b=uColorBalance;
  float s=max(uBlendSoftness,0.0);
  mat2 blendRot=Rot(radians(uBlendAngle));
  float blendX=(tuv*blendRot).x;
  float edge0=-0.3-b-s;
  float edge1=0.2-b+s;
  float v0=0.5-b+s;
  float v1=-0.3-b-s;
  vec3 layer1=mix(colDark,colOrg,S(edge0,edge1,blendX));
  vec3 layer2=mix(colOrg,colLav,S(edge0,edge1,blendX));
  vec3 col=mix(layer1,layer2,S(v0,v1,tuv.y));

  vec2 grainUv=uv*max(uGrainScale,0.001);
  if(uGrainAnimated>0.5){grainUv+=vec2(iTime*0.05);} 
  float grain=fract(sin(dot(grainUv,vec2(12.9898,78.233)))*43758.5453);
  col+=(grain-0.5)*uGrainAmount;

  col=(col-0.5)*uContrast+0.5;
  float luma=dot(col,vec3(0.2126,0.7152,0.0722));
  col=mix(vec3(luma),col,uSaturation);
  col=pow(max(col,0.0),vec3(1.0/max(uGamma,0.001)));
  col=clamp(col,0.0,1.0);

  gl_FragColor = vec4(col,1.0);
}
`;

/**
 * Declaracion ctxMap. Mantiene una pieza reutilizable de datos, logica o presentacion dentro de este modulo.
 */
const ctxMap = new WeakMap();

/**
 * Define el contrato de datos GrainientProps; documenta campos esperados y evita pasar objetos ambiguos entre capas.
 */
interface GrainientProps {
  timeSpeed?: number;
  colorBalance?: number;
  warpStrength?: number;
  warpFrequency?: number;
  warpSpeed?: number;
  warpAmplitude?: number;
  blendAngle?: number;
  blendSoftness?: number;
  rotationAmount?: number;
  noiseScale?: number;
  grainAmount?: number;
  grainScale?: number;
  grainAnimated?: boolean;
  contrast?: number;
  gamma?: number;
  saturation?: number;
  centerX?: number;
  centerY?: number;
  zoom?: number;
  color1?: string;
  color2?: string;
  color3?: string;
  className?: string;
  style?: any;
}

/**
 * Componente Grainient. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
const Grainient = ({
  timeSpeed = 0.25,
  colorBalance = 0.0,
  warpStrength = 1.0,
  warpFrequency = 5.0,
  warpSpeed = 2.0,
  warpAmplitude = 50.0,
  blendAngle = 0.0,
  blendSoftness = 0.05,
  rotationAmount = 500.0,
  noiseScale = 2.0,
  grainAmount = 0.1,
  grainScale = 2.0,
  grainAnimated = false,
  contrast = 1.5,
  gamma = 1.0,
  saturation = 1.0,
  centerX = 0.0,
  centerY = 0.0,
  zoom = 0.9,
  color1 = '#FF9FFC',
  color2 = '#5227FF',
  color3 = '#B497CF',
  className = '',
  style
}: GrainientProps) => {
  // Inicializa containerRef; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const containerRef = useRef<any>(null);
  // Inicializa nativeAnim; obtiene estado, traducciones, referencias o contexto necesarios para esta pantalla.
  const nativeAnim = useRef(new Animated.Value(0)).current;

  // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
  useEffect(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (Platform.OS !== 'web') {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      Animated.loop(
        Animated.sequence([
          Animated.timing(nativeAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
          Animated.timing(nativeAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
        ])
      ).start();
      // Devuelve el valor final calculado para esta funcion o caso de uso.
      return;
    }
    
    // Declara container; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const container = containerRef.current;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!container) return;

    // Declara renderer; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const renderer = new Renderer({
      alpha: true,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio || 1, 2)
    });

    // Declara gl; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const gl = renderer.gl;
    // Declara canvas; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const canvas = gl.canvas;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    canvas.style.width = '100%';
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    canvas.style.height = '100%';
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    canvas.style.display = 'block';
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    container.appendChild(canvas);

    // Declara geometry; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const geometry = new Triangle(gl);
    // Declara program; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iTime:           { value: 0 },
        iResolution:     { value: new Float32Array([1, 1]) },
        uTimeSpeed:      { value: 0.25 },
        uColorBalance:   { value: 0.0 },
        uWarpStrength:   { value: 1.0 },
        uWarpFrequency:  { value: 5.0 },
        uWarpSpeed:      { value: 2.0 },
        uWarpAmplitude:  { value: 50.0 },
        uBlendAngle:     { value: 0.0 },
        uBlendSoftness:  { value: 0.05 },
        uRotationAmount: { value: 500.0 },
        uNoiseScale:     { value: 2.0 },
        uGrainAmount:    { value: 0.1 },
        uGrainScale:     { value: 2.0 },
        uGrainAnimated:  { value: 0.0 },
        uContrast:       { value: 1.5 },
        uGamma:          { value: 1.0 },
        uSaturation:     { value: 1.0 },
        uCenterOffset:   { value: new Float32Array([0, 0]) },
        uZoom:           { value: 0.9 },
        uColor1:         { value: new Float32Array([1, 1, 1]) },
        uColor2:         { value: new Float32Array([1, 1, 1]) },
        uColor3:         { value: new Float32Array([1, 1, 1]) }
      }
    });

    // Declara mesh; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const mesh = new Mesh(gl, { geometry, program });
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    ctxMap.set(container, { renderer, program, mesh });

    // Declara setSize; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const setSize = () => {
      // Declara rect; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const rect = container.getBoundingClientRect();
      // Declara w; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const w = Math.max(1, Math.floor(rect.width));
      // Declara h; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const h = Math.max(1, Math.floor(rect.height));
      // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
      renderer.setSize(w, h);
      // Declara res; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const res = program.uniforms.iResolution.value;
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      res[0] = gl.drawingBufferWidth;
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      res[1] = gl.drawingBufferHeight;
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      renderer.render({ scene: mesh });
    };

    // Declara ro; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const ro = new ResizeObserver(setSize);
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    ro.observe(container);
    // Actualiza estado local; esto provoca que React vuelva a renderizar la vista con la informacion nueva.
    setSize();

    // Declara raf; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    let raf = 0;
    // Declara t0; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const t0 = performance.now();

    // Declara loop; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const loop = (t: number) => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      program.uniforms.iTime.value = (t - t0) * 0.001;
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      renderer.render({ scene: mesh });
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      raf = requestAnimationFrame(loop);
    };

    // Declara tryStart; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const tryStart = () => {
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (raf === 0) raf = requestAnimationFrame(loop);
    };
    // Declara tryStop; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const tryStop = () => {
      // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
      if (raf !== 0) { cancelAnimationFrame(raf); raf = 0; }
    };

    // Declara onVisibility; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const onVisibility = () => {
      // Declara isPageVisible; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
      const isPageVisible = !document.hidden;
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      isPageVisible ? tryStart() : tryStop();
    };
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    document.addEventListener('visibilitychange', onVisibility);

    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    tryStart();

    // Devuelve el valor final calculado para esta funcion o caso de uso.
    return () => {
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      tryStop();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      ro.disconnect();
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      document.removeEventListener('visibilitychange', onVisibility);
      // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
      ctxMap.delete(container);
      // Protege operaciones que pueden fallar; captura errores para mostrar mensajes o lanzar fallos controlados.
      try { container.removeChild(canvas); } catch { /* ignore */ }
    };
  }, []);

  // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
  useEffect(() => {
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (Platform.OS !== 'web') return;

    // Declara container; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const container = containerRef.current;
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!container) return;
    // Declara ctx; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const ctx = ctxMap.get(container);
    // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
    if (!ctx) return;
    // Declara { program }; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const { program } = ctx;
    // Declara u; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const u = program.uniforms;

    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    u.uTimeSpeed.value      = timeSpeed;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    u.uColorBalance.value   = colorBalance;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    u.uWarpStrength.value   = warpStrength;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    u.uWarpFrequency.value  = warpFrequency;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    u.uWarpSpeed.value      = warpSpeed;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    u.uWarpAmplitude.value  = warpAmplitude;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    u.uBlendAngle.value     = blendAngle;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    u.uBlendSoftness.value  = blendSoftness;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    u.uRotationAmount.value = rotationAmount;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    u.uNoiseScale.value     = noiseScale;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    u.uGrainAmount.value    = grainAmount;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    u.uGrainScale.value     = grainScale;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    u.uGrainAnimated.value  = grainAnimated ? 1.0 : 0.0;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    u.uContrast.value       = contrast;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    u.uGamma.value          = gamma;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    u.uSaturation.value     = saturation;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    u.uCenterOffset.value   = new Float32Array([centerX, centerY]);
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    u.uZoom.value           = zoom;
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    u.uColor1.value         = new Float32Array(hexToRgb(color1));
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    u.uColor2.value         = new Float32Array(hexToRgb(color2));
    // Ejecuta esta instruccion por su efecto: cambia estado, dispara una accion o invoca una integracion.
    u.uColor3.value         = new Float32Array(hexToRgb(color3));
  }, [
    timeSpeed, colorBalance, warpStrength, warpFrequency, warpSpeed,
    warpAmplitude, blendAngle, blendSoftness, rotationAmount, noiseScale,
    grainAmount, grainScale, grainAnimated, contrast, gamma, saturation,
    centerX, centerY, zoom, color1, color2, color3
  ]);

  // Evalua una condicion clave; separa el camino normal de estados vacios, errores o permisos insuficientes.
  if (Platform.OS !== 'web') {
    // Declara animatedStart; guarda un valor intermedio para que el resto del modulo pueda usarlo con un nombre claro.
    const animatedStart = {
      x: nativeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }),
      y: nativeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3] }),
    };

    // Devuelve el JSX que React Native renderiza en pantalla.
    return (
      // Bloque de layout; organiza otros elementos visuales y aplica estilos de espaciado/alineacion.
      <View style={[estilos.fallback, style]}>
        {/* Usamos dos capas con opacidad animada para simular movimiento de gradiente */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: nativeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }) }]}>
          {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
          <LinearGradient
            colors={[color1, color2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        {/* Animated.View renderiza una pieza visual reutilizable dentro de esta pantalla. */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: nativeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }]}>
          {/* Gradiente visual; aporta profundidad y jerarquia al bloque donde se renderiza. */}
          <LinearGradient
            colors={[color2, color3]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    );
  }

  // Devuelve el JSX que React Native renderiza en pantalla.
  return (
    // div renderiza una pieza visual reutilizable dentro de esta pantalla.
    <div 
      ref={containerRef} 
      className={`grainient-container ${className}`.trim()} 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        backgroundColor: '#05030C',
        ...style 
      }} 
    />
  );
};

/**
 * Mapa de estilos estilos. Centraliza reglas visuales para que el JSX se mantenga legible y consistente.
 */
const estilos = StyleSheet.create({
  // fallback: estilo local de la pantalla; agrupa propiedades visuales reutilizadas por el JSX.
  fallback: {
    // backgroundColor define el fondo del bloque.
    backgroundColor: '#05030C',
  }
});

export default Grainient;
