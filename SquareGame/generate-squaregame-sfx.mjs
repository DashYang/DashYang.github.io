#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(scriptDir, "squaregame-audio.js");
const sampleRate = 22050;
const durationSeconds = 0.12;
const sampleCount = Math.round(sampleRate * durationSeconds);
const pcm = Buffer.alloc(sampleCount);

let phase = 0;
for (let index = 0; index < sampleCount; index += 1) {
  const progress = index / Math.max(1, sampleCount - 1);
  const frequency = 720 * Math.pow(880 / 720, progress);
  phase += (Math.PI * 2 * frequency) / sampleRate;
  const attack = Math.min(1, progress / 0.08);
  const release = Math.pow(1 - progress, 2.2);
  const fundamental = Math.sin(phase);
  const sparkle = 0.22 * Math.sin(phase * 2.01);
  const sample = Math.max(-1, Math.min(1, (fundamental + sparkle) * attack * release * 0.62));
  pcm[index] = Math.max(0, Math.min(255, Math.round(127.5 + sample * 127.5)));
}

const source = `(function () {
  "use strict";

  var SAMPLE_RATE = ${sampleRate};
  var PCM_U8_BASE64 = "${pcm.toString("base64")}";
  var cachedSamples = null;
  var audioContext = null;
  var audioBuffer = null;

  function samples() {
    if (cachedSamples) return cachedSamples;
    var binary = window.atob(PCM_U8_BASE64);
    cachedSamples = new Uint8Array(binary.length);
    for (var index = 0; index < binary.length; index += 1) {
      cachedSamples[index] = binary.charCodeAt(index);
    }
    return cachedSamples;
  }

  function context() {
    if (audioContext) return audioContext;
    var AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
    return audioContext;
  }

  function buffer(ctx) {
    if (audioBuffer) return audioBuffer;
    var values = samples();
    audioBuffer = ctx.createBuffer(1, values.length, SAMPLE_RATE);
    var channel = audioBuffer.getChannelData(0);
    for (var index = 0; index < values.length; index += 1) {
      channel[index] = (values[index] - 127.5) / 127.5;
    }
    return audioBuffer;
  }

  function unlock() {
    try {
      var ctx = context();
      if (ctx && ctx.state === "suspended") ctx.resume().catch(function () {});
    } catch (_) {}
  }

  function play(combo) {
    try {
      var ctx = context();
      if (!ctx) return;
      var start = function () {
        var source = ctx.createBufferSource();
        var gain = ctx.createGain();
        source.buffer = buffer(ctx);
        source.playbackRate.value = Math.min(1.28, 1 + Math.max(0, combo - 1) * 0.06);
        gain.gain.value = 0.38;
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start();
      };
      if (ctx.state === "suspended") {
        ctx.resume().then(start).catch(function () {});
      } else {
        start();
      }
    } catch (_) {}
  }

  try {
    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("touchstart", unlock, { once: true, passive: true });
  } catch (_) {}

  window.SQUAREGAME_EMBEDDED_AUDIO = Object.freeze({
    durationSec: samples().length / SAMPLE_RATE,
    play: play,
    unlock: unlock
  });
})();
`;

fs.writeFileSync(outputPath, source);
console.log(`Generated ${outputPath}`);
