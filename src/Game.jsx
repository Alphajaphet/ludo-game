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
  { name: "Yellow", hex: "#f2b705", start: 0, origin: [0, 0],
    home: [[1,7],[2,7],[3,7],[4,7],[5,7]],
    base: [[1,1],[4,1],[1,4],[4,4]], done: [6.7, 7.5] },
  { name: "Blue", hex: "#1e88e5", start: 13, origin: [9, 0],
    home: [[7,1],[7,2],[7,3],[7,4],[7,5]],
    base: [[10,1],[13,1],[10,4],[13,4]], done: [7.5, 6.7] },
  { name: "Red", hex: "#e2493b", start: 26, origin: [9, 9],
    home: [[13,7],[12,7],[11,7],[10,7],[9,7]],
    base: [[10,10],[13,10],[10,13],[13,13]], done: [8.3, 7.5] },
  { name: "Green", hex: "#2ecc71", start: 39, origin: [0, 9],
    home: [[7,13],[7,12],[7,11],[7,10],[7,9]],
    base: [[1,10],[4,10],[1,13],[4,13]], done: [7.5, 8.3] },
];

const CELL = {};
TRACK.forEach(([c, r], i) => {
  CELL[c + "," + r] = { bg: "#eef1fb", star: SAFE.includes(i) };
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
  background: "linear-gradient(180deg,#4b3fa3 0%,#3a3180 45%,#2d2766 100%)",
  color: "#fff",
  fontFamily: "system-ui, sans-serif",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "12px 12px 130px",
  boxSizing: "border-box",
  textAlign: "center",
};
const pill = {
  background: "rgba(0,0,0,.3)",
  color: "#fff",
  border: "none",
  borderRadius: 20,
  padding: "8px 14px",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
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
  color: "#2d3a8c",
  border: "2px solid #c7d0f5",
  borderRadius: 20,
  padding: "10px 6px",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};

function Die({ v, rolling, disabled, glow, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 78,
        height: 78,
        borderRadius: 18,
        background: "#fff",
        border: "none",
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gridTemplateRows: "repeat(3,1fr)",
        padding: 12,
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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "min(94vw, 440px)",
      }}
    >
      <button style={pill} onClick={goHome}>‹ Back</button>
      <div style={{ flex: 1 }} />
      <div style={pill}>💎 {wallet.diamonds}</div>
      <div style={pill}>🪙 {wallet.coins}</div>
    </div>
  );

  if (players.length === 0) {
    return (
      <div style={page}>
        {topBar}
        <h2 style={{ marginTop: 40 }}>Select Players</h2>
        <div style={{ display: "flex", gap: 10 }}>
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              style={{
                width: 96,
                height: 90,
                borderRadius: 16,
                border: count === n ? "4px solid #ffd54a" : "4px solid transparent",
                background: "linear-gradient(180deg,#4fb3ff,#4a6cf0)",
                color: "#fff",
                fontSize: 24,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {n}
              <div style={{ fontSize: 14 }}>Players</div>
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

  const sendMsg = (content, big) => {
    const t = content.trim();
    if (!t) return;
    setBubble({ ci, text: t, big });
    setPanel(null);
    setText("");
    clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), 2500);
  };

  const hint =
    msg || (dice === null ? "Tap the dice to roll" : "Tap a glowing pawn");

  return (
    <div style={page}>
      <style>{`
        @keyframes shake { 0%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} 100%{transform:rotate(-8deg)} }
        @keyframes pulse { 0%{box-shadow:0 0 0 0 rgba(255,255,255,.9)} 100%{box-shadow:0 0 0 12px rgba(255,255,255,0)} }
        @keyframes pop { 0%{transform:scale(.6);opacity:0} 100%{transform:scale(1);opacity:1} }
      `}</style>

      {topBar}

      <div
        style={{
          position: "relative",
          width: "min(94vw, 440px)",
          aspectRatio: "1 / 1",
          margin: "14px auto",
          background: "#eef1fb",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,.45)",
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
              background: col.hex,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "16%",
                background: "rgba(0,0,0,.28)",
                borderRadius: 14,
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
                  border: cell
                    ? cell.lane
                      ? "1px solid rgba(255,255,255,.4)"
                      : "1px solid #cdd5ee"
                    : "none",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "clamp(9px, 3.2vw, 14px)",
                  color: cell && cell.onColor ? "rgba(0,0,0,.35)" : "#8d97bd",
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
                  width: (100 / 15) * 0.74 + "%",
                  height: (100 / 15) * 0.74 + "%",
                  transform: "translate(-50%,-50%)",
                  borderRadius: "50%",
                  background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,.8), rgba(255,255,255,0) 40%), ${COLORS[pi].hex}`,
                  border: "2px solid rgba(255,255,255,.95)",
                  boxSizing: "border-box",
                  boxShadow: "0 3px 5px rgba(0,0,0,.45), inset 0 -4px 6px rgba(0,0,0,.25)",
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

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "2px 0 12px" }}>
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
        glow={COLORS[ci].hex}
        disabled={rolling || dice !== null || winner !== null}
        onClick={roll}
      />
      <p style={{ opacity: 0.9, minHeight: 24 }}>{hint}</p>

      {bubble && (
        <div
          style={{
            position: "fixed",
            top: 64,
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
              boxShadow: "0 4px 14px rgba(0,0,0,.4)",
              animation: "pop .25s",
            }}
          >
            {bubble.text}
          </div>
        </div>
      )}

      {panel && (
        <div
          style={{
            position: "fixed",
            left: 12,
            bottom: 112,
            width: "min(92vw, 360px)",
            background: "#e9ecfb",
            borderRadius: 16,
            padding: 12,
            zIndex: 24,
            boxShadow: "0 6px 20px rgba(0,0,0,.5)",
            boxSizing: "border-box",
          }}
        >
          {panel === "emoji" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => sendMsg(e, true)}
                  style={{
                    fontSize: 34,
                    background: "transparent",
                    border: "none",
                    padding: 6,
                    cursor: "pointer",
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {PHRASES.map((p) => (
                  <button key={p} onClick={() => sendMsg(p, false)} style={phrase}>
                    {p}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={40}
                  placeholder="Enter message"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: 10,
                    borderRadius: 10,
                    border: "none",
                    fontSize: 16,
                  }}
                />
                <button
                  style={{ ...yellowBtn, margin: 0, padding: "10px 16px", fontSize: 16 }}
                  onClick={() => sendMsg(text, false)}
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div
        style={{
          position: "fixed",
          left: 12,
          bottom: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 25,
        }}
      >
        <button style={pill} onClick={() => setPanel(panel === "emoji" ? null : "emoji")}>
          😀 Emoji
        </button>
        <button style={pill} onClick={() => setPanel(panel === "chat" ? null : "chat")}>
          💬 Chat
        </button>
      </div>

      <button
        style={{ ...pill, position: "fixed", right: 12, bottom: 12, zIndex: 25 }}
        onClick={() => {
          setPanel(null);
          setMsg("Pick-a-number (💎 10) comes with online games");
        }}
      >
        💎 Pick number
      </button>

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
            zIndex: 40,
          }}
        >
          <div style={{ fontSize: 72 }}>🏆</div>
          <h2 style={{ color: COLORS[winner].hex }}>{COLORS[winner].name} wins!</h2>
          <button style={yellowBtn} onClick={() => setPlayers([])}>
            Play again
          </button>
          <button
            style={{ ...yellowBtn, background: "#444", color: "#fff", boxShadow: "none" }}
            onClick={goHome}
          >
            Home
          </button>
        </div>
      )}
    </div>
  );
  }
