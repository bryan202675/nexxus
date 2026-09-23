import React from 'react';

type FormaNexo = 'nube' | 'huevo' | 'circulo' | 'cuadrado' | 'rombo' | 'gota' | 'capsula' | 'onda' | 'bloque';
type ExpresionNexo = 'alegre' | 'curioso' | 'dormido' | 'asombrado' | 'alerta' | 'sospecha' | 'timido' | 'sonrisa';
type MiradaNexo = 'izquierda' | 'centro' | 'derecha' | 'arriba';

interface NexoVivoProps {
  color: string;
  forma: FormaNexo;
  expresion: ExpresionNexo;
  mirada: MiradaNexo;
  ojosRedondos?: boolean;
  size: number;
  drift: number;
  delay?: number;
  espiando?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const getStylesForForma = (forma: FormaNexo, color: string, size: number) => {
  let borderRadius = "999px";
  let widthMultiplier = 1;
  let heightMultiplier = 1;
  let rotate = 0;

  switch (forma) {
    case 'nube':
      widthMultiplier = 1.02; heightMultiplier = 0.86;
      break;
    case 'huevo':
      widthMultiplier = 0.84; heightMultiplier = 1.06;
      borderRadius = "54px 54px 999px 999px";
      break;
    case 'circulo':
      break;
    case 'cuadrado':
      widthMultiplier = 0.96; heightMultiplier = 0.96;
      borderRadius = "12px";
      break;
    case 'rombo':
      widthMultiplier = 0.92; heightMultiplier = 0.92;
      borderRadius = "13px";
      rotate = 45;
      break;
    case 'gota':
      widthMultiplier = 0.9; heightMultiplier = 1;
      borderRadius = "28px 7px 28px 28px"; // close enough to RN
      rotate = -8;
      break;
    case 'capsula':
      widthMultiplier = 1.06; heightMultiplier = 0.84;
      break;
    case 'onda':
      widthMultiplier = 1; heightMultiplier = 0.94;
      borderRadius = "32px 22px 32px 22px";
      break;
    case 'bloque':
      widthMultiplier = 0.98; heightMultiplier = 0.96;
      borderRadius = "28px 15px 15px 15px";
      break;
  }

  return {
    width: size * widthMultiplier,
    height: size * heightMultiplier,
    backgroundColor: color,
    borderRadius,
    rotate: `${rotate}deg`,
    boxShadow: "0px 8px 14px rgba(10, 10, 15, 0.18)"
  };
};

const getExpresion = (exp: ExpresionNexo) => {
  switch(exp) {
    case 'alegre': return { ancho: 1, alto: 0.88, sep: 1.1, rotL: '-13deg', rotR: '13deg', dy: 0 };
    case 'curioso': return { ancho: 0.9, alto: 1.08, sep: 1.2, rotL: '11deg', rotR: '-5deg', dy: -0.02 };
    case 'dormido': return { ancho: 1.4, alto: 0.22, sep: 0.9, rotL: '8deg', rotR: '-8deg', dy: 0.03 };
    case 'asombrado': return { ancho: 1.28, alto: 1.18, sep: 1.2, rotL: '0deg', rotR: '0deg', dy: 0 };
    case 'alerta': return { ancho: 0.92, alto: 1.24, sep: 1.25, rotL: '-4deg', rotR: '4deg', dy: -0.04 };
    case 'sospecha': return { ancho: 1.08, alto: 0.72, sep: 0.95, rotL: '-14deg', rotR: '-14deg', dy: 0.02 };
    case 'timido': return { ancho: 0.82, alto: 0.8, sep: 0.78, rotL: '5deg', rotR: '-5deg', dy: 0.07 };
    case 'sonrisa': return { ancho: 1, alto: 1, sep: 1, rotL: '0deg', rotR: '0deg', dy: 0 };
  }
};

export default function NexoVivo({ color, forma, expresion, mirada, ojosRedondos, size, drift, delay = 0, espiando = false, style, className = "" }: NexoVivoProps) {
  const cStyles = getStylesForForma(forma, color, size);
  const exp = getExpresion(expresion);

  // Cuando está espiando, miran un poco más hacia la izquierda/derecha y cierran un poco los ojos.
  const baseShift = espiando ? (size * 0.06) : 0;
  const miradaBase = mirada === 'izquierda' ? -size * 0.15 : mirada === 'derecha' ? size * 0.15 : 0;
  const miradaX = miradaBase + baseShift;
  const miradaVertical = size * exp.dy + (mirada === 'arriba' ? -size * 0.14 : 0);
  
  const ojoW = ojosRedondos ? size * 0.19 : size * 0.12 * exp.ancho;
  const ojoH = ojosRedondos ? size * 0.19 : size * 0.3 * exp.alto;
  const gap = size * 0.1 * exp.sep;

  const animationName = `floatNexo-${Math.floor(drift)}`;
  const blinkAnim = `blinkNexo`;

  const ojoStyle = { 
    width: ojoW, 
    height: ojoH, 
    transition: 'transform 0.3s ease-out'
  };

  return (
    <>
      <style>{`
        @keyframes ${animationName} {
          0%, 100% { transform: translateY(-${drift}px) translateX(${drift * 0.3}px) rotate(-1.5deg); }
          50% { transform: translateY(${drift}px) translateX(-${drift * 0.3}px) rotate(1.5deg); }
        }
        @keyframes ${blinkAnim} {
          0%, 42%, 58%, 100% { transform: scaleY(1); }
          46%, 52% { transform: scaleY(0.12); }
        }
      `}</style>
      <div 
        className={`absolute flex items-center justify-center ${className}`} 
        style={{ 
          width: size, 
          height: size, 
          animation: `${animationName} 3.6s ease-in-out infinite`,
          animationDelay: `${delay}ms`,
          ...style 
        }}
      >
        <div className="flex items-center justify-center relative transition-transform duration-300" style={cStyles}>
          {forma === 'nube' && (
            <>
              <div className="absolute rounded-full" style={{ width: '54%', height: '82%', bottom: '-8%', left: '2%', backgroundColor: color, zIndex: -1 }} />
              <div className="absolute rounded-full" style={{ width: '54%', height: '82%', bottom: '-8%', right: '2%', backgroundColor: color, zIndex: -1 }} />
            </>
          )}
          <div className="flex items-center justify-center" style={{ transform: `rotate(-${parseFloat(cStyles.rotate as string)}deg)` }}>
            <div 
              className="flex items-center transition-all duration-300" 
              style={{ 
                gap, 
                transform: `translateX(${miradaX}px) translateY(${miradaVertical}px)`,
                animation: espiando ? 'none' : `${blinkAnim} 3.6s infinite`,
                animationDelay: `${delay}ms`
              }}
            >
              <div className="bg-white rounded-full" style={{ ...ojoStyle, transform: `rotate(${exp.rotL}) scaleY(${espiando ? 0.15 : 1})` }} />
              <div className="bg-white rounded-full" style={{ ...ojoStyle, transform: `rotate(${exp.rotR}) scaleY(${espiando ? 0.35 : 1})` }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
