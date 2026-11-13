import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import { COLORS, SAFE, canMove, page, pill, round, yellowBtn, logo } from "./ludoData.js";
import Board from "./Board.jsx";
import { Die, ChatArea, Bubble, Winner } from "./Parts.jsx";

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

      <Board
        players={players}
        tokens={tokens}
        ci={ci}
        movable={movable}
        onMove={moveToken}
      />

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

      <Bubble bubble={bubble} />

      <ChatArea
        panel={panel}
        setPanel={setPanel}
        text={text}
        setText={setText}
        onSend={sendMsg}
        onPick={() => {
          setPanel(null);
          setMsg("Pick-a-number (💎 10) comes with online games");
        }}
      />

      <Winner winner={winner} onAgain={() => setPlayers([])} onHome={goHome} />
    </div>
  );
      }
