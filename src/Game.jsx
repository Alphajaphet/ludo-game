import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import { COLORS, SAFE, canMove, page, pill, round, yellowBtn, logo } from "./ludoData.js";
import Board from "./Board.jsx";
import { Arena } from "./Corners.jsx";
import { ChatArea, Bubble, Winner } from "./Parts.jsx";
import { TurnTimer, calcProgress, pickBest } from "./Progress.jsx";
import SoundButton from "./SoundButton.jsx";
import { AdButton } from "./Ads.jsx";
import { sfx } from "./sound.js";
import { aiPick } from "./ai.js";

const HUMAN = 2;
const ORDER = { 2: [2, 0], 3: [2, 3, 0], 4: [2, 3, 0, 1] };

export default function Game() {
  const [players, setPlayers] = useState([]);
  const [bots, setBots] = useState([]);
  const [screen, setScreen] = useState("menu");
  const [opp, setOpp] = useState(1);
  const [count, setCount] = useState(2);
  const [tokens, setTokens] = useState({});
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState(null);
  const [diceVals, setDiceVals] = useState({});
  const [rollCounts, setRollCounts] = useState({});
  const [rolling, setRolling] = useState(false);
  const [msg, setMsg] = useState("");
  const [winner, setWinner] = useState(null);
  const [wallet, setWallet] = useState({ coins: 0, diamonds: 0 });
  const [me, setMe] = useState({ avatar: "🙂", name: "You" });
  const [panel, setPanel] = useState(null);
  const [text, setText] = useState("");
  const [bubble, setBubble] = useState(null);
  const [, setTick] = useState(0);
  const timer = useRef(null);
  const bubbleTimer = useRef(null);
  const actRef = useRef(null);
  const lastTick = useRef("");
  const phase = useRef({ key: "", t: 0 });

  useEffect(
    () => () => {
      clearTimeout(timer.current);
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
        .select("coins,diamonds,avatar,display_name")
        .eq("id", id)
        .maybeSingle()
        .then(({ data: p }) => {
          if (!p) return;
          setWallet({ coins: p.coins, diamonds: p.diamonds });
          setMe({ avatar: p.avatar || "🙂", name: p.display_name || "You" });
        });
    });
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setTick((x) => x + 1);
      if (actRef.current) actRef.current();
    }, 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (players.length && bots.length && winner === null && !bots.includes(players[turn])) {
      sfx("turn");
    }
  }, [turn, players]);

  const goHome = () => {
    window.location.hash = "";
  };

  const begin = (list, botList, firstMsg) => {
    const t = {};
    list.forEach((c) => (t[c] = [-1, -1, -1, -1]));
    setPlayers(list);
    setBots(botList);
    setTokens(t);
    setTurn(0);
    setDice(null);
    setDiceVals({});
    setRollCounts({});
    setWinner(null);
    setMsg(firstMsg || "");
  };

  const startPass = (n) => {
    sfx("tap");
    begin(n === 2 ? [0, 2] : n === 3 ? [0, 1, 2] : [0, 1, 2, 3], [], "");
  };

  const startCpu = (o) => {
    sfx("tap");
    const list = ORDER[o + 1];
    begin(
      list,
      list.filter((c) => c !== HUMAN),
      "You are Red (bottom-right). Tap your dice!"
    );
  };

  const topBar = (
    <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", maxWidth: 440 }}>
      <button style={round} onClick={goHome}>‹</button>
      <div style={{ textAlign: "left" }}>
        <div style={logo}>♛ LUDO</div>
        <div style={{ fontSize: 9, letterSpacing: 1, color: "#ffe887", fontWeight: 700 }}>
          TRIPLE TTT
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <SoundButton />
      <div style={pill}>💎 {wallet.diamonds}</div>
      <div style={pill}>🪙 {wallet.coins}</div>
    </div>
  );

  if (players.length === 0 && screen === "pass") {
    return (
      <div style={page}>
        {topBar}
        <h2 style={{ marginTop: 40, color: "#ffdb75", textShadow: "0 0 12px orange" }}>
          Play with friends
        </h2>
        <div style={{ margin: "6px 0 14px" }}><AdButton onReward={(d) => setWallet((w) => ({ ...w, diamonds: d }))} /></div>
        <p style={{ margin: "0 0 14px", opacity: 0.85 }}>How many computer players?</p>
        <div style={{ display: "flex", gap: 10 }}>
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => {
                sfx("tap");
                setCount(n);
              }}
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
          style={{ ...yellowBtn, marginTop: 30, fontSize: 24, padding: "14px 56px" }}
          onClick={() => startPass(count)}
        >
          Start
        </button>
        <p style={{ opacity: 0.7, maxWidth: 280 }}>
          Pass the phone between players. Each turn has 10 seconds before the robot plays.
        </p>
        <button
          style={{ ...pill, marginTop: 6, padding: "10px 18px" }}
          onClick={() => setScreen("menu")}
        >
          ← Play vs Computer
        </button>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div style={page}>
        {topBar}
        <div style={{ fontSize: 64, marginTop: 24 }}>🤖</div>
        <h2 style={{ margin: "4px 0 2px", color: "#ffdb75", textShadow: "0 0 12px orange" }}>
          Play vs Computer
        </h2>
        <p style={{ margin: "0 0 14px", opacity: 0.85 }}>How many computer players?</p>
        <div style={{ display: "flex", gap: 10 }}>
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => {
                sfx("tap");
                setOpp(n);
              }}
              style={{
                width: 92,
                height: 84,
                borderRadius: 16,
                border: opp === n ? "4px solid #ffd54a" : "4px solid transparent",
                background: "linear-gradient(#26dfff,#0060ff,#062a9d)",
                boxShadow: "0 0 14px #00aaff",
                color: "#fff",
                fontSize: 26,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {n}
              <div style={{ fontSize: 12 }}>{n === 1 ? "Computer" : "Computers"}</div>
            </button>
          ))}
        </div>
        <button
          style={{ ...yellowBtn, marginTop: 26, fontSize: 28, padding: "18px 44px" }}
          onClick={() => startCpu(opp)}
        >
          ▶ PLAY NOW
        </button>
        <button
          style={{ ...pill, marginTop: 24, padding: "12px 20px", fontSize: 15 }}
          onClick={() => {
            sfx("tap");
            setScreen("pass");
          }}
        >
          👥 Play with friends on this phone
        </button>
      </div>
    );
  }

  const ci = players[turn];
  const isBot = bots.includes(ci);
  const canRollNow = !(rolling || dice !== null || winner !== null);
  const canRoll = canRollNow && !isBot;
  const movable =
    dice !== null && !rolling
      ? [0, 1, 2, 3].filter((t) => canMove(tokens[ci][t], dice))
      : [];

  const roll = () => {
    if (!canRollNow) return;
    const v = 1 + Math.floor(Math.random() * 6);
    sfx("roll");
    setRolling(true);
    setMsg("");
    setDiceVals((d) => ({ ...d, [ci]: v }));
    setRollCounts((c) => ({ ...c, [ci]: (c[ci] || 0) + 1 }));
    timer.current = setTimeout(() => {
      setRolling(false);
      setDice(v);
      if (v === 6) sfx("six");
      const any = [0, 1, 2, 3].some((t) => canMove(tokens[ci][t], v));
      if (!any) {
        setMsg("No move possible");
        timer.current = setTimeout(() => {
          setDice(null);
          setMsg("");
          setTurn((x) => (x + 1) % players.length);
        }, 1100);
      }
    }, 950);
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
      sfx("win");
      setWinner(ci);
      return;
    }
    sfx(captured ? "capture" : np === 56 ? "home" : "move");
    if (dice === 6 || captured || np === 56) {
      setMsg(
        captured ? "Captured! Roll again" : np === 56 ? "Home! Roll again" : "Six! Roll again"
      );
    } else {
      setMsg("");
      setTurn((turn + 1) % players.length);
    }
  };

  const key = turn + "-" + dice + "-" + winner;
  if (phase.current.key !== key) phase.current = { key, t: Date.now() + 10000 };
  const left = Math.max(0, (phase.current.t - Date.now()) / 1000);

  actRef.current = () => {
    if (winner !== null || rolling) return;
    if (isBot) {
      if (Date.now() < phase.current.t - 10000 + (dice === null ? 900 : 1000)) return;
      if (dice === null) roll();
      else if (movable.length) moveToken(aiPick(ci, dice, movable, tokens, players));
      return;
    }
    const rem = Math.ceil((phase.current.t - Date.now()) / 1000);
    if (rem <= 3 && rem >= 1 && lastTick.current !== key + ":" + rem) {
      lastTick.current = key + ":" + rem;
      sfx("tick");
    }
    if (Date.now() < phase.current.t) return;
    if (dice === null) {
      sfx("robot");
      roll();
    } else if (movable.length) {
      sfx("robot");
      moveToken(pickBest(tokens[ci], dice, movable));
    }
  };

  const sendMsg = (content, big) => {
    const t = content.trim();
    if (!t) return;
    sfx("pop");
    setBubble({ ci: bots.length ? HUMAN : ci, text: t, big });
    setPanel(null);
    setText("");
    clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), 2500);
  };

  const slots = {};
  players.forEach((c) => {
    const bi = bots.indexOf(c);
    if (bots.length === 0) {
      slots[c] = {
        name: COLORS[c].name,
        avatar: "♟",
        pct: calcProgress(tokens[c]),
        auto: false,
        you: false,
      };
    } else if (bi >= 0) {
      slots[c] = {
        name: bots.length > 1 ? "Computer " + (bi + 1) : "Computer",
        avatar: "🤖",
        pct: calcProgress(tokens[c]),
        auto: false,
        you: false,
      };
    } else {
      slots[c] = {
        name: me.name,
        avatar: me.avatar,
        pct: calcProgress(tokens[c]),
        auto: false,
        you: true,
      };
    }
  });

  const hint = isBot
    ? "Computer is playing..."
    : msg || (dice === null ? "Tap the glowing dice to roll" : "Tap a glowing pawn");
  const timerText =
    left <= 0.3
      ? "🤖 Robot is playing..."
      : (bots.length ? "Your turn: " : COLORS[ci].name + ": ") +
        (dice === null ? "roll the dice" : "pick a pawn");

  return (
    <div style={page}>
      <style>{`
        @keyframes pulse { 0%{box-shadow:0 0 0 0 rgba(255,255,255,.95)} 100%{box-shadow:0 0 0 12px rgba(255,255,255,0)} }
        @keyframes pop { 0%{transform:scale(.6);opacity:0} 100%{transform:scale(1);opacity:1} }
      `}</style>

      {topBar}

      {winner === null && (
        <div style={{ marginTop: 6, width: "100%", maxWidth: 440 }}>
          {isBot ? (
            <div
              style={{
                margin: "4px 0 6px",
                fontSize: 13,
                fontWeight: 700,
                textAlign: "left",
                color: "#ffe887",
                height: 28,
              }}
            >
              🤖 {slots[ci].name} is thinking...
            </div>
          ) : (
            <TurnTimer left={left} total={10} color={COLORS[ci].hex} text={timerText} />
          )}
        </div>
      )}

      <Arena
        slots={slots}
        vals={diceVals}
        rollIds={rollCounts}
        activeColor={ci}
        rollableColor={canRoll ? ci : null}
        onRoll={roll}
      >
        <Board
          players={players}
          tokens={tokens}
          ci={ci}
          movable={isBot ? [] : movable}
          onMove={moveToken}
        />
      </Arena>

      <p style={{ opacity: 0.9, minHeight: 24, margin: "10px 0 8px" }}>{hint}</p>

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

      <Winner
        winner={winner}
        onAgain={() => {
          setPlayers([]);
          setScreen("menu");
        }}
        onHome={goHome}
      />
    </div>
  );
}
