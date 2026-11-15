const KEY = "ttt-sound-mode";
let mode = "all";
try {
  const saved = localStorage.getItem(KEY);
  if (saved === "all" || saved === "sfx" || saved === "off") mode = saved;
} catch (e) {}

let ctx = null;
let sfxBus = null;
let musicBus = null;
let unlocked = false;
let musicOn = false;
let musicTimer = null;
let nextTime = 0;
let stepIdx = 0;
let song = null;
let songChecked = false;
let songOk = false;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.9;
  sfxBus.connect(ctx.destination);
  musicBus = ctx.createGain();
  musicBus.gain.value = 0.3;
  musicBus.connect(ctx.destination);
  return ctx;
}

function tone(freq, t, dur, type, vol, bus, slideTo) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(bus);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(t, dur, vol, bus, freq) {
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) d[i] = Math.random() * 2 - 1;
  const s = ctx.createBufferSource();
  s.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq || 1800;
  f.Q.value = 1.2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f);
  f.connect(g);
  g.connect(bus);
  s.start(t);
  s.stop(t + dur + 0.02);
}

const SFX = {
  tap: (t) => tone(700, t, 0.06, "square", 0.12, sfxBus),
  pop: (t) => tone(500, t, 0.09, "sine", 0.3, sfxBus, 900),
  roll: (t) => {
    let at = 0;
    for (let i = 0; i < 9; i += 1) {
      noise(t + at, 0.05, 0.5, sfxBus, 1500 + (i % 3) * 700);
      at += 0.05 + i * 0.012;
    }
    tone(110, t + 0.88, 0.16, "sine", 0.7, sfxBus, 55);
  },
  move: (t) => {
    tone(420, t, 0.07, "triangle", 0.45, sfxBus);
    tone(560, t + 0.09, 0.09, "triangle", 0.45, sfxBus);
  },
  six: (t) => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.09, 0.16, "sine", 0.35, sfxBus));
  },
  capture: (t) => {
    tone(420, t, 0.35, "sawtooth", 0.28, sfxBus, 90);
    noise(t, 0.25, 0.5, sfxBus, 600);
  },
  home: (t) => {
    [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.08, 0.2, "sine", 0.35, sfxBus));
  },
  win: (t) => {
    [
      [523, 0, 0.18], [523, 0.2, 0.18], [523, 0.4, 0.18], [659, 0.6, 0.3],
      [784, 0.95, 0.18], [659, 1.15, 0.18], [784, 1.35, 0.18], [1047, 1.55, 0.7],
    ].forEach(([f, o, d]) => tone(f, t + o, d, "square", 0.22, sfxBus));
  },
  turn: (t) => {
    tone(880, t, 0.15, "sine", 0.35, sfxBus);
    tone(1175, t + 0.12, 0.2, "sine", 0.3, sfxBus);
  },
  robot: (t) => {
    tone(300, t, 0.08, "square", 0.15, sfxBus);
    tone(450, t + 0.1, 0.08, "square", 0.15, sfxBus);
  },
  tick: (t) => tone(1000, t, 0.04, "square", 0.12, sfxBus),
};

export function sfx(name) {
  if (mode === "off") return;
  const c = ensure();
  if (!c) return;
  if (c.state === "suspended") c.resume();
  const fn = SFX[name];
  if (fn) fn(c.currentTime + 0.01);
}

const BPM = 108;
const STEP = 60 / BPM / 2;
const BASS = [130.81, 110.0, 87.31, 98.0];
const MEL = [
  [523.25, 0, 659.25, 0, 783.99, 0, 659.25, 0],
  [440, 0, 523.25, 0, 659.25, 0, 523.25, 0],
  [349.23, 0, 440, 0, 523.25, 0, 440, 0],
  [392, 0, 493.88, 0, 587.33, 0, 493.88, 659.25],
];
const MEL2 = [
  [659.25, 0, 783.99, 659.25, 523.25, 0, 659.25, 0],
  [659.25, 0, 523.25, 440, 523.25, 0, 440, 0],
  [523.25, 440, 349.23, 0, 440, 523.25, 0, 440],
  [493.88, 587.33, 0, 783.99, 659.25, 587.33, 493.88, 0],
];

function scheduleStep(i, t) {
  const bar = Math.floor(i / 8) % 8;
  const s = i % 8;
  const chord = bar % 4;
  if (s === 0 || s === 4) tone(BASS[chord], t, STEP * 3.6, "triangle", 0.5, musicBus);
  const f = bar < 4 ? MEL[chord][s] : MEL2[chord][s];
  if (f) tone(f, t, STEP * 1.7, "sine", 0.3, musicBus);
}

function synthStart() {
  const c = ensure();
  if (!c || musicTimer) return;
  nextTime = c.currentTime + 0.1;
  stepIdx = 0;
  musicTimer = setInterval(() => {
    while (nextTime < c.currentTime + 0.5) {
      scheduleStep(stepIdx, nextTime);
      nextTime += STEP;
      stepIdx += 1;
    }
  }, 120);
}

function synthStop() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

async function probeSong() {
  if (songChecked) return songOk;
  songChecked = true;
  try {
    const r = await fetch("/music.mp3", { method: "HEAD" });
    const ct = r.headers.get("content-type") || "";
    songOk = r.ok && /audio|mpeg|octet/.test(ct);
  } catch (e) {
    songOk = false;
  }
  return songOk;
}

function startMusic() {
  if (mode !== "all" || musicOn) return;
  musicOn = true;
  probeSong().then((ok) => {
    if (!musicOn) return;
    if (ok) {
      if (!song) {
        song = new Audio("/music.mp3");
        song.loop = true;
        song.volume = 0.4;
      }
      song.play().catch(() => {});
    } else {
      synthStart();
    }
  });
}

function stopMusic() {
  musicOn = false;
  synthStop();
  if (song) song.pause();
}

export function unlock() {
  const c = ensure();
  if (!c) return;
  if (c.state === "suspended") c.resume();
  unlocked = true;
  if (mode === "all") startMusic();
}

export const getMode = () => mode;

export function setMode(m) {
  mode = m;
  try {
    localStorage.setItem(KEY, m);
  } catch (e) {}
  if (m === "all") {
    if (unlocked) startMusic();
  } else {
    stopMusic();
  }
  window.dispatchEvent(new Event("ttt-sound"));
}

export function cycleMode() {
  const next = mode === "all" ? "sfx" : mode === "sfx" ? "off" : "all";
  setMode(next);
  if (next !== "off") sfx("tap");
  return next;
}

if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", unlock);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopMusic();
    else if (unlocked && mode === "all") startMusic();
  });
  }
