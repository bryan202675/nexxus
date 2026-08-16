export function generarTonoPruebaPCM16(
  duracionMs: number,
  sampleRate: number,
  frecuenciaHz: number,
): Uint8Array {
  const totalMuestras = Math.floor((duracionMs / 1000) * sampleRate);
  const buffer = new Uint8Array(totalMuestras * 2);
  const view = new DataView(buffer.buffer);
  const fadeMuestras = Math.min(totalMuestras / 2, sampleRate * 0.01);

  for (let i = 0; i < totalMuestras; i++) {
    const t = i / sampleRate;
    let amplitud = 0.35;
    if (i < fadeMuestras) amplitud *= i / fadeMuestras;
    else if (i > totalMuestras - fadeMuestras) amplitud *= (totalMuestras - i) / fadeMuestras;

    const muestra = Math.sin(2 * Math.PI * frecuenciaHz * t) * amplitud;
    view.setInt16(i * 2, Math.round(muestra * 32767), true);
  }

  return buffer;
}

export function normalizarNivelAudio(valor: number): number {
  if (!Number.isFinite(valor)) return 0;
  return Math.min(1, Math.max(0, valor));
}
