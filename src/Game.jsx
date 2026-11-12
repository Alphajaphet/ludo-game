import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

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
  { name: "Yellow", hex: "#ffca05",
    grad: "linear-gradient(145deg,#fff36a,#ffb900,#d77b00)",
    pawn: ["#ffce00", "#fff7a1", "#a75a00"],
    start: 0, origin: [0, 0],
    home: [[1,7],[2,7],[3,7],[4,7],[5,7]],
    base: [[1,1],[4,1],[1,4],[4,4]], done: [6.7, 7.5] },
  { name: "Blue", hex: "#087cff",
    grad: "linear-gradient(145deg,#60eaff,#0879ff,#0641a8)",
    pawn: ["#00caff", "#baffff", "#003dba"],
    start: 13, origin: [9, 0],
    home: [[7,1],[7,2],[7,3],[7,4],[7,5]],
    base: [[10,1],[13,1],[10,4],[13,4]], done: [7.5, 6.7] },
  { name: "Red", hex: "#f21d16",
    grad: "linear-gradient(145deg,#ff8982,#fa211b,#a50016)",
    pawn: ["#ff302b", "#ffc0ad", "#970000"],
    start: 26, origin: [9, 9],
    home: [[13,7],[12,7],[11,7],[10,7],[9,7]],
    base: [[10,10],[13,10],[10,13],[13,13]], done: [8.3, 7.5] },
  { name: "Green", hex: "#0fd63a",
    grad: "linear-gradient(145deg,#aaff54,#00db38,#00852a)",
    pawn: ["#39f500", "#d6ff8c", "#087b00"],
    start: 39, origin: [0, 9],
    home: [[7,13],[7,12],[7,11],[7,10],[7,9]],
    base: [[1,10],[4,10],[1,13],[4,13]], done: [7.5, 8.3] },
];

const NEUTRAL = "linear-gradient(145deg,#ffffff,#dce6f7)";
const CELL = {};
TRACK.forEach(([c, r], i) => {
  CELL[c + "," + r] = { bg: NEUTRAL, star: SAFE.includes(i) };
});
COLORS.forEach((col) => {
  col.home.forEach(([c, r]) => {
    CELL[c + "," + r] = { bg: col.hex, lane: true };
  });
  const [sc, sr] = TRACK[col.start];
  CELL[sc + "," + sr] = { bg: col.hex, star: true, onColor: true, lane: true };
});

const PIPS = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};
const EMOJIS = ["😂","😎","😡","😭","😍","🤔","👏","🔥","🎉","😱","🙏","😴"];
const PHRASES = ["Hello!","Play fast!","That was close!","Well Played","Why?! Why?!","Sorry mate!"];

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
  background:
    "radial-gradient(ellipse at 50% 12%, rgba(62,130,255,.55), transparent 45%), linear-gradient(145deg,#02072b,#081a55,#16043b)",
  color: "#fff",
  fontFamily: "system-ui, Arial, sans-serif",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "10px 10px 130px",
  boxSizing: "border-box",
  textAlign: "center",
};
const pill = {
  border: "2px solid #ffcf54",
  background: "linear-gradient(145deg,#15245d,#050b2d)",
  boxShadow: "0 0 12px #148bff",
  borderRadius: 14,
  padding: "6px 10px",
  fontWeight: 700,
  color: "#fff",
  fontSize: 14,
  cursor: "pointer",
};
const round = {
  ...pill,
  width: 40,
  height: 40,
  padding: 0,
  fontSize: 24,
  display: "grid",
  placeItems: "center",
};
const chatBtn = {
  ...pill,
  background: "linear-gradient(145deg,#32236c,#080f3c)",
  border: "2px solid #d7aaff",
  boxShadow: "0 0 10px #8a4dff",
  borderRadius: 20,
  padding: "8px 16px",
  fontSize: 15,
};
const yellowBtn = {
  padding: "14px 28px",
  fontSize: 18,
  borderRadius: 14,
  border: "none",
  background: "linear-gradient(180deg,#ffd54a,#f5a623)",
  color: "#5a2a00",
  fontWeight: 800,
  cursor: "pointer",
  margin: 6,
  boxShadow: "0 4px 0 #b36b00",
};
const phrase = {
  background: "#fff",
  color: "#16245d",
  border: "2px solid #ffcf54",
  borderRadius: 20,
  padding: "10px 6px",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};
const logo = {
  fontSize: 22,
  fontWeight: 900,
  color: "#fff2a2",
  textShadow: "0 3px #a34a00, 0 0 18px #ffcf35",
  lineHeight: 1,
};

function Die({ v, rolling, disabled, glow, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 70,
        height: 70,
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
        boxShadow: `0 0 0 4px ${glow}, 0 0 20px ${glow}`,
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
  const [count, setCount] = useState(2);
  const [tokens, setTokens] = useState({});
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState(null);
  const [face, setFace] = useState(6);
  const [rolling, setRolling] = useState(false);
  const [msg, setMsg] = useState("");
  const [winner, setWinner] = useState(null);
  const [wallet, setWallet] = useState({ coins: 0, diamonds: 0 });
  const [panel, setPanel] = useState(null);
  const [text, setText] = useState("");
  const [bubble, setBubble] = useState(null);
  const timer = useRef(null);
  const bubbleTimer = useRef(null);

  useEffect(
    () => () => {
      clearInterval(timer.current);
      clearTimeout(bubbleTimer.current);
    },
    []
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const id = data.session && data.session.user && data.session.user.id;
      if (!id) return;
      supabase
        .from("profiles")
        .select("coins,diamonds")
        .eq("id", id)
        .maybeSingle()
        .then(({ data: p }) => {
          if (p) setWallet({ coins: p.coins, diamonds: p.diamonds });
        });
    });
  }, []);

  const goHome = () => {
    window.location.hash = "";
  };

  const start = (n) => {
    const list = n === 2 ? [0, 2] : n === 3 ? [0, 1, 2] : [0, 1, 2, 3];
    const t = {};
    list.forEach((c) => (t[c] = [-1, -1, -1, -1]));
    setPlayers(list);
    setTokens(t);
    setTurn(0);
    setDice(null);
    setWinner(null);
    setMsg("");
  };

  const topBar = (
    <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", maxWidth: 440 }}>
      <button style={round} onClick={goHome}>‹</button>
      <div style={{ textAlign: "left" }}>
        <div style={logo}>♛ LUDO</div>
        <div style={{ fontSize: 9, letterSpacing: 1, color: "#ffe887", fontWeight: 700 }}>
          ROYAL FANTASY
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={pill}>💎 {wallet.diamonds}</div>
      <div style={pill}>🪙 {wallet.coins}</div>
    </div>
  );

  if (players.length === 0) {
    return (
      <div style={page}>
        {topBar}
        <h2 style={{ marginTop: 40, color: "#ffdb75", textShadow: "0 0 12px orange" }}>
          Select Players
        </h2>
        <div style={{ display: "flex", gap: 10 }}>
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              style={{
                width: 92,
                height: 90,
                borderRadius: 16,
                border: count === n ? "4px solid #ffd54a" : "4px solid transparent",
                background: "linear-gradient(#26dfff,#0060ff,#062a9d)",
                boxShadow: "0 0 14px #00aaff",
                color: "#fff",
                fontSize: 26,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {n}
              <div style={{ fontSize: 13 }}>Players</div>
            </button>
          ))}
        </div>
        <button
          style={{ ...yellowBtn, marginTop: 36, fontSize: 26, padding: "16px 64px" }}
          onClick={() => start(count)}
        >
          Start
        </button>
        <p style={{ opacity: 0.7, maxWidth: 280 }}>
          Pass the phone between players. Online games and bets come next.
        </p>
      </div>
    );
  }

  const ci = players[turn];
  const canRoll = !(rolling || dice !== null || winner !== null);
  const movable =
    dice !== null && !rolling
      ? [0, 1, 2, 3].filter((t) => canMove(tokens[ci][t], dice))
      : [];

  const roll = () => {
    if (!canRoll) return;
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

  const sendMsg = (content, big) => {
    const t = content.trim();
    if (!t) return;
    setBubble({ ci, text: t, big });
    setPanel(null);
    setText("");
    clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), 2500);
  };

  const hint = msg || (dice === null ? "Tap GO to roll" : "Tap a glowing pawn");

  return (
    <div style={page}>
      <style>{`
        @keyframes shake { 0%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} 100%{transform:rotate(-8deg)} }
        @keyframes pulse { 0%{box-shadow:0 0 0 0 rgba(255,255,255,.95)} 100%{box-shadow:0 0 0 12px rgba(255,255,255,0)} }
        @keyframes pop { 0%{transform:scale(.6);opacity:0} 100%{transform:scale(1);opacity:1} }
      `}</style>

      {topBar}

      <div
        style={{
          margin: "8px 0 6px",
          color: "#ffdb75",
          textShadow: "0 0 12px orange",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1,
        }}
      >
        🏰 ✦ THE ENCHANTED KINGDOM ✦ 🐉
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 440,
          padding: 6,
          borderRadius: 24,
          boxSizing: "border-box",
          background: "linear-gradient(135deg,#fff3a0,#a65a00,#ffe66b,#6c3500)",
          boxShadow: "0 0 25px #00aaff, 0 12px 25px rgba(0,11,0,.7)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1 / 1",
            background: "#dce7ff",
            borderRadius: 15,
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
                width: "40%",
                height: "40%",
                background: col.grad,
                border: "2px solid rgba(255,255,255,.5)",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: "16%",
                  background: "rgba(6,19,59,.35)",
                  borderRadius: 14,
                  boxShadow: "inset 0 0 16px rgba(0,0,0,.55)",
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
                  width: (100 / 15) * 0.85 + "%",
                  height: (100 / 15) * 0.85 + "%",
                  transform: "translate(-50%,-50%)",
                  borderRadius: "50%",
                  background: "rgba(0,0,0,.3)",
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
              background: `conic-gradient(from 45deg, ${COLORS[2].hex} 0 25%, ${COLORS[3].hex} 25% 50%, ${COLORS[0].hex} 50% 75%, ${COLORS[1].hex} 75% 100%)`,
              display: "grid",
              placeItems: "center",
              color: "#fff",
              fontSize: 20,
              textShadow: "0 0 10px #fff",
            }}
          >
            ✦
          </div>

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
                    border: cell
                      ? cell.lane
                        ? "1px solid rgba(255,255,255,.45)"
                        : "1px solid #aab8d0"
                      : "none",
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "clamp(9px, 3.2vw, 14px)",
                    color: cell && cell.onColor ? "#fff" : "#8a5a00",
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
              const pc = COLORS[pi].pawn;
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
                    background: `radial-gradient(circle at 32% 25%, #fff, ${pc[0]}, ${pc[2]})`,
                    border: "2px solid rgba(255,255,255,.7)",
                    boxSizing: "border-box",
                    boxShadow: `0 5px 5px rgba(0,0,0,.6), 0 0 9px ${pc[1]}`,
                    transition: "left .25s, top .25s",
                    zIndex: isMovable ? 6 : 4,
                    cursor: isMovable ? "pointer" : "default",
                    animation: isMovable ? "pulse .8s infinite" : "none",
                  }}
                >
                  <i
                    style={{
                      position: "absolute",
                      width: "43%",
                      height: "43%",
                      borderRadius: "50%",
                      left: "28%",
                      top: "-28%",
                      background: `radial-gradient(circle, #fff, ${pc[0]}, ${pc[2]})`,
                    }}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          margin: "14px 0 4px",
          width: "100%",
          maxWidth: 440,
        }}
      >
        <div>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              fontSize: 28,
              background: `radial-gradient(circle, rgba(255,255,255,.4), ${COLORS[ci].hex})`,
              border: "4px solid #ffd84d",
              boxShadow: `0 0 15px ${COLORS[ci].hex}`,
            }}
          >
            ♟
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#ffe887", marginTop: 2 }}>
            {COLORS[ci].name}
          </div>
        </div>

        <Die
          v={face}
          rolling={rolling}
          glow={COLORS[ci].hex}
          disabled={!canRoll}
          onClick={roll}
        />

        <button
          onClick={roll}
          disabled={!canRoll}
          style={{
            border: "3px solid #ffda57",
            borderRadius: 20,
            padding: "10px 26px",
            background: "linear-gradient(#26dfff,#0060ff,#062a9d)",
            boxShadow: "0 0 18px #00aaff",
            color: "#fff",
            fontSize: 30,
            fontWeight: 900,
            opacity: canRoll ? 1 : 0.45,
            cursor: canRoll ? "pointer" : "default",
          }}
        >
          GO
        </button>
      </div>
      <p style={{ opacity: 0.9, minHeight: 24, margin: "8px 0" }}>{hint}</p>

      {bubble && (
        <div
          style={{
            position: "fixed",
            top: 70,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 30,
          }}
        >
          <div
            style={{
              background: "#fff",
              color: "#222",
              borderRadius: 18,
              padding: bubble.big ? "6px 18px" : "10px 18px",
              fontSize: bubble.big ? 46 : 18,
              fontWeight: 700,
              border: `3px solid ${COLORS[bubble.ci].hex}`,
              boxShadow: "0 4px 14px rgba(0,0,0,.5)",
              animation: "pop .25s",
            }}
          >
            {bubble.text}
          </div>
        </div>
      )}

      {pa
