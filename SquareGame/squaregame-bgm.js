/**
 * squaregame-bgm.js — looping background music.
 *
 * Kept in its own file on purpose: the minitool release build rewrites
 * playClearSfx/triggerClearFeedback inside square-tools.js with a regex, and any
 * code sitting between those two functions gets swallowed by that match.
 *
 * The track URL is injected by the host page (window.SQUAREGAME_BGM_SRC) because
 * the dev page and the packaged build keep their assets at different paths.
 *
 * Browsers block audio until a user gesture, so playback is requested at load
 * and retried once on the first pointerdown/touchstart.
 */
(function () {
  "use strict";

  var audio = null;
  // Two independent bits of state, deliberately not one:
  //   shouldPlay — the game wants music right now
  //   suppressed — playback is temporarily held back (full-screen ad)
  // Collapsing these into a single flag makes resume() a no-op after pause().
  var shouldPlay = false;
  var suppressed = false;
  var unlocked = false;

  function volume() {
    var v = typeof bgmVolume === "number" ? bgmVolume : 0.35;
    return Math.max(0, Math.min(1, v));
  }

  function element() {
    if (audio) return audio;
    var url =
      typeof window.SQUAREGAME_BGM_SRC === "string" ? window.SQUAREGAME_BGM_SRC : "";
    if (!url) return null;
    try {
      audio = new Audio();
      audio.src = url;
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = volume();
      audio.addEventListener("error", function () {
        console.log(
          "[squaregame-bgm] failed to load track",
          audio && audio.error ? audio.error.code : "unknown"
        );
      });
    } catch (e) {
      console.log("[squaregame-bgm] init failed", e);
      audio = null;
    }
    return audio;
  }

  function start() {
    var el = element();
    if (!el) return;
    try {
      var p = el.play();
      // A rejected play() just means the gesture has not happened yet; the
      // unlock listener retries. Never surface this as an error.
      if (p && typeof p.catch === "function") {
        p.catch(function () {});
      }
    } catch (e) {
      console.log("[squaregame-bgm] play failed", e);
    }
  }

  function play() {
    shouldPlay = true;
    if (suppressed) return;
    start();
  }

  /** Holds playback for a full-screen ad. Remembers that music is still wanted. */
  function pause() {
    suppressed = true;
    if (!audio) return;
    try {
      audio.pause();
    } catch (e) {
      console.log("[squaregame-bgm] pause failed", e);
    }
  }

  /** Undoes pause(), restarting the track only if it was playing before. */
  function resume() {
    suppressed = false;
    if (shouldPlay) start();
  }

  function setVolume(value) {
    var v = Math.max(0, Math.min(1, Number(value) || 0));
    if (audio) {
      try {
        audio.volume = v;
      } catch (e) {
        console.log("[squaregame-bgm] setVolume failed", e);
      }
    }
  }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    if (shouldPlay && !suppressed) start();
  }

  try {
    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("touchstart", unlock, { once: true, passive: true });
  } catch (e) {
    console.log("[squaregame-bgm] unlock listener failed", e);
  }

  window.SQUAREGAME_BGM = {
    play: play,
    pause: pause,
    resume: resume,
    setVolume: setVolume,
  };

  // Ask for playback up front; the first gesture is what actually starts it.
  play();
})();
