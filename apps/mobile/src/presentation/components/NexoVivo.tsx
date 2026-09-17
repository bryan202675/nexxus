import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type FormaNexo = 'nube' | 'huevo' | 'circulo' | 'cuadrado' | 'rombo' | 'gota' | 'capsula' | 'onda' | 'bloque';
type ExpresionNexo = 'alegre' | 'curioso' | 'dormido' | 'asombrado' | 'alerta' | 'sospecha' | 'timido' | 'sonrisa';
type MiradaNexo = 'izquierda' | 'centro' | 'derecha' | 'arriba';
type AccesorioNexo = 'casco' | 'gafas';

interface NexoVivoProps {
  color: string;
  forma: FormaNexo;
  expresion: ExpresionNexo;
  mirada: MiradaNexo;
  ojosRedondos?: boolean;
  espiando?: boolean;
  retrasoEspia?: number;
  accesorio?: AccesorioNexo;
  ojosCerrados?: boolean;
  size: number;
  drift: number;
  delay?: number;
  reduceMotion: boolean;
  style?: StyleProp<ViewStyle>;
}

const estilosForma: Record<FormaNexo, ViewStyle> = {
  nube: { borderRadius: 999 },
  huevo: { borderRadius: 999, borderTopLeftRadius: 54, borderTopRightRadius: 54 },
  circulo: { borderRadius: 999 },
  cuadrado: { borderRadius: 12 },
  rombo: { borderRadius: 13 },
  gota: { borderRadius: 28, borderTopRightRadius: 7, borderBottomLeftRadius: 7 },
  capsula: { borderRadius: 999 },
  onda: { borderRadius: 22, borderTopLeftRadius: 32, borderBottomRightRadius: 32 },
  bloque: { borderRadius: 15, borderTopLeftRadius: 28 },
};

const dimensionesForma: Record<FormaNexo, { width: number; height: number; rotate: number }> = {
  nube: { width: 1.02, height: 0.86, rotate: 0 },
  huevo: { width: 0.84, height: 1.06, rotate: 0 },
  circulo: { width: 1, height: 1, rotate: 0 },
  cuadrado: { width: 0.96, height: 0.96, rotate: 0 },
  rombo: { width: 0.92, height: 0.92, rotate: 45 },
  gota: { width: 0.9, height: 1, rotate: -8 },
  capsula: { width: 1.06, height: 0.84, rotate: 0 },
  onda: { width: 1, height: 0.94, rotate: 0 },
  bloque: { width: 0.98, height: 0.96, rotate: 0 },
};

const expresiones: Record<ExpresionNexo, { ancho: number; alto: number; separacion: number; desplazamientoY: number; giroIzquierdo: string; giroDerecho: string }> = {
  alegre: { ancho: 1, alto: 0.88, separacion: 1.1, desplazamientoY: 0, giroIzquierdo: '-13deg', giroDerecho: '13deg' },
  curioso: { ancho: 0.9, alto: 1.08, separacion: 1.2, desplazamientoY: -0.02, giroIzquierdo: '11deg', giroDerecho: '-5deg' },
  dormido: { ancho: 1.4, alto: 0.22, separacion: 0.9, desplazamientoY: 0.03, giroIzquierdo: '8deg', giroDerecho: '-8deg' },
  asombrado: { ancho: 1.28, alto: 1.18, separacion: 1.2, desplazamientoY: 0, giroIzquierdo: '0deg', giroDerecho: '0deg' },
  alerta: { ancho: 0.92, alto: 1.24, separacion: 1.25, desplazamientoY: -0.04, giroIzquierdo: '-4deg', giroDerecho: '4deg' },
  sospecha: { ancho: 1.08, alto: 0.72, separacion: 0.95, desplazamientoY: 0.02, giroIzquierdo: '-14deg', giroDerecho: '-14deg' },
  timido: { ancho: 0.82, alto: 0.8, separacion: 0.78, desplazamientoY: 0.07, giroIzquierdo: '5deg', giroDerecho: '-5deg' },
  sonrisa: { ancho: 1, alto: 1, separacion: 1, desplazamientoY: 0, giroIzquierdo: '0deg', giroDerecho: '0deg' },
};

export default function NexoVivo({ color, forma, expresion, mirada, ojosRedondos = false, espiando = false, retrasoEspia = 0, accesorio, ojosCerrados = false, size, drift, delay = 0, reduceMotion, style }: NexoVivoProps) {
  const progreso = useRef(new Animated.Value(0)).current;
  const progresoEspia = useRef(new Animated.Value(0)).current;
  const cierreEspia = useRef(new Animated.Value(0)).current;
  const cierreManual = useRef(new Animated.Value(1)).current;
  const dimensiones = dimensionesForma[forma];
  const expresionVisual = expresiones[expresion];

  useEffect(() => {
    if (reduceMotion) {
      progreso.setValue(0);
      return undefined;
    }

    const ciclo = Animated.sequence([
      Animated.timing(progreso, { toValue: 1, duration: 1800 + delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(progreso, { toValue: 0, duration: 1800 + delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]);
    const animacion = Animated.sequence([Animated.delay(delay), Animated.loop(ciclo)]);
    animacion.start();
    return () => animacion.stop();
  }, [delay, progreso, reduceMotion]);

  useEffect(() => {
    const cerrar = Animated.timing(cierreEspia, {
      toValue: espiando ? 1 : 0,
      duration: reduceMotion ? 0 : 180,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
      useNativeDriver: true,
    });

    if (!espiando) {
      progresoEspia.stopAnimation();
      progresoEspia.setValue(0);
      cerrar.start();
      return undefined;
    }

    const cicloEspia = Animated.loop(Animated.sequence([
      Animated.delay(retrasoEspia),
      Animated.timing(progresoEspia, { toValue: 1, duration: reduceMotion ? 0 : 160, easing: Easing.bezier(0.23, 1, 0.32, 1), useNativeDriver: true }),
      Animated.delay(reduceMotion ? 0 : 280),
      Animated.timing(progresoEspia, { toValue: 0, duration: reduceMotion ? 0 : 160, easing: Easing.bezier(0.23, 1, 0.32, 1), useNativeDriver: true }),
      Animated.delay(Math.max(0, 4200 - retrasoEspia)),
    ]));
    cerrar.start();
    cicloEspia.start();
    return () => cicloEspia.stop();
  }, [cierreEspia, espiando, progresoEspia, reduceMotion, retrasoEspia]);

  useEffect(() => {
    Animated.timing(cierreManual, {
      toValue: ojosCerrados ? 0.12 : 1,
      duration: reduceMotion ? 0 : 220,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
      useNativeDriver: true,
    }).start();
  }, [cierreManual, ojosCerrados, reduceMotion]);

  const miradaBase = mirada === 'izquierda' ? -size * 0.15 : mirada === 'derecha' ? size * 0.15 : 0;
  const miradaVertical = size * expresionVisual.desplazamientoY + (mirada === 'arriba' ? -size * 0.14 : 0);
  const miradaX = progreso.interpolate({ inputRange: [0, 0.5, 1], outputRange: [miradaBase - 0.9, miradaBase + 0.9, miradaBase - 0.9] });
  const giro = progreso.interpolate({ inputRange: [0, 1], outputRange: ['-1.5deg', '1.5deg'] });
  const parpadeo = progreso.interpolate({ inputRange: [0, 0.42, 0.46, 0.52, 0.58, 1], outputRange: [1, 1, 0.12, 0.12, 1, 1] });
  const escalaOjoIzquierdo = cierreEspia.interpolate({ inputRange: [0, 1], outputRange: [1, 0.12] });
  const escalaOjoDerecho = Animated.add(
    cierreEspia.interpolate({ inputRange: [0, 1], outputRange: [1, 0.12] }),
    progresoEspia.interpolate({ inputRange: [0, 1], outputRange: [0, 0.88] }),
  );
  const desplazamientoEspia = progresoEspia.interpolate({ inputRange: [0, 1], outputRange: [0, size * 0.06] });

  return (
    <Animated.View pointerEvents="none" style={[estilos.nexo, style, { width: size, height: size, transform: [
      { translateY: progreso.interpolate({ inputRange: [0, 1], outputRange: [-drift, drift] }) },
      { translateX: progreso.interpolate({ inputRange: [0, 1], outputRange: [drift * 0.3, -drift * 0.3] }) },
      { rotate: giro },
    ] }]}>
      <View style={[estilos.cuerpo, estilosForma[forma], { width: size * dimensiones.width, height: size * dimensiones.height, backgroundColor: color, transform: [{ rotate: `${dimensiones.rotate}deg` }] }]}>
        {forma === 'nube' && <><View style={[estilos.nubeBulto, estilos.nubeBultoIzquierdo, { backgroundColor: color }]} /><View style={[estilos.nubeBulto, estilos.nubeBultoDerecho, { backgroundColor: color }]} /></>}
        {accesorio === 'casco' && <View style={estilos.casco}><View style={estilos.cascoCopa} /><View style={estilos.cascoBanda} /><View style={estilos.cascoVisera} /></View>}
        <View style={[estilos.cara, { transform: [{ rotate: `${-dimensiones.rotate}deg` }] }]}>
          <Animated.View style={[estilos.ojos, { gap: size * 0.1 * expresionVisual.separacion, transform: [{ translateX: miradaX }, { translateX: desplazamientoEspia }, { translateY: miradaVertical }, { scaleY: Animated.multiply(espiando ? 1 : parpadeo, cierreManual) }] }]}>
            <Animated.View style={[estilos.ojo, { width: ojosRedondos ? size * 0.19 : size * 0.12 * expresionVisual.ancho, height: ojosRedondos ? size * 0.19 : size * 0.3 * expresionVisual.alto, transform: [{ rotate: expresionVisual.giroIzquierdo }, { scaleY: escalaOjoIzquierdo }] }]} />
            <Animated.View style={[estilos.ojo, { width: ojosRedondos ? size * 0.19 : size * 0.12 * expresionVisual.ancho, height: ojosRedondos ? size * 0.19 : size * 0.3 * expresionVisual.alto, transform: [{ rotate: expresionVisual.giroDerecho }, { scaleY: escalaOjoDerecho }] }]} />
          </Animated.View>
          {accesorio === 'gafas' && <View style={estilos.gafas}><View style={estilos.lente} /><View style={estilos.puenteGafas} /><View style={estilos.lente} /></View>}
        </View>
      </View>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  nexo: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  cuerpo: { alignItems: 'center', justifyContent: 'center', shadowColor: '#0A0A0F', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 5 },
  cara: { alignItems: 'center', justifyContent: 'center' },
  casco: { position: 'absolute', top: '-13%', width: '82%', height: '34%', alignItems: 'center', zIndex: 2 },
  cascoCopa: { width: '78%', height: '82%', borderTopLeftRadius: 999, borderTopRightRadius: 999, backgroundColor: '#F59E0B' },
  cascoBanda: { position: 'absolute', top: '62%', width: '80%', height: '16%', borderRadius: 99, backgroundColor: '#D97706' },
  cascoVisera: { position: 'absolute', bottom: '1%', width: '94%', height: '14%', borderRadius: 99, backgroundColor: '#B45309' },
  gafas: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 2 },
  lente: { width: 10, height: 8, borderRadius: 3, backgroundColor: '#111827' },
  puenteGafas: { width: 3, height: 2, borderRadius: 99, backgroundColor: '#111827' },
  nubeBulto: { position: 'absolute', width: '54%', height: '82%', borderRadius: 999, bottom: '-8%', zIndex: -1 },
  nubeBultoIzquierdo: { left: '2%' },
  nubeBultoDerecho: { right: '2%' },
  ojos: { flexDirection: 'row', alignItems: 'center' },
  ojo: { borderRadius: 99, backgroundColor: '#FFFFFF' },
});
