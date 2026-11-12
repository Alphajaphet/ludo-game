import { useEffect, useRef, useState } from "react";

const TRACK = [
  [1,6],[2,6],[3,6],[4,6],[5,6],
  [6,5],[6,4],[6,3],[6,2],[6,1],[6,0],
  [7,0],[8,0],
  [8,1],[8,2],[8,3],[8,4],[8,5],
  [9,6],[10,6],[11,6],[12,6],[13,6],[14,6],
  [14,7],[14,8],
  [13,8],[12,8],[11,8],[10,8],[9,8],
  [8,9],[8,10],[8,11],[8,12],[8,13],[8,14],
  [7,14],[6,14],
  [6,13],[6,12],[6,11],[6,10],[6,9],
  [5,8],[4,8],[3,8],[2,8],[1,8],[0,8],
  [0,7],[0,6],
];
const SAFE = [0, 8, 13, 21, 26, 34, 39, 47];

const COLORS = [
  { name: "Red", hex: "#e53935", start: 0, origin: [0, 0],
    home: [[1,7],[2,7],[3,7],[4,7],[5,7]],
    base: [[1,1],[4,1],[1,4],[4,4]], done: [6.7, 7.5] },
  { name: "Green", hex: "#43a047", start: 13, origin: [9, 0],
    home: [[7,1],[7,2],[7,3],[7,4],[7,5]],
    base: [[10,1],[13,1],[10,4],[13,4]], done: [7.5, 6.7] },
  { name: "Yellow", hex: "#fdd835", start: 26, origin: [9, 9],
    home: [[13,7],[12,7],[11,7],[10,7],[9,7]],
    base: [[10,10],[13,10],[10,13],[13,13]], done: [8.3, 7.5] },
  { name: "Blue", hex: "#1e88e5", start: 39, origin: [0, 9],
    home: [[7,13],[7,12],[7,11],[7,10],[7,9]],
    base: [[1,10],[4,10],[1,13],[4,13]], done: [7.5, 8.3] },
];

const CELL = {};
TRACK.forEach(([c, r], i) => {
  CELL[c + "," + r] = { bg: "#fff", star: SAFE.includes(i) };
});
COLORS.forEach((col) => {
  col.home.forEach(([c, r]) => {
    CELL[c + "," + r] = { bg: col.hex };
  });
  const [sc, sr] = TRACK[col.start];
  CELL[sc + "," + sr] = { bg: col.hex, star: true, onColor: true };
});

const PIPS = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};

const canMove = (pos, v) => (pos === -1 ? v === 6 : pos + v <= 56);

function centerOf(ci, pos, t) {
  const col = COLORS[ci];
  if (pos === -1) return [col.base[t][0] + 0.5, col.base[t][1] + 0.5];
  let c, r;
  if (pos <= 50) [c, r] = TRACK[(col.start + pos) % 52];
  else if (pos <= 55) [c, r] = col.home[pos - 51];
  else {
    const [dx, dy] = col.done;
    const off = (t - 1.5) * 0.14;
    return ci % 2 === 0 ? [dx, dy + off] : [dx + off, dy];
  }
  const ox = ((t % 2) - 0.5) * 0.22;
  const oy = (Math.floor(t / 2) - 0.5) * 0.22;
  return [c + 0.5 + ox, r + 0.5 + oy];
}

const page = {
  minHeight: "100vh",
  background: "#12121c",
  color: "#fff",
  fontFamily: "system-ui, sans-serif",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: 12,
  boxSizing: "border-box",
  textAlign: "center",
};
const yellowBtn = {
  padding: "14px 28px",
  fontSize: 18,
  borderRadius: 12,
  border: "none",
  background: "#f5c542",
  color: "#000",
  fontWeight: 700,
  cursor: "pointer",
  margin: 6,
};
const ghost = {
  alignSelf: "flex-start",
  background: "#23233a",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "8px 14px",
  fontSize: 15,
  cursor: "pointer",
};

function Die({ v, rolling, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 76,
        height: 76,
        borderRadius: 16,
        background: "#fff",
        border: "none",
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gridTemplateRows: "repeat(3,1fr)",
        padding: 11,
        gap: 2,
        boxSizing: "border-box",
        animation: rolling ? "shake .25s infinite" : "none",
        opacity: disabled && !rolling ? 0.7 : 1,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <span
          key={i}
          style={{
            borderRadius: "50%",
            background: PIPS[v].includes(i) ? "#111" : "transparent",
          }}
        />
      ))}
    </button>
  );
}

export default function Game() {
  const [players, setPlayers] = useState([]);
  const [tokens, setTokens] = useState({});
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState(null);
  const [face, setFace] = useState(6);
  const [rolling, setRolling] = useState(false);
  const [msg, setMsg] = useState("");
  const [winner, setWinner] = useState(null);
  const timer = useRef(null);

  useEffect(() => () => clearInterval(timer.current), []);

  const goHome = () => {
    window.location.hash = "";
  };

  const start = (n) => {
    const list = n === 2 ? [0, 2] : n === 3 ? [0, 1, 2] : [0, 1, 2, 3];
    const t = {};
    list.forEach((ci) => (t[ci] = [-1, -1, -1, -1]));
    setPlayers(list);
    setTokens(t);
    setTurn(0);
    setDice(null);
    setWinner(null);
    setMsg("");
  };

  if (players.length === 0) {
    return (
      <div style={page}>
        <button style={ghost} onClick={goHome}>← Home</button>
        <h2 style={{ marginTop: 40 }}>🎲 Local game</h2>
        <p style={{ opacity: 0.7 }}>Pass the phone between players</p>
        {[2, 3, 4].map((n) => (
          <button key={n} style={yellowBtn} onClick={() => start(n)}>
            {n} players
          </button>
        ))}
      </div>
    );
  }

  const ci = players[turn];
  const movable =
    dice !== null && !rolling
      ? [0, 1, 2, 3].filter((t) => canMove(tokens[ci][t], dice))
      : [];

  const roll = () => {
    if (rolling || dice !== null || winner !== null) return;
    setRolling(true);
    setMsg("");
    let n = 0;
    timer.current = setInterval(() => {
      setFace(1 + Math.floor(Math.random() * 6));
      n += 1;
      if (n >= 8) {
        clearInterval(timer.current);
        const v = 1 + Math.floor(Math.random() * 6);
        setFace(v);
        setRolling(false);
        setDice(v);
        const any = [0, 1, 2, 3].some((t) => canMove(tokens[ci][t], v));
        if (!any) {
          setMsg("No move possible");
          timer.current = setTimeout(() => {
            setDice(null);
            setMsg("");
            setTurn((x) => (x + 1) % players.length);
          }, 1100);
        }
      }
    }, 80);
  };

  const moveToken = (t) => {
    const pos = tokens[ci][t];
    const np = pos === -1 ? 0 : pos + dice;
    const next = { ...tokens, [ci]: tokens[ci].slice() };
    next[ci][t] = np;
    let captured = false;
    if (np <= 50) {
      const abs = (COLORS[ci].start + np) % 52;
      if (!SAFE.includes(abs)) {
        players.forEach((oi) => {
          if (oi === ci) return;
          next[oi] = next[oi].map((p) => {
            if (p >= 0 && p <= 50 && (COLORS[oi].start + p) % 52 === abs) {
              captured = true;
              return -1;
            }
            return p;
          });
        });
      }
    }
    setTokens(next);
    setDice(null);
    if (next[ci].every((p) => p === 56)) {
      setWinner(ci);
      return;
    }
    if (dice === 6 || captured || np === 56) {
      setMsg(
        captured ? "Captured! Roll again" : np === 56 ? "Home! Roll again" : "Six! Roll again"
      );
    } else {
      setMsg("");
      setTurn((turn + 1) % players.length);
    }
  };

  const hint =
    msg || (dice === null ? "Tap the dice to roll" : "Tap a glowing token");

  return (
    <div style={page}>
      <style>{`
        @keyframes shake { 0%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} 100%{transform:rotate(-8deg)} }
        @keyframes pulse { 0%{box-shadow:0 0 0 0 rgba(255,255,255,.9)} 100%{box-shadow:0 0 0 10px rgba(255,255,255,0)} }
      `}</style>

      <button style={ghost} onClick={goHome}>← Home</button>

      <div
        style={{
          position: "relative",
          width: "min(94vw, 440px)",
          aspectRatio: "1 / 1",
          margin: "12px auto",
          background: "#fff",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {COLORS.map((col) => (
          <div
            key={col.name}
            style={{
              position: "absolute",
              left: (col.origin[0] / 15) * 100 + "%",
              top: (col.origin[1] / 15) * 100 + "%",
              width: 40 + "%",
              height: 40 + "%",
              background: col.hex,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "16%",
                background: "#fff",
                borderRadius: 12,
              }}
            />
          </div>
        ))}

        {COLORS.map((col) =>
          col.base.map(([c, r], i) => (
            <div
              key={col.name + i}
              style={{
                position: "absolute",
                left: ((c + 0.5) / 15) * 100 + "%",
                top: ((r + 0.5) / 15) * 100 + "%",
                width: (100 / 15) * 0.8 + "%",
                height: (100 / 15) * 0.8 + "%",
                transform: "translate(-50%,-50%)",
                borderRadius: "50%",
                background: col.hex,
                opacity: 0.3,
              }}
            />
          ))
        )}

        <div
          style={{
            position: "absolute",
            left: "40%",
            top: "40%",
            width: "20%",
            height: "20%",
            background:
              "conic-gradient(from 45deg, #fdd835 0 25%, #1e88e5 25% 50%, #e53935 50% 75%, #43a047 75% 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            gridTemplateColumns: "repeat(15,1fr)",
            gridTemplateRows: "repeat(15,1fr)",
          }}
        >
          {Array.from({ length: 225 }).map((_, i) => {
            const c = i % 15;
            const r = Math.floor(i / 15);
            const cell = CELL[c + "," + r];
            return (
              <div
                key={i}
                style={{
                  background: cell ? cell.bg : "transparent",
                  border: cell ? "1px solid rgba(0,0,0,.2)" : "none",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "clamp(8px, 3vw, 13px)",
                  color: cell && cell.onColor ? "#fff" : "#999",
                }}
              >
                {cell && cell.star ? "★" : ""}
              </div>
            );
          })}
        </div>

        {players.map((pi) =>
          tokens[pi].map((pos, t) => {
            const [x, y] = centerOf(pi, pos, t);
            const isMovable = pi === ci && movable.includes(t);
            return (
              <div
                key={pi + "-" + t}
                onClick={() => isMovable && moveToken(t)}
                style={{
                  position: "absolute",
                  left: (x / 15) * 100 + "%",
                  top: (y / 15) * 100 + "%",
                  width: (100 / 15) * 0.7 + "%",
                  height: (100 / 15) * 0.7 + "%",
                  transform: "translate(-50%,-50%)",
                  borderRadius: "50%",
                  background: COLORS[pi].hex,
                  border: "3px solid #fff",
                  boxSizing: "border-box",
                  boxShadow: "0 2px 4px rgba(0,0,0,.5)",
                  transition: "left .25s, top .25s",
                  zIndex: isMovable ? 6 : 4,
                  cursor: isMovable ? "pointer" : "default",
                  animation: isMovable ? "pulse .8s infinite" : "none",
                }}
              />
            );
          })
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          margin: "4px 0 10px",
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: COLORS[ci].hex,
          }}
        />
        <b style={{ fontSize: 20 }}>{COLORS[ci].name}'s turn</b>
      </div>

      <Die
        v={face}
        rolling={rolling}
        disabled={rolling || dice !== null || winner !== null}
        onClick={roll}
      />
      <p style={{ opacity: 0.85, minHeight: 24 }}>{hint}</p>

      {winner !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.85)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
          }}
        >
          <div style={{ fontSize: 72 }}>🏆</div>
          <h2 style={{ color: COLORS[winner].hex }}>{COLORS[winner].name} wins!</h2>
          <button style={yellowBtn} onClick={() => setPlayers([])}>
            Play again
          </button>
          <button style={{ ...yellowBtn, background: "#444", color: "#fff" }} onClick={goHome}>
            Home
          </button>
        </div>
      )}
    </div>
  );
    }
