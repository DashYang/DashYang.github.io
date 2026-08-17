import fs from 'node:fs';
import path from 'node:path';

// "Noise" — a seamless, 16-bar ambient suspense loop.
const sampleRate = 48_000;
const bpm = 80;
const beats = 64;
const duration = beats * 60 / bpm;
const frames = Math.round(duration * sampleRate);
const left = new Float64Array(frames);
const right = new Float64Array(frames);
const beatSeconds = 60 / bpm;

function addTone(start, length, frequency, volume, pan = 0, type = 'sine') {
  const startFrame = Math.max(0, Math.floor(start * sampleRate));
  const endFrame = Math.min(frames, Math.ceil((start + length) * sampleRate));
  const lGain = Math.sqrt((1 - pan) / 2);
  const rGain = Math.sqrt((1 + pan) / 2);
  for (let i = startFrame; i < endFrame; i++) {
    const t = (i - startFrame) / sampleRate;
    const attack = Math.min(1, t / 0.08);
    const release = Math.min(1, (endFrame - i) / (sampleRate * 0.35));
    const envelope = attack * release;
    const phase = 2 * Math.PI * frequency * t;
    const wave = type === 'triangle'
      ? (2 / Math.PI) * Math.asin(Math.sin(phase))
      : Math.sin(phase);
    left[i] += wave * volume * envelope * lGain;
    right[i] += wave * volume * envelope * rGain;
  }
}

function addKnock(start, pan) {
  const startFrame = Math.floor(start * sampleRate);
  const length = Math.floor(0.11 * sampleRate);
  const lGain = Math.sqrt((1 - pan) / 2);
  const rGain = Math.sqrt((1 + pan) / 2);
  for (let n = 0; n < length && startFrame + n < frames; n++) {
    const t = n / sampleRate;
    const body = Math.sin(2 * Math.PI * 92 * t) * Math.exp(-26 * t);
    const click = (Math.sin(2 * Math.PI * 1160 * t) + Math.sin(2 * Math.PI * 1770 * t) * 0.35) * Math.exp(-70 * t);
    const v = (body + click * 0.25) * 0.12;
    left[startFrame + n] += v * lGain;
    right[startFrame + n] += v * rGain;
  }
}

// Low apartment-building hum; its phase lands exactly at the loop boundary.
for (let i = 0; i < frames; i++) {
  const t = i / sampleRate;
  const hum = Math.sin(2 * Math.PI * 50 * t) * 0.055 + Math.sin(2 * Math.PI * 100 * t) * 0.012;
  const air = (Math.sin(2 * Math.PI * 0.125 * t) + 1) * 0.008;
  left[i] += hum + air;
  right[i] += hum + air * 0.92;
}

// Sparse D-minor piano-like motif, increasingly uneasy in the second half.
const phrases = [
  [62, 65, 69, 65], [62, 64, 67, 64], [60, 65, 69, 67], [62, 65, 64, 60],
  [62, 65, 70, 69], [67, 65, 64, 62], [60, 64, 67, 70], [69, 65, 62, 61],
];
const midiHz = (midi) => 440 * 2 ** ((midi - 69) / 12);
for (let bar = 0; bar < 16; bar++) {
  const phrase = phrases[Math.floor(bar / 2)];
  for (let step = 0; step < 4; step++) {
    const start = (bar * 4 + step) * beatSeconds;
    addTone(start, beatSeconds * 0.9, midiHz(phrase[step]), 0.10, step % 2 ? 0.18 : -0.12, 'triangle');
    addTone(start, beatSeconds * 0.82, midiHz(phrase[step] - 12), 0.034, 0, 'sine');
  }
}

// Distant, irregular renovation sounds: restrained so they read as atmosphere.
[[7.5, -0.55], [15.0, 0.45], [22.5, -0.2], [31.5, 0.52], [39.0, -0.42]].forEach(([t, pan]) => addKnock(t, pan));

const out = Buffer.alloc(44 + frames * 4);
out.write('RIFF', 0); out.writeUInt32LE(out.length - 8, 4); out.write('WAVE', 8);
out.write('fmt ', 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20);
out.writeUInt16LE(2, 22); out.writeUInt32LE(sampleRate, 24); out.writeUInt32LE(sampleRate * 4, 28);
out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(frames * 4, 40);
for (let i = 0; i < frames; i++) {
  out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[i])) * 32767), 44 + i * 4);
  out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[i])) * 32767), 46 + i * 4);
}

const target = path.resolve('assets/noise_bgm.wav');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, out);
console.log(`Wrote ${target} (${duration}s, stereo PCM WAV)`);
