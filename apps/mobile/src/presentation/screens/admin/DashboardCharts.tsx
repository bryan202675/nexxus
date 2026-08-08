/**
 * Documentacion Nexxus - apps/mobile/src/presentation/screens/admin/DashboardCharts.tsx
 * Capa: presentacion.
 * Proposito: Graficos y paneles visuales del Dashboard de administracion (sparklines, donut, panel lateral), extraidos de DashboardAdmin.tsx.
 * Dependencias clave: PuntoGrafico (dashboardAdminTypes), BRAND/CHART_FONT (dashboardAdminConstants), estilos (dashboardAdminStyles).
 * Consideracion de mantenimiento: preservar las firmas exportadas, las consume DashboardAdmin.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient as SvgLinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { AdminTranslatedText } from '@/shared/i18n/AdminTranslatedText';
import { ADMIN, useAdminAppearance } from './adminTheme';
import { PuntoGrafico, ModoGrafico } from './dashboardAdminTypes';
import { BRAND, CHART_FONT } from './dashboardAdminConstants';
import { obtenerFecha } from './dashboardAdminHelpers';
import { estilos } from './dashboardAdminStyles';

const Text = AdminTranslatedText;

/**
 * Componente FondoHeaderTech. Renderiza una telemetría digital fluida con ondas curvas, regleta de escalas y matriz de puntos.
 */
export function FondoHeaderTech() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 1000 320" preserveAspectRatio="none">
        <Defs>
          {/* Degradado para la onda de área degradada */}
          <SvgLinearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#7C3AED" stopOpacity={0.08} />
            <Stop offset="100%" stopColor="#7C3AED" stopOpacity={0.00} />
          </SvgLinearGradient>
        </Defs>

        {/* Matriz de Puntos de Fondo (Dot Grid) */}
        <Path
          d="M 20,40 L 980,40 M 20,120 L 980,120 M 20,200 L 980,200 M 20,280 L 980,280"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="0 80"
        />



        {/* Onda C: Relleno suave degradado */}
        <Path
          d="M -20,280 Q 250,120 450,200 T 850,140 Q 920,110 1020,120 L 1020,320 L -20,320 Z"
          fill="url(#waveGrad)"
        />

        {/* Onda A: Línea Principal Púrpura (Fluido) */}
        <Path
          d="M -20,240 C 200,100 380,300 550,160 C 720,20 860,260 1020,180"
          stroke="rgba(168, 85, 247, 0.22)"
          strokeWidth={3}
          fill="none"
        />

        {/* Onda B: Línea Secundaria Azul Segmentada */}
        <Path
          d="M -20,180 C 180,280 400,80 580,220 C 760,360 880,120 1020,150"
          stroke="rgba(37, 99, 235, 0.16)"
          strokeWidth={2}
          strokeDasharray="6 4"
          fill="none"
        />

        {/* Intersecciones y Nodos de Control */}
        {/* Nodo en Onda A (Pico central) */}
        <Circle cx={550} cy={160} r={4} fill="#A855F7" opacity={0.8} />
        <Circle cx={550} cy={160} r={10} stroke="#A855F7" strokeWidth={1} fill="none" opacity={0.25} />

        {/* Nodo en Onda B */}
        <Circle cx={580} cy={220} r={3} fill="#2563EB" opacity={0.8} />
        <Circle cx={580} cy={220} r={8} stroke="#2563EB" strokeWidth={1} fill="none" opacity={0.2} />

        {/* Marcador Cruz de Objetivo */}
        <Path d="M 850,136 L 850,144 M 846,140 L 854,140" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
        <Circle cx={850} cy={140} r={8} stroke="rgba(255,255,255,0.1)" strokeWidth={1} fill="none" />


      </Svg>
    </View>
  );
}

/**
 * HeroMiniChart – animated SVG sparkline for the header health score panel.
 * Clean gradient sparkline with glowing dots, no bars. Draws left-to-right on mount and data change.
 */
export const HeroMiniChart = ({ datos }: { datos: PuntoGrafico[] }) => {
  const animProg = useRef(new Animated.Value(0)).current;
  const [prog, setProg] = useState(0);
  const glowPulse = useRef(new Animated.Value(0)).current;

  const clave = datos.map((p) => p.rendimiento).join(',');

  useEffect(() => {
    animProg.setValue(0);
    const listener = animProg.addListener(({ value }) => setProg(value));
    Animated.timing(animProg, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    // Endpoint glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(glowPulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    ).start();
    return () => animProg.removeListener(listener);
  }, [clave]);

  const pts = datos.length > 0 ? datos.slice(-7) : [{ label: '', rendimiento: 0, carga: 0, estres: 0 }];
  const W = 156; const H = 88;
  const padL = 4; const padR = 6; const padT = 8; const padB = 8;
  const iW = W - padL - padR;
  const iH = H - padT - padB;
  const n = pts.length;

  const px = (i: number) => padL + (n === 1 ? iW / 2 : (i / (n - 1)) * iW);
  const py = (v: number) => padT + iH - (Math.max(0, Math.min(100, v)) / 100) * iH;

  // Smooth catmull-rom bezier
  const buildPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return points.length === 1 ? `M${points[0].x} ${points[0].y}` : '';
    const cmds = [`M${points[0].x} ${points[0].y}`];
    const t2 = 0.2;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i]; const b = points[i + 1];
      const prev = points[i - 1] || a; const next = points[i + 2] || b;
      cmds.push(`C${a.x + (b.x - prev.x) * t2} ${a.y + (b.y - prev.y) * t2},${b.x - (next.x - a.x) * t2} ${b.y - (next.y - a.y) * t2},${b.x} ${b.y}`);
    }
    return cmds.join(' ');
  };

  // Animate: only show points up to current progress
  const visCount = Math.max(1, Math.ceil((n - 1) * prog) + 1);
  const allPts = pts.map((p, i) => ({ x: px(i), y: py(p.rendimiento) }));
  const visPts = allPts.slice(0, visCount);

  const linePath = buildPath(visPts);
  const baseY = padT + iH;
  const areaPath = visPts.length > 0
    ? `M${visPts[0].x} ${baseY} L${visPts[0].x} ${visPts[0].y} ${buildPath(visPts).replace(/^M[^ ]+ [^ ]+/, '')} L${visPts[visPts.length - 1].x} ${baseY} Z`
    : '';
  const lastPt = visPts[visPts.length - 1];

  return (
    <View style={estilos.heroChart} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          {/* Area gradient — deep violet to transparent */}
          <SvgLinearGradient id="hAreaGr" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#A855F7" stopOpacity="0.48" />
            <Stop offset="75%" stopColor="#6D28D9" stopOpacity="0.08" />
            <Stop offset="100%" stopColor="#6D28D9" stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>

        {/* Subtle horizontal grid lines */}
        {[0.25, 0.5, 0.75].map((f) => (
          <Line
            key={`hg-${f}`}
            x1={padL}
            y1={padT + iH * (1 - f)}
            x2={W - padR}
            y2={padT + iH * (1 - f)}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
            strokeDasharray="3 6"
          />
        ))}

        {/* Gradient fill area */}
        {areaPath ? <Path d={areaPath} fill="url(#hAreaGr)" /> : null}

        {/* Main sparkline */}
        {linePath ? (
          <Path
            d={linePath}
            fill="none"
            stroke="#C084FC"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {/* Dots at each visible data point (except last which gets the glow dot) */}
        {visPts.map((pt, i) => (
          i < visPts.length - 1 ? (
            <Circle
              key={`hdot-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={2.2}
              fill="#C084FC"
              opacity={0.55 + (i / n) * 0.4}
            />
          ) : null
        ))}

        {/* Glowing endpoint dot */}
        {lastPt && (
          <G>
            {/* Outer glow ring */}
            <Circle cx={lastPt.x} cy={lastPt.y} r={8} fill="#A855F7" opacity={0.16} />
            <Circle cx={lastPt.x} cy={lastPt.y} r={5} fill="#A855F7" opacity={0.10} />
            {/* Core dot */}
            <Circle cx={lastPt.x} cy={lastPt.y} r={3} fill="#0D0B1E" stroke="#C084FC" strokeWidth={2} />
          </G>
        )}
      </Svg>
    </View>
  );
};

/**
 * PerformanceSparkChart – advanced multi-line chart with Y-axis labels, interactive tooltip, entry & update animations.
 * Shows rendimiento (green), carga (amber) and estrés (red) as smooth bezier lines in the same graph.
 */
export const PerformanceSparkChart = ({ datos }: { datos: PuntoGrafico[] }) => {
  const { t } = useTranslation();
  // Main entrance/update animation (0 → 1)
  const animacion = useRef(new Animated.Value(0)).current;
  const [avance, setAvance] = useState(0);
  // Tooltip state: which point index is selected (-1 = none)
  const [tooltipIdx, setTooltipIdx] = useState(-1);
  // Glow pulse for hovered dot
  const glowAnim = useRef(new Animated.Value(0)).current;

  const claveDatos = datos.map((p) => `${p.label}-${p.rendimiento}-${p.carga}-${p.estres}`).join('|');

  // Entry + update animation
  useEffect(() => {
    animacion.stopAnimation();
    animacion.setValue(0);
    setTooltipIdx(-1);
    const listener = animacion.addListener(({ value }) => setAvance(value));
    Animated.timing(animacion, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => animacion.removeListener(listener);
  }, [claveDatos]);

  // Pulsing glow loop when tooltip is active
  useEffect(() => {
    if (tooltipIdx >= 0) {
      glowAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        ])
      ).start();
    } else {
      glowAnim.stopAnimation();
      glowAnim.setValue(0);
    }
  }, [tooltipIdx]);

  // SVG canvas dimensions
  const W = 780;
  const H = 270;
  // Margins: left larger for Y-axis labels
  const mg = { t: 32, r: 18, b: 40, l: 46 };
  const iW = W - mg.l - mg.r;
  const iH = H - mg.t - mg.b;

  const datos2 = datos.length > 0 ? datos : [{ label: '', rendimiento: 0, carga: 0, estres: 0 }];
  const n = datos2.length;

  // X coordinate for data point i (centered in its slot)
  const cx = (i: number) => mg.l + (n === 1 ? iW / 2 : (i / (n - 1)) * iW);
  // Y coordinate for value v (0-100)
  const cy = (v: number) => mg.t + iH - (Math.max(0, Math.min(100, v)) / 100) * iH;

  // Smooth catmull-rom bezier path builder
  const buildPath = (pts: { x: number; y: number }[], animated?: boolean, prog?: number) => {
    const usePts = animated && prog !== undefined
      ? pts.slice(0, Math.max(1, Math.ceil((pts.length - 1) * prog) + 1))
      : pts;
    if (usePts.length < 2) return usePts.length === 1 ? `M${usePts[0].x} ${usePts[0].y}` : '';
    const cmds = [`M${usePts[0].x} ${usePts[0].y}`];
    const t2 = 0.18;
    for (let i = 0; i < usePts.length - 1; i++) {
      const a = usePts[i]; const b = usePts[i + 1];
      const prev = usePts[i - 1] || a; const next = usePts[i + 2] || b;
      cmds.push(`C${a.x + (b.x - prev.x) * t2} ${a.y + (b.y - prev.y) * t2},${b.x - (next.x - a.x) * t2} ${b.y - (next.y - a.y) * t2},${b.x} ${b.y}`);
    }
    return cmds.join(' ');
  };

  const buildAreaPath = (pts: { x: number; y: number }[], prog?: number) => {
    const baseY = mg.t + iH;
    const usePts = prog !== undefined
      ? pts.slice(0, Math.max(1, Math.ceil((pts.length - 1) * prog) + 1))
      : pts;
    if (usePts.length === 0) return '';
    const linePath = buildPath(usePts);
    const startX = usePts[0].x;
    const endX = usePts[usePts.length - 1].x;
    return `M${startX} ${baseY} L${startX} ${usePts[0].y} ${linePath.replace(/^M[^ ]+ [^ ]+/, '')} L${endX} ${baseY} Z`;
  };

  // Build all three point sets
  const rPts = datos2.map((p, i) => ({ x: cx(i), y: cy(p.rendimiento) }));
  const cPts = datos2.map((p, i) => ({ x: cx(i), y: cy(p.carga) }));
  const ePts = datos2.map((p, i) => ({ x: cx(i), y: cy(p.estres) }));

  // Animated paths (drawn progressively)
  const rPath = buildPath(rPts, true, avance);
  const cPath = buildPath(cPts, true, avance);
  const ePath = buildPath(ePts, true, avance);
  const rArea = buildAreaPath(rPts, avance);
  const cArea = buildAreaPath(cPts, avance);
  const eArea = buildAreaPath(ePts, avance);

  // Visible points up to animation progress
  const visibleCount = Math.max(1, Math.ceil((n - 1) * avance) + 1);
  const rPtsVis = rPts.slice(0, visibleCount);
  const cPtsVis = cPts.slice(0, visibleCount);
  const ePtsVis = ePts.slice(0, visibleCount);

  // Y-axis grid values
  const gridValues = [0, 25, 50, 75, 100];

  // Tooltip data
  const tooltipPunto = tooltipIdx >= 0 ? datos2[tooltipIdx] : null;
  const tooltipX = tooltipIdx >= 0 ? cx(tooltipIdx) : 0;
  const tooltipLabelX = tooltipX > W - 145 ? tooltipX - 143 : tooltipX + 14;
  const tooltipLabelY = mg.t - 4;

  // Zone width for each data point's invisible hover area



  return (
    <Animated.View
      style={[
        estilos.lineChartShell,
        {
          opacity: animacion,
          transform: [{
            translateY: animacion.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
          }],
        },
      ]}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${W} ${H}`}
      >
        <Defs>
          {/* Gradient fills for each line */}
          <SvgLinearGradient id="gradR" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={BRAND.success} stopOpacity="0.22" />
            <Stop offset="100%" stopColor={BRAND.success} stopOpacity="0.01" />
          </SvgLinearGradient>
          <SvgLinearGradient id="gradC" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={BRAND.warning} stopOpacity="0.18" />
            <Stop offset="100%" stopColor={BRAND.warning} stopOpacity="0.01" />
          </SvgLinearGradient>
          <SvgLinearGradient id="gradE" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={BRAND.error} stopOpacity="0.15" />
            <Stop offset="100%" stopColor={BRAND.error} stopOpacity="0.01" />
          </SvgLinearGradient>
          {/* Background gradient */}
          <SvgLinearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="rgba(124,58,237,0.04)" stopOpacity="1" />
            <Stop offset="100%" stopColor="rgba(0,0,0,0)" stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>

        {/* Chart area subtle background */}
        <Rect x={mg.l} y={mg.t} width={iW} height={iH} fill="url(#bgGrad)" rx={4} />

        {/* Horizontal grid lines + Y-axis labels */}
        {gridValues.map((v) => {
          const yPos = cy(v);
          return (
            <G key={`grid-${v}`}>
              <Line
                x1={mg.l}
                y1={yPos}
                x2={mg.l + iW}
                y2={yPos}
                stroke={v === 0 ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)'}
                strokeWidth={v === 0 ? 1.5 : 1}
                strokeDasharray={v === 0 ? '0' : '5 7'}
              />
              {/* Y-axis label */}
              <SvgText
                x={mg.l - 8}
                y={yPos + 4}
                fill="#94A3B8"
                fontSize={9}
                fontWeight="700"
                fontFamily={CHART_FONT}
                textAnchor="end"
              >
                {`${v}%`}
              </SvgText>
            </G>
          );
        })}

        {/* Vertical separator line (Y-axis) */}
        <Line
          x1={mg.l}
          y1={mg.t}
          x2={mg.l}
          y2={mg.t + iH}
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={1}
        />

        {/* Vertical tick marks at each data point */}
        {datos2.map((_, i) => (
          <Line
            key={`vtick-${i}`}
            x1={cx(i)}
            y1={mg.t + iH}
            x2={cx(i)}
            y2={mg.t + iH + 4}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={1}
          />
        ))}

        {/* Tooltip vertical cursor line */}
        {tooltipIdx >= 0 && (
          <Line
            x1={tooltipX}
            y1={mg.t}
            x2={tooltipX}
            y2={mg.t + iH}
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={1.5}
            strokeDasharray="3 4"
          />
        )}

        {/* ── Estrés area + line (drawn first, behind others) ── */}
        {eArea ? <Path d={eArea} fill="url(#gradE)" /> : null}
        {ePath ? <Path d={ePath} fill="none" stroke={BRAND.error} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} /> : null}

        {/* ── Carga area + line ── */}
        {cArea ? <Path d={cArea} fill="url(#gradC)" /> : null}
        {cPath ? <Path d={cPath} fill="none" stroke={BRAND.warning} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} /> : null}

        {/* ── Rendimiento area + line (on top) ── */}
        {rArea ? <Path d={rArea} fill="url(#gradR)" /> : null}
        {rPath ? <Path d={rPath} fill="none" stroke={BRAND.success} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /> : null}

        {/* Data dots – rendimiento */}
        {rPtsVis.map((pt, i) => (
          i === rPtsVis.length - 1 ? (
            <G key={`rdot-${i}`}>
              <Circle cx={pt.x} cy={pt.y} r={7} fill={BRAND.success} opacity={0.12} />
              <Circle cx={pt.x} cy={pt.y} r={4} fill={ADMIN.fondoElevado} stroke={BRAND.success} strokeWidth={2} />
            </G>
          ) : null
        ))}

        {/* Data dots – carga */}
        {cPtsVis.map((pt, i) => (
          i === cPtsVis.length - 1 ? (
            <G key={`cdot-${i}`}>
              <Circle cx={pt.x} cy={pt.y} r={6} fill={BRAND.warning} opacity={0.12} />
              <Circle cx={pt.x} cy={pt.y} r={3.5} fill={ADMIN.fondoElevado} stroke={BRAND.warning} strokeWidth={2} />
            </G>
          ) : null
        ))}

        {/* Data dots – estrés */}
        {ePtsVis.map((pt, i) => (
          i === ePtsVis.length - 1 ? (
            <G key={`edot-${i}`}>
              <Circle cx={pt.x} cy={pt.y} r={6} fill={BRAND.error} opacity={0.12} />
              <Circle cx={pt.x} cy={pt.y} r={3.5} fill={ADMIN.fondoElevado} stroke={BRAND.error} strokeWidth={2} />
            </G>
          ) : null
        ))}

        {/* Tooltip hovered dots */}
        {tooltipIdx >= 0 && tooltipIdx < n && (
          <G>
            {/* Rendimiento hovered dot */}
            <Circle cx={rPts[tooltipIdx].x} cy={rPts[tooltipIdx].y} r={9} fill={BRAND.success} opacity={0.18} />
            <Circle cx={rPts[tooltipIdx].x} cy={rPts[tooltipIdx].y} r={5} fill={ADMIN.fondoElevado} stroke={BRAND.success} strokeWidth={2.5} />
            {/* Carga hovered dot */}
            <Circle cx={cPts[tooltipIdx].x} cy={cPts[tooltipIdx].y} r={8} fill={BRAND.warning} opacity={0.18} />
            <Circle cx={cPts[tooltipIdx].x} cy={cPts[tooltipIdx].y} r={4.5} fill={ADMIN.fondoElevado} stroke={BRAND.warning} strokeWidth={2} />
            {/* Estrés hovered dot */}
            <Circle cx={ePts[tooltipIdx].x} cy={ePts[tooltipIdx].y} r={8} fill={BRAND.error} opacity={0.18} />
            <Circle cx={ePts[tooltipIdx].x} cy={ePts[tooltipIdx].y} r={4.5} fill={ADMIN.fondoElevado} stroke={BRAND.error} strokeWidth={2} />
          </G>
        )}

        {/* Tooltip box (SVG inline) */}
        {tooltipIdx >= 0 && tooltipPunto && (
          <G>
            <Rect
              x={tooltipLabelX}
              y={tooltipLabelY + 2}
              width={130}
              height={74}
              rx={8}
              fill={ADMIN.fondoVidrioFuerte}
              stroke={ADMIN.bordeFuerte}
              strokeWidth={1}
              opacity={0.97}
            />
            {/* Period label */}
            <SvgText
              x={tooltipLabelX + 10}
              y={tooltipLabelY + 19}
              fill="rgba(255,255,255,0.45)"
              fontSize={9}
              fontWeight="800"
              fontFamily={CHART_FONT}
            >
              {tooltipPunto.label.toUpperCase()}
            </SvgText>
            {/* Rendimiento */}
            <Circle cx={tooltipLabelX + 14} cy={tooltipLabelY + 34} r={4} fill={BRAND.success} />
            <SvgText x={tooltipLabelX + 24} y={tooltipLabelY + 38} fill={BRAND.success} fontSize={10} fontWeight="700" fontFamily={CHART_FONT}>
              {`Rendimiento  ${tooltipPunto.rendimiento}%`}
            </SvgText>
            {/* Carga */}
            <Circle cx={tooltipLabelX + 14} cy={tooltipLabelY + 51} r={4} fill={BRAND.warning} />
            <SvgText x={tooltipLabelX + 24} y={tooltipLabelY + 55} fill={BRAND.warning} fontSize={10} fontWeight="700" fontFamily={CHART_FONT}>
              {`Carga          ${tooltipPunto.carga}%`}
            </SvgText>
            {/* Estrés */}
            <Circle cx={tooltipLabelX + 14} cy={tooltipLabelY + 68} r={4} fill={BRAND.error} />
            <SvgText x={tooltipLabelX + 24} y={tooltipLabelY + 72} fill={BRAND.error} fontSize={10} fontWeight="700" fontFamily={CHART_FONT}>
              {`Estrés          ${tooltipPunto.estres}%`}
            </SvgText>
          </G>
        )}

         {/* X-axis labels */}
         {datos2.map((p, i) => {
           const show = n <= 12 || i % Math.ceil(n / 12) === 0 || i === n - 1;
           return show ? (
             <SvgText
               key={`xlabel-${i}`}
               x={cx(i)}
               y={H - 10}
               fill="#94A3B8"
               fontSize={n > 14 ? 8 : 9.5}
               fontWeight={tooltipIdx === i ? '800' : '600'}
               fontFamily={CHART_FONT}
               textAnchor="middle"
             >
               {p.label}
             </SvgText>
           ) : null;
         })}

        {/* ── Invisible hover/touch zones per data point — MUST be last so they capture events ── */}
        {datos2.map((_, i) => {
          // Zone spans from midpoint to previous to midpoint to next point
          const x0 = i === 0 ? mg.l : (cx(i - 1) + cx(i)) / 2;
          const x1 = i === n - 1 ? mg.l + iW : (cx(i) + cx(i + 1)) / 2;
          return (
            <Rect
              key={`zone-${i}`}
              x={x0}
              y={mg.t}
              width={x1 - x0}
              height={iH + 4}
              fill="transparent"
              onPressIn={Platform.OS !== 'web' ? () => setTooltipIdx(i) : undefined}
              onPressOut={Platform.OS !== 'web' ? () => setTimeout(() => setTooltipIdx(-1), 1600) : undefined}
              {...(Platform.OS === 'web' ? {
                onMouseEnter: () => setTooltipIdx(i),
                onMouseLeave: () => setTooltipIdx(-1),
              } as any : {})}
            />
          );
        })}
      </Svg>
    </Animated.View>
  );
};

export const MobileSignalDonut = ({ datos }: { datos: PuntoGrafico[] }) => {
  const ultimo = datos[datos.length - 1] || { label: '', rendimiento: 0, carga: 0, estres: 0 };
  const size = 210;
  const center = size / 2;
  const radius = 72;
  const stroke = 18;
  const circumference = 2 * Math.PI * radius;
  const values = [
    { key: 'rendimiento', label: 'Rendimiento', value: Math.max(0, Math.min(100, ultimo.rendimiento || 0)), color: BRAND.success },
    { key: 'carga', label: 'Carga', value: Math.max(0, Math.min(100, ultimo.carga || 0)), color: BRAND.warning },
    { key: 'estres', label: 'Estrés', value: Math.max(0, Math.min(100, ultimo.estres || 0)), color: BRAND.error },
  ];
  const total = values.reduce((sum, item) => sum + item.value, 0) || 1;
  let offset = 0;

  return (
    <View style={estilos.mobileDonutCard}>
      <View style={estilos.mobileDonutShell}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle cx={center} cy={center} r={radius} stroke="rgba(124,58,237,0.10)" strokeWidth={stroke} fill="transparent" />
          {values.map((item) => {
            const length = (item.value / total) * circumference;
            const dashOffset = -offset;
            offset += length;
            return (
              <Circle
                key={item.key}
                cx={center}
                cy={center}
                r={radius}
                stroke={item.color}
                strokeWidth={stroke}
                fill="transparent"
                strokeDasharray={`${Math.max(1, length)} ${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${center}, ${center}`}
              />
            );
          })}
        </Svg>
        <View style={estilos.mobileDonutCenter}>
          <Text style={estilos.mobileDonutValue}>{ultimo.rendimiento || 0}%</Text>
          <Text style={estilos.mobileDonutLabel}>salud</Text>
        </View>
      </View>
      <View style={estilos.mobileDonutLegend}>
        {values.map((item) => (
          <View key={item.key} style={estilos.mobileDonutLegendItem}>
            <View style={[estilos.mobileDonutLegendDot, { backgroundColor: item.color }]} />
            <Text style={estilos.mobileDonutLegendText}>{item.label}</Text>
            <Text style={[estilos.mobileDonutLegendValue, { color: item.color }]}>{item.value}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

/**
 * ChartSidePanel – unified compact panel showing period metrics + next events as a single table.
 */
export const ChartSidePanel = ({
  datos,
  eventos,
  metricas,
  resumenPeriodo,
  modoGrafico
}: {
  datos: PuntoGrafico[];
  eventos: any[];
  metricas: any;
  resumenPeriodo: any;
  modoGrafico: ModoGrafico;
}) => {
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const isPhone = width < 640;
  
  // Averages, Peaks, Min
  const n = datos.length || 1;
  const avgRendimiento = Math.round(datos.reduce((acc, d) => acc + d.rendimiento, 0) / n);
  const avgCarga = Math.round(datos.reduce((acc, d) => acc + d.carga, 0) / n);
  const avgEstres = Math.round(datos.reduce((acc, d) => acc + d.estres, 0) / n);

  const maxRendimiento = Math.max(...datos.map(d => d.rendimiento), 0);
  const maxCarga = Math.max(...datos.map(d => d.carga), 0);
  const maxEstres = Math.max(...datos.map(d => d.estres), 0);

  const actual = datos[datos.length - 1] || { label: t('admin.dashboard.chart.period'), rendimiento: 0, carga: 0, estres: 0 };
  const anterior = datos[datos.length - 2] || actual;

  const score = avgRendimiento - (avgEstres * 0.7) - (avgCarga * 0.3);
  let healthLabel = 'Estable';
  let healthColor = BRAND.success;
  if (score > 60) {
    healthLabel = 'Excelente';
    healthColor = BRAND.success;
  } else if (score < 30) {
    healthLabel = 'Atención';
    healthColor = BRAND.error;
  } else if (avgEstres > 50) {
    healthLabel = 'Estrés Alto';
    healthColor = BRAND.error;
  } else if (avgCarga > 75) {
    healthLabel = 'Carga Alta';
    healthColor = BRAND.warning;
  }

  const metrics = [
    {
      label: t('admin.dashboard.chart.performance'),
      actual: actual.rendimiento,
      prev: anterior.rendimiento,
      avg: avgRendimiento,
      max: maxRendimiento,
      color: BRAND.success,
      bg: 'rgba(16,185,129,0.04)'
    },
    {
      label: t('admin.dashboard.chart.load'),
      actual: actual.carga,
      prev: anterior.carga,
      avg: avgCarga,
      max: maxCarga,
      color: BRAND.warning,
      bg: 'rgba(245,158,11,0.04)'
    },
    {
      label: t('admin.dashboard.chart.stress'),
      actual: actual.estres,
      prev: anterior.estres,
      avg: avgEstres,
      max: maxEstres,
      color: BRAND.error,
      bg: 'rgba(239,68,68,0.04)'
    }
  ];

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const proximosEventos = useMemo(() =>
    (eventos || [])
      .filter((ev) => { const f = obtenerFecha(ev.inicio || ev.fechaInicio); return f && f >= hoy; })
      .sort((a, b) => (obtenerFecha(a.inicio || a.fechaInicio)?.getTime() || 0) - (obtenerFecha(b.inicio || b.fechaInicio)?.getTime() || 0))
      .slice(0, 2),
    [eventos]
  );

  const { theme } = useAdminAppearance();

  return (
      <View style={[estilos.sidePanel, isPhone && estilos.sidePanelPhone, { backgroundColor: theme.isDark ? ADMIN.fondoElevado : '#FFFFFF', borderColor: theme.isDark ? ADMIN.borde : 'rgba(91,65,150,0.16)' }]}>
      {/* Header section with Health Status */}
      <View style={[estilos.sidePanelHeader, isPhone && estilos.sidePanelHeaderPhone]}>
        <View style={{ flex: 1 }}>
          <Text style={estilos.sidePanelEyebrow}>{t('admin.dashboard.chart.period_detail')}</Text>
          <Text style={[estilos.sidePanelTitle, { marginBottom: 0 }]}>{actual.label}</Text>
        </View>
        <View style={[estilos.sidePanelBadge, { backgroundColor: healthColor + '12', borderColor: healthColor + '24' }]}>
          <View style={[estilos.sidePanelBadgeDot, { backgroundColor: healthColor }]} />
          <Text style={[estilos.sidePanelBadgeText, { color: healthColor }]}>{healthLabel}</Text>
        </View>
      </View>

      {/* Row containing the 3 metrics side by side */}
      <View style={[estilos.sideMetricsRow, isPhone && estilos.sideMetricsRowPhone]}>
        {metrics.map((m) => {
          const delta = m.actual - m.prev;
          const sign = delta > 0 ? '+' : '';
          return (
            <View key={m.label} style={[estilos.sideMetricCol, isPhone && estilos.sideMetricColPhone, { borderColor: m.color + '18', backgroundColor: m.bg }]}>
              {/* Metric title + dot */}
              <View style={estilos.sideMetricTitleContainer}>
                <View style={[estilos.sidePanelDot, { backgroundColor: m.color }]} />
                <Text style={estilos.sideMetricColLabel} numberOfLines={1}>{m.label}</Text>
              </View>
              {/* Current Value + delta */}
              <View style={[estilos.sideMetricValueContainer, isPhone && estilos.sideMetricValueContainerPhone]}>
                <Text style={[estilos.sideMetricColValue, { color: m.color }]}>{m.actual}%</Text>
                <Text style={[estilos.sideMetricColDelta, { color: delta > 0 ? BRAND.success : delta < 0 ? BRAND.error : BRAND.textSec }]}>
                  {delta === 0 ? '—' : `${sign}${delta}%`}
                </Text>
              </View>
              {/* Stats below */}
              <View style={[estilos.sideMetricStats, isPhone && estilos.sideMetricStatsPhone]}>
                <Text style={estilos.sideMetricStatText}>Prom: <Text style={{ color: BRAND.textMain }}>{m.avg}%</Text></Text>
                <Text style={estilos.sideMetricStatText}>Max: <Text style={{ color: BRAND.textMain }}>{m.max}%</Text></Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Divider */}
      <View style={estilos.sidePanelDivider} />

      {/* Bottom section with Advisor Insight & Agenda side-by-side */}
      <View style={[estilos.sidePanelBottomRow, isPhone && estilos.sidePanelBottomRowPhone]}>
        {/* Control de Jornada */}
        <View style={[estilos.sideAdvisorCol, isPhone && estilos.sideStackedColPhone]}>
          <Text style={estilos.sidePanelEyebrow}>Control de Jornada</Text>
          <View style={[estilos.sideAdvisorCard, isPhone && estilos.sideAdvisorCardPhone, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(91,65,150,0.03)', borderColor: theme.isDark ? ADMIN.borde : 'rgba(91,65,150,0.08)' }]}>
            <View style={{ gap: 5 }}>
              {/* Fila 1: Asistencia */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: BRAND.textMain, fontSize: 10.5, fontWeight: '700' }}>Asistencia</Text>
                  <Text style={{ color: BRAND.textSec, fontSize: 9 }}>
                    {modoGrafico === 'diario' ? 'Promedio: últimos 8 días' : modoGrafico === 'semanal' ? 'Promedio: últimas 8 sem.' : 'Promedio: últimos 8 mes.'}
                  </Text>
                </View>
                <View style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  backgroundColor: 'rgba(16,185,129,0.08)'
                }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: BRAND.success }}>
                    {resumenPeriodo?.asistenciaPct ?? 0}%
                  </Text>
                </View>
              </View>

              {/* Fila 2: Tiempo Laborado */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)', paddingTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: BRAND.textMain, fontSize: 10.5, fontWeight: '700' }}>Tiempo Laborado</Text>
                  <Text style={{ color: BRAND.textSec, fontSize: 9 }}>Total acumulado</Text>
                </View>
                <View style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  backgroundColor: 'rgba(59,130,246,0.08)'
                }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: '#3B82F6' }}>
                    {resumenPeriodo?.tiempoTrabajado ?? '0h 0m'}
                  </Text>
                </View>
              </View>

              {/* Fila 3: Check-ins Hechos */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)', paddingTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: BRAND.textMain, fontSize: 10.5, fontWeight: '700' }}>Check-ins Hechos</Text>
                  <Text style={{ color: BRAND.textSec, fontSize: 9 }}>
                    {modoGrafico === 'diario' ? 'Total: últimos 8 días' : modoGrafico === 'semanal' ? 'Total: últimas 8 sem.' : 'Total: últimos 8 mes.'}
                  </Text>
                </View>
                <View style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  backgroundColor: 'rgba(16,185,129,0.08)'
                }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: BRAND.success }}>
                    {resumenPeriodo?.checkInsPeriodo ?? 0}
                  </Text>
                </View>
              </View>

              {/* Fila 4: Aprobaciones sin resolver */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)', paddingTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: BRAND.textMain, fontSize: 10.5, fontWeight: '700' }}>Aprobaciones</Text>
                  <Text style={{ color: BRAND.textSec, fontSize: 9 }}>
                    {modoGrafico === 'diario' ? 'Pendientes: últimos 8 días' : modoGrafico === 'semanal' ? 'Pendientes: últimas 8 sem.' : 'Pendientes: últimos 8 mes.'}
                  </Text>
                </View>
                <View style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  backgroundColor: (resumenPeriodo?.aprobacionesPendientes || 0) > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)'
                }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: (resumenPeriodo?.aprobacionesPendientes || 0) > 0 ? BRAND.error : BRAND.success }}>
                    {resumenPeriodo?.aprobacionesPendientes ?? 0}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Agenda column */}
        <View style={[estilos.sideAgendaCol, isPhone && estilos.sideStackedColPhone]}>
          <Text style={estilos.sidePanelEyebrow}>{t('admin.dashboard.chart.corporate_agenda')}</Text>
          <View style={{ gap: 6, marginTop: 4 }}>
            {proximosEventos.length > 0 ? (
              proximosEventos.map((ev) => {
                const fecha = obtenerFecha(ev.inicio || ev.fechaInicio);
                const dia = fecha ? fecha.getDate().toString().padStart(2, '0') : '--';
                const locale = i18n.language === 'es' ? 'es-SV' : 'en-US';
                const mes = fecha ? fecha.toLocaleDateString(locale, { month: 'short' }).substring(0, 3).toUpperCase().replace('.', '') : '---';
                return (
                  <View key={ev.id} style={estilos.sideEventRow}>
                    <View style={estilos.sideEventDate}>
                      <Text style={estilos.sideEventDay}>{dia}</Text>
                      <Text style={estilos.sideEventMonth}>{mes}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={estilos.sideEventName} numberOfLines={1}>{ev.titulo}</Text>
                      <Text style={estilos.sideEventDesc} numberOfLines={1}>{ev.descripcion || t('admin.dashboard.chart.no_description')}</Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={[estilos.sideEventEmptyHorizontal, isPhone && estilos.sideEventEmptyHorizontalPhone, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(91,65,150,0.03)', borderColor: theme.isDark ? ADMIN.borde : 'rgba(91,65,150,0.08)' }]}>
                <Text style={estilos.sidePanelRowDelta}>{t('admin.dashboard.chart.no_events')}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

// Legacy aliases kept so old render references still compile (now replaced below)
export const ChartEventsPanel = ({ eventos }: { eventos: any[] }) => null;
export const ChartDetailPanel = ({ datos }: { datos: PuntoGrafico[] }) => null;

/*** Componente LegendItem. Renderiza una unidad visual de la pantalla y concentra la interaccion asociada a esa vista.
 */
export const LegendItem = ({ color, label, value }: { color: string; label: string; value: string }) => (
  // Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion.
  <View style={estilos.legendChartItem}>
    {/* Bloque visual administrativo; agrupa informacion o controles dentro del panel de gestion. */}
    <View style={[estilos.legendChartDot, { backgroundColor: color }]} />
    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
    <Text style={estilos.legendChartLabel}>{label}</Text>
    {/* Texto visible; presenta titulos, etiquetas, valores o descripciones al usuario. */}
    <Text style={[estilos.legendChartValue, { color }]}>{value}</Text>
  </View>
);

