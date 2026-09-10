import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVoiceActivity, updateVoiceActivity } from '../../src/features/voice/services/voiceActivity.ts';

test('background noise does not submit an empty turn', () => {
  const state = createVoiceActivity(0);
  for (let now = 0; now < 30000; now += 150) {
    assert.equal(updateVoiceActivity(state, now % 300 ? 0.55 : 0.57, now), false);
  }
});

test('speech above background closes 600ms after silence, before the old 6s limit', () => {
  const state = createVoiceActivity(0);
  for (let now = 0; now <= 1200; now += 150) {
    assert.equal(updateVoiceActivity(state, now < 300 ? 0.55 : 0.7, now), false);
  }
  for (let now = 1350; now < 1950; now += 150) {
    assert.equal(updateVoiceActivity(state, 0.55, now), false);
  }
  assert.equal(updateVoiceActivity(state, 0.55, 1950), true);
});

test('a short pause does not cut off a sentence', () => {
  const state = createVoiceActivity(0);
  [0, 150].forEach(now => updateVoiceActivity(state, 0.1, now));
  updateVoiceActivity(state, 0.5, 300);
  updateVoiceActivity(state, 0.1, 450);
  assert.equal(updateVoiceActivity(state, 0.5, 750), false);
  assert.equal(state.silenceAt, null);
});

test('continuous speech closes at the duration limit and resets for a new call', () => {
  const state = createVoiceActivity(0);
  updateVoiceActivity(state, 0.1, 0);
  updateVoiceActivity(state, 0.5, 300);
  assert.equal(updateVoiceActivity(state, 0.5, 20299), false);
  assert.equal(updateVoiceActivity(state, 0.5, 20300), true);
  assert.equal(createVoiceActivity(21000).speechAt, null);
});
