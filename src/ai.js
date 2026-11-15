import { COLORS, SAFE } from "./ludoData.js";

const absOf = (c, p) => (COLORS[c].start + p) % 52;

function threatened(abs, ci, tokens, players) {
  for (let a = 0; a < players.length; a += 1) {
    const oi = players[a];
    if (oi === ci) continue;
    const arr = tokens[oi];
    for (let k = 0; k < arr.length; k += 1) {
      const p = arr[k];
      if (p >= 0 && p <= 50) {
        const d = (abs - absOf(oi, p) + 52) % 52;
        if (d >= 1 && d <= 6) return true;
      }
    }
  }
  return false;
}

export function aiPick(ci, dice, movable, tokens, players) {
  let best = movable[0];
  let bestScore = -Infinity;
  movable.forEach((t) => {
    const pos = tokens[ci][t];
    const np = pos === -1 ? 0 : pos + dice;
    let s = np * 0.3 + Math.random() * 2;
    if (np === 56) s += 100;
    if (np >= 51 && np < 56) s += 25;
    if (pos === -1) s += 60;
    if (np <= 50) {
      const abs = absOf(ci, np);
      if (SAFE.includes(abs)) {
        s += 25;
      } else {
        let cap = false;
        players.forEach((oi) => {
          if (oi === ci) return;
          tokens[oi].forEach((op) => {
            if (op >= 0 && op <= 50 && absOf(oi, op) === abs) cap = true;
          });
        });
        if (cap) s += 80;
        else if (threatened(abs, ci, tokens, players)) s -= 30;
      }
    }
    if (pos >= 0 && pos <= 50) {
      const cur = absOf(ci, pos);
      if (!SAFE.includes(cur) && threatened(cur, ci, tokens, players)) s += 20;
    }
    if (s > bestScore) {
      bestScore = s;
      best = t;
    }
  });
  return best;
}
