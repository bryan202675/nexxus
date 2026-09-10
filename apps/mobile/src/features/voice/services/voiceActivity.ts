export interface VoiceActivity {
  startedAt: number;
  noise: number;
  peak: number;
  speechAt: number | null;
  silenceAt: number | null;
}

export const createVoiceActivity = (now: number): VoiceActivity => ({
  startedAt: now, noise: 1, peak: 0, speechAt: null, silenceAt: null,
});

// Levels are normalized decibels: subtract a margin, rather than multiplying
// them as if they were linear amplitude. Calibrate against the room first.
export function updateVoiceActivity(state: VoiceActivity, level: number, now: number): boolean {
  if (!Number.isFinite(level)) return false;
  if (now - state.startedAt < 300) {
    state.noise = Math.min(state.noise, level);
    return false;
  }
  if (state.speechAt === null) {
    state.noise = Math.min(state.noise, level);
    if (level < state.noise + 0.06) return false;
    state.speechAt = now;
    state.peak = level;
  }
  state.peak = Math.max(state.peak, level);
  const silenceThreshold = Math.max(state.noise + 0.025, state.peak - 0.06);
  if (level > silenceThreshold) state.silenceAt = null;
  else state.silenceAt ??= now;
  return (state.silenceAt !== null && now - state.silenceAt >= 600)
    || now - state.speechAt >= 20000;
}
