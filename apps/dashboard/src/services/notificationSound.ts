// Campanilla corta sintetizada con Web Audio API para las alertas de bienestar --
// sin archivo de audio nuevo. Envuelta en try/catch porque algunos navegadores
// bloquean AudioContext hasta que hubo un gesto previo del usuario en la pagina.

let sharedContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedContext) sharedContext = new Ctor();
  return sharedContext;
}

function tone(ctx: AudioContext, frequency: number, startTime: number, duration: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

export function playAlertChime() {
  try {
    const ctx = getContext();
    if (!ctx) return;
    const sonar = () => {
      const now = ctx.currentTime;
      tone(ctx, 880, now, 0.22);
      tone(ctx, 1320, now + 0.14, 0.26);
    };
    // Si el contexto sigue "suspended" (recien creado, o el navegador lo pauso), hay que
    // esperar a que resume() confirme antes de programar los tonos -- si se programan de
    // inmediato con ctx.currentTime aun en 0/desactualizado, la primera activacion puede
    // quedar muda.
    if (ctx.state === "suspended") {
      ctx.resume().then(sonar).catch(() => {});
    } else {
      sonar();
    }
  } catch {
    // Silencioso: el navegador puede bloquear audio sin interaccion previa del usuario.
  }
}
