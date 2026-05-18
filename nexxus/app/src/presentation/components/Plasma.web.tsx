import React, { memo, useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import './Plasma.css';

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
  className?: string;
  style?: React.CSSProperties;
};

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 0.5, 0.2];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

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
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl || typeof window === 'undefined') return;

    const useCustomColor = color ? 1.0 : 0.0;
    const customColorRgb = color ? hexToRgb(color) : [1, 1, 1];
    const directionMultiplier = direction === 'reverse' ? -1.0 : 1.0;
    const escalaResolucion = Math.max(0.45, Math.min(resolutionScale, 1));
    const dpr = Math.max(0.5, Math.min((window.devicePixelRatio || 1) * escalaResolucion, 1.15));
    const intervaloFrame = 1000 / Math.max(30, Math.min(fps, 60));

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        webgl: 2,
        alpha: true,
        antialias: false,
        dpr,
      });
    } catch {
      return;
    }

    const gl = renderer.gl;
    if (!gl) return;

    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    containerEl.appendChild(canvas);

    const geometry = new Triangle(gl);
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
    const mesh = new Mesh(gl, { geometry, program });

    const handleMouseMove = (event: MouseEvent) => {
      if (!mouseInteractive) return;
      const rect = containerEl.getBoundingClientRect();
      const mouseUniform = program.uniforms.uMouse.value as Float32Array;
      mouseUniform[0] = event.clientX - rect.left;
      mouseUniform[1] = event.clientY - rect.top;
    };

    if (mouseInteractive) {
      containerEl.addEventListener('mousemove', handleMouseMove);
    }

    const setSize = () => {
      const rect = containerEl.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      renderer.setSize(width, height);
      const res = program.uniforms.iResolution.value as Float32Array;
      res[0] = gl.drawingBufferWidth;
      res[1] = gl.drawingBufferHeight;
    };

    const ro = new ResizeObserver(setSize);
    ro.observe(containerEl);
    setSize();

    let raf = 0;
    let contextLost = false;
    let isVisible = true;
    let documentVisible = typeof document === 'undefined' ? true : !document.hidden;
    let ultimoFrame = 0;
    const t0 = performance.now();

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (contextLost || !isVisible || !documentVisible) return;
      if (t - ultimoFrame < intervaloFrame) return;
      ultimoFrame = t;

      const timeValue = (t - t0) * 0.001;
      if (direction === 'pingpong') {
        const pingpongDuration = 10;
        const segmentTime = timeValue % pingpongDuration;
        const isForward = Math.floor(timeValue / pingpongDuration) % 2 === 0;
        const u = segmentTime / pingpongDuration;
        const smooth = u * u * (3 - 2 * u);
        program.uniforms.uDirection.value = 1.0;
        program.uniforms.iTime.value = isForward ? smooth * pingpongDuration : (1 - smooth) * pingpongDuration;
      } else {
        program.uniforms.iTime.value = timeValue;
      }

      renderer.render({ scene: mesh });
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
    };

    const handleContextRestored = () => {
      contextLost = false;
      setSize();
    };

    const handleVisibility = () => {
      documentVisible = !document.hidden;
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);
    document.addEventListener('visibilitychange', handleVisibility);

    const io = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0 });
    io.observe(containerEl);

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (mouseInteractive) {
        containerEl.removeEventListener('mousemove', handleMouseMove);
      }
      try {
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      } catch {}
      try {
        containerEl.removeChild(canvas);
      } catch {}
    };
  }, [color, direction, fps, mouseInteractive, opacity, resolutionScale, scale, speed]);

  return <div ref={containerRef} className={['plasma-container', className].filter(Boolean).join(' ')} style={style} />;
}

export default memo(Plasma);
