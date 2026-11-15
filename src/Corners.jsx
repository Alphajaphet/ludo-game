import { COLORS } from "./ludoData.js";

const PIPS = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};
const ORIENT = { 1: [0, 0], 2: [90, 0], 3: [0, -90], 4: [0, 90], 5: [-90, 0], 6: [0, 180] };
const FACE = {
  1: "rotateY(0deg)",
  2: "rotateX(-90deg)",
  3: "rotateY(90deg)",
  4: "rotateY(-90deg)",
  5: "rotateX(90deg)",
  6: "rotateY(180deg)",
};

export function Dice3D({ value, rollId, size = 54, active, color, disabled, onClick }) {
  const v = ORIENT[value] ? value : 1;
  const [bx, by] = ORIENT[v];
  const n = rollId || 0;
  const half = size / 2;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: size,
        height: size,
        padding: 0,
        border: "none",
        background: "transparent",
        perspective: size * 6 + "px",
        cursor: disabled ? "default" : "pointer",
        flexShrink: 0,
        opacity: active ? 1 : 0.65,
        filter: active
          ? "drop-shadow(0 0 6px " + color + ") drop-shadow(0 0 12px " + color + ")"
          : "none",
        animation: n > 0 ? (n % 2 ? "diceHopA" : "diceHopB") + " .9s ease-out" : "none",
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          position: "relative",
          transformStyle: "preserve-3d",
          transform: "rotateX(" + (bx + 720 * n) + "deg) rotateY(" + (by + 1080 * n) + "deg)",
          transition: "transform .9s cubic-bezier(.2,.7,.2,1)",
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((f) => (
          <div
            key={f}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: size * 0.18,
              background: "linear-gradient(145deg,#ffffff,#dfe6f5)",
              border: "1px solid rgba(0,0,0,.18)",
              boxShadow: "inset 0 0 6px rgba(0,0,0,.15)",
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gridTemplateRows: "repeat(3,1fr)",
              padding: size * 0.12,
              boxSizing: "border-box",
              transform: FACE[f] + " translateZ(" + half + "px)",
              backfaceVisibility: "hidden",
            }}
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <span
                key={i}
                style={{
                  margin: "12%",
                  borderRadius: "50%",
                  background: PIPS[f].includes(i) ? (f === 1 ? "#e53935" : "#111") : "transparent",
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </button>
  );
}

export function Corner({ color, slot, dieValue, rollId, active, canRoll, onRoll, side }) {
  if (!slot) return <div style={{ flex: 1 }} />;
  const c = COLORS[color].hex;
  const right = side === "right";
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: right ? "row-reverse" : "row",
        alignItems: "center",
        gap: 8,
        padding: "6px 8px",
        borderRadius: 16,
        background: "rgba(0,0,0,.35)",
        border: active ? "2px solid " + c : "2px solid transparent",
        boxShadow: active ? "0 0 12px " + c : "none",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexDirection: right ? "row-reverse" : "row",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            fontSize: 22,
            background: "radial-gradient(circle at 32% 25%, rgba(255,255,255,.55), " + c + ")",
            border: "3px solid #ffd84d",
            boxShadow: active ? "0 0 10px " + c : "none",
          }}
        >
          {slot.auto ? "🤖" : slot.avatar}
        </div>
        <div style={{ flex: 1, minWidth: 0, textAlign: right ? "right" : "left" }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {slot.you ? "You" : slot.name}
          </div>
          <div style={{ fontSize: 15, fontWeight: 900, color: c, lineHeight: 1.1 }}>
            {slot.pct}%
          </div>
          <div
            style={{
              height: 4,
              borderRadius: 3,
              background: "rgba(255,255,255,.2)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: slot.pct + "%",
                height: "100%",
                background: c,
                transition: "width .4s",
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Dice3D
          value={dieValue}
          rollId={rollId}
          active={active}
          color={c}
          disabled={!canRoll}
          onClick={onRoll}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 900,
            color: "#ffd54a",
            height: 12,
            marginTop: 2,
            animation: canRoll ? "tapPulse 1s infinite" : "none",
            opacity: canRoll ? 1 : 0,
          }}
        >
          TAP
        </span>
      </div>
    </div>
  );
}

export function Arena({ slots, vals, rollIds, activeColor, rollableColor, onRoll, children }) {
  const corner = (col, side) => (
    <Corner
      key={col}
      color={col}
      slot={slots[col]}
      side={side}
      dieValue={vals[col]}
      rollId={rollIds[col]}
      active={activeColor === col}
      canRoll={rollableColor === col}
      onRoll={onRoll}
    />
  );
  return (
    <div style={{ width: "100%", maxWidth: 440 }}>
      <style>{`
        @keyframes diceHopA { 0%{transform:translateY(0)} 30%{transform:translateY(-16px) scale(1.18)} 60%{transform:translateY(0)} 78%{transform:translateY(-4px)} 100%{transform:translateY(0)} }
        @keyframes diceHopB { 0%{transform:translateY(0)} 30%{transform:translateY(-16px) scale(1.18)} 60%{transform:translateY(0)} 78%{transform:translateY(-4px)} 100%{transform:translateY(0)} }
        @keyframes tapPulse { 0%,100%{opacity:.4} 50%{opacity:1} }
      `}</style>
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        {corner(0, "left")}
        {corner(1, "right")}
      </div>
      {children}
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        {corner(3, "left")}
        {corner(2, "right")}
      </div>
    </div>
  );
}
