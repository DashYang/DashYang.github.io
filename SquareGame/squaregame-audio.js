(function () {
  "use strict";

  var SAMPLE_RATE = 22050;
  var PCM_U8_BASE64 = "gICAgYGCgoKCgoKBgYCAf359fHt6eXd2dnZ3eXt+gYSHioyNjY2MiomHhYOBgH57eXZzcG1ramtsb3R5f4aMkZWXmJiWlJGOioeEgX57d3NuaWVhX19hZWtzfIWOlpygoqKgnZmVkYyIhIB8dnFqZF5YVVRWWmFrdoKOmaGnq6uqpqKcl5KNiIN9d3BoX1dRTEpLUFhjcX+Om6ausrSyr6qknpeSjIZ/eG9mXFJJQ0BARU9ba3yNnKqzubu6t7GrpJ2WkImCeW9kWExCOzY3PEZUZnmMnq24vsHAvLavp6Cak4yEenBkWExCOjY2O0ZUZXiLnKq1vL69urSup6CalI2FfHFlWU1DOzc4PUdVZniLm6mzuby7t7KspqCalI2FfHJmWk5EPDk6P0lXaHqLm6iyt7m4tbCqpZ+alI2FfHFlWU1EPTo8Qk1ba32NnKixtbe1sq6po56Zk4yEe3BkWE1DPTw+RVFfb4CQnqmwtLSzr6umop2YkouDeW5iVktDPj1BSlZkdIWToKmvsrKwramkoJyXkYmBdmtfU0lCP0BFT1xreoqXoqqusK+tqqainpqVj4d9cmdbUEdCQENKVWJxgY+bpKqtrq2qp6SgnJiTjIN5bmJXTUZCQ0hQXGp5h5Sepaqsq6qnpKGempaQiH90aF1SSkVER01YZXOBjpmhpqmqqaelop+cmJOMg3luYldOSEVHTFVgbnuIlJ2jpqiopqSioJ2alY+HfXJnXFJLR0dLU15qd4SPmZ+kpqalpKKgnpuWkYqBdmtgVk5KSUxSXGd0gYyVnKGjpKSjoaCem5iSjIN5bmNZUUxKTFJbZnJ+iZOan6GioqKhn56cmJONhXtwZVtTTkxNU1tlcX2HkZidn6GhoaCfnpyZlI6GfHJnXVVPTU9UXGZxfIaPlpuen6Cfn56dm5mUjoZ9cmheVlFPUFVdZnF8ho6VmZyenp6enp2bmJSOhn1yaF9XUlBSV19ocn2GjpSYm5ydnZ2dnJuYk42FfHJoX1hTUlRZYWp0foaOk5eZm5ycnJycmpeSjIR7cWdeWFRUVlxkbXZ/h46Tlpiam5ucnJuZlpGKgnlvZl5YVVZZX2dweYGIjpOVl5mampubmpiVj4iAdm1kXVhXWFxianN7g4qPkpWXmJmampqZl5ONhXxzamJcWVhbX2Zudn6Fi4+SlJaXmJmampiVkIqCeXBnYFxaWl5janJ6gYeMj5KUlpeYmZmZl5ONhn51bGVfXFtdYmhvdn2EiY2QkpSVl5iZmZeUkImCeXFpYl5cXWFmbHR6gYaKjpCSlJWXmJiYlZKMhX10bGZhXl5gZWtxeH6EiIuOkJKUlZeYl5aTjoeAeHBpY2BfYWRqcHZ8goaKjI+RkpSWl5eWk4+Jgnpya2ViYGFlaW91e4CEiIuNj5GTlZaXlpSQioN8dG1nZGJiZWlvdHp/g4eJjI6QkpSVlpaUkIuEfXZvaWVjZGZqb3R5foKGiIuNj5GTlZWVk5CLhX53cGpnZWVnam90eX2BhYeKjI6QkpSVlZOQi4V+d3FraGZmaGtwdHl9gYSHiYuNkJKTlJSSj4uFfnhxbGlnZ2lscHV5fYGEhoiLjY+Rk5STko+KhH53cW1paGhqbnJ2en2Bg4aIioyPkZKTk5GOiYN9d3FtamlqbG9zd3p+gYOFiIqMjpCSk5KQjIiCfHZxbWtqa21xdHh7foGDhYiKjI6QkpKRj4uGgHt1cW1sa21vcnZ5fH+Bg4WIioyOkJGRkI2JhH95dHBubG1ucXR3en1/goSGiIqMj5CRkI6Lh4J9d3Nwbm1ucHN2eXt+gIKEhoiLjY+QkI+NiYWAe3ZycG5vcHJ1d3p8f4CChIeJi42Pj4+Ni4eCfXl1cnBvcHJ0dnl7fX+Bg4WHioyOj4+OjIiEf3t3c3FwcXJ0dnh6fH6AgoSGiIqMjo6OjImGgX15dXNxcXJ0dXh6fH1/gYOFh4mLjY6NjIqHg356d3RzcnJ0dXd5e31+gIKEhoiKjI2NjIqHhIB8eHV0c3N0dnd5e3x+f4GDhYeJi4yMjIqIhIB9eXd1dHR1dnd5e3x9f4CChIaIiouMi4qIhYF9end2dXR1dnh5enx9f4CChIaIiYuLi4qHhYF+e3h2dXV2d3h5e3x9foCBg4WHiYqLiomHhYF+e3l3dnZ2d3h5e3x9fn+Bg4WHiIqKiomHhIF+e3l4d3d3eHl6e3x9fn+Bg4SGiImKiYiGhIF+fHp4d3d4eHl6e3x9fn+Bg4SGiImJiYiGg4F+fHp5eHh4eXp7e3x9fn+Bg4SGh4iJiIeFg4B+fHp5eHh5eXp7fHx9foCBg4SGh4iIh4aEgoB9fHp5eXl5ent7fH1+f4CBg4SGh4eHh4WDgX99e3p6eXp6e3t8fH1+f4CCg4WGh4eHhoSCgH59e3p6enp7e3x8fX1+f4CCg4WGhoaGhYOCgH58e3t6ent7fHx8fX5/gIGChIWGhoaFhIKBf318e3t7e3t8fHx9fX5/gIGDhIWFhoWEg4GAfn18fHt7e3x8fH19fn9/gYKDhIWFhYSDgoB/fn18fHx8fHx8fX1+fn+AgYKDhIWFhIOCgYB+fX18fHx8fH19fX1+f4CBgoOEhISEg4KBgH9+fX18fHx9fX19fX5+f4CBgoOEhISDgoGAf35+fX19fX19fX19fn5/gIGCg4OEg4OCgoGAf359fX19fX19fX1+fn+AgIGCg4ODg4KCgYB/fn59fX19fX19fn5+f3+AgYKCg4ODgoGBgH9+fn5+fX19fn5+fn5/f4CBgoKCg4KCgYGAf39+fn5+fn5+fn5+fn9/gIGBgoKCgoKBgYB/f35+fn5+fn5+fn5+f3+AgYGCgoKCgYGAgH9/f35+fn5+fn5+fn9/f4CAgYGCgoKBgYCAf39/fn5+fn5+fn5+f39/gICBgYGBgYGBgIB/f39/fn5+fn5+fn9/f3+AgIGBgYGBgYCAgH9/f39/f39+fn5/f39/gICAgYGBgYGBgICAf39/f39/f39/f39/f3+AgICBgYGBgYCAgH9/f39/f39/f39/f39/f4CAgICBgYCAgICAf39/f39/f39/f39/f39/gICAgICAgICAgIB/f39/f39/f39/f39/f4CAgICAgICAgICAf39/f39/f39/f39/f39/gICAgICAgICAgIB/f39/f39/f39/f39/f4CAgICAgICAgICAgH9/f39/f39/f39/f39/gICAgICAgICAgIB/f39/f39/f39/f39/f4CAgICAgICAgICAgH9/f39/f39/f39/f3+AgICAgICAgICAgIB/f39/f39/f39/f39/f4CAgICAgICAgICAf39/f39/f39/f39/f3+AgICAgICAgICAgIB/f39/f39/f39/f39/gICAgICAgICAgICAf39/f39/f39/f39/f4CAgICAgICAgICAgH9/f39/f39/f39/f39/gICAgICAgICAgIB/f39/f39/f39/f39/f4CAgICAgICAgICAgH9/f3+A";
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
