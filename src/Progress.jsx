import { COLORS } from "./ludoData.js";

export const calcProgress = (arr) => {
  const total = (arr || []).reduce((s, p) => s + Math.max(p, 0), 0);
  return Math.round((total / (4 * 56)) * 100);
};

export const pickBest = (arr, dice, movable) => {
  let best = movable[0];
  let bestScore = -1;
  movable.forEach((t) => {
    const pos = arr[t];
    let sc = pos === -1 ? 200 : pos + dice;
    if (pos >= 0 && pos + dice === 56) sc = 300;
    if (sc > bestScore) {
      bestScore = sc;
      best = t;
    }
  });
  return best;
};

export function PlayerBar({ items }) {
  return (
    <div style={{ display: "flex", gap: 6, width: "100%", maxWidth: 440, margin: "8px 0 4px" }}>
      {items.map((it) => {
        const c = COLORS[it.color].hex;
        return (
          <div
            key={it.key}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "5px 7px",
              borderRadius: 12,
              background: "rgba(0,0,0,.38)",
              border: it.active ? "2px solid " + c : "2px solid transparent",
              boxShadow: it.active ? "0 0 10px " + c : "none",
              textAlign: "left",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {it.avatar} {it.you ? "You" : it.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: c, lineHeight: 1.2 }}>
              {it.pct}%
            </div>
            <div
              style={{
                height: 5,
                borderRadius: 4,
                background: "rgba(255,255,255,.18)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: it.pct + "%",
                  height: "100%",
                  background: c,
                  transition: "width .4s",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TurnTimer({ left, total, color, text }) {
  const frac = Math.max(0, Math.min(1, left / total));
  const urgent = left <= 3;
  return (
    <div style={{ width: "100%", maxWidth: 440, margin: "4px 0 6px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          fontWeight: 700,
          marginBottom: 3,
        }}
      >
        <span>{text}</span>
        <span style={{ color: urgent ? "#ff6b6b" : "#ffe887" }}>⏱ {Math.ceil(left)}s</span>
      </div>
      <div style={{ height: 10, borderRadius: 6, background: "rgba(0,0,0,.4)", overflow: "hidden" }}>
        <div
          style={{
            width: frac * 100 + "%",
            height: "100%",
            background: urgent ? "#ff4d4d" : color,
            transition: "width .25s linear",
          }}
        />
      </div>
    </div>
  );
            }
