import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import AuthGate from "./AuthGate.jsx";
import Board from "./Board.jsx";
import Waiting from "./Waiting.jsx";
import { Arena } from "./Corners.jsx";
import { ChatArea, Bubble, Winner } from "./Parts.jsx";
import { TurnTimer, RobotBanner, calcProgress } from "./Progress.jsx";
import SoundButton from "./SoundButton.jsx";
import { sfx } from "./sound.js";
import { COLORS, canMove, page, pill, round, yellowBtn, logo } from "./ludoData.js";

function Room({ code, myId }) {
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [rolling, setRolling] = useState(false);
  const [rollCounts, setRollCounts] = useState({});
  const [busy, setBusy] = useState(false);
  const [panel, setPanel] = useState(null);
  const [text, setText] = useState("");
  const [bubble, setBubble] = useState(null);
  const [note, setNote] = useState("");
  const [, setTick] = useState(0);
  const seen = useRef(null);
  const rollTimer = useRef(null);
  const bubbleTimer = useRef(null);
  const channel = useRef(null);
  const roomRef = useRef(null);
  const offsetRef = useRef(0);
  const botKey = useRef("");
  const botAt = useRef(0);
  const prevRoom = useRef(null);
  const lastTick = useRef("");

  roomRef.current = room;

  const showBubble = (p) => {
    setBubble(p);
    clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), 2500);
  };

  useEffect(() => {
    let alive = true;
    supabase.rpc("join_room", { p_code: code }).then(({ data, error: e }) => {
      if (!alive) return;
      if (e) setError(e.message);
      else setRoom(data);
    });
    return () => {
      alive = false;
    };
  }, [code]);

  useEffect(() => {
    const t0 = Date.now();
    supabase.rpc("server_now").then(({ data }) => {
      if (data) offsetRef.current = new Date(data).getTime() - (t0 + Date.now()) / 2;
    });
  }, []);

  const roomId = room && room.id;

  useEffect(() => {
    if (!roomId) return;
    const ch = supabase.channel("room-" + roomId, {
      config: { broadcast: { self: true } },
    });
    ch.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "rooms", filter: "id=eq." + roomId },
      (payload) => setRoom(payload.new)
    );
    ch.on("broadcast", { event: "msg" }, ({ payload }) => {
      sfx("pop");
      showBubble(payload);
    });
    ch.subscribe();
    channel.current = ch;
    const poll = setInterval(async () => {
      const { data } = await supabase.from("rooms").select("*").eq("id", roomId).maybeSingle();
      if (data) setRoom(data);
    }, 4000);
    return () => {
      clearInterval(poll);
      supabase.removeChannel(ch);
    };
  }, [roomId]);

  useEffect(() => {
    const id = setInterval(() => {
      setTick((x) => x + 1);
      const r = roomRef.current;
      if (!r || r.status !== "playing" || !r.turn_deadline) return;
      const dl = new Date(r.turn_deadline).getTime();
      const now = Date.now() + offsetRef.current;
      const late = now - dl;
      const seat = r.seats[r.turn];
      const mine = seat && seat.uid === myId;
      const sec = Math.ceil((dl - now) / 1000);
      if (mine && seat.auto !== true && sec >= 1 && sec <= 3) {
        const tk = r.turn_deadline + ":" + sec;
        if (lastTick.current !== tk) {
          lastTick.current = tk;
          sfx("tick");
        }
      }
      if (late < (mine ? 300 : 2500)) return;
      const key = r.roll_no + ":" + r.turn + ":" + (r.dice === null ? "r" : "m") + ":" + r.turn_deadline;
      if (botKey.current === key && Date.now() - botAt.current < 3000) return;
      botKey.current = key;
      botAt.current = Date.now();
      supabase.rpc("bot_play", { p_id: r.id }).then(({ data }) => {
        if (data) setRoom(data);
      });
    }, 250);
    return () => clearInterval(id);
  }, [myId]);

  useEffect(() => {
    if (!room) return;
    if (seen.current === null) {
      seen.current = room.roll_no;
      return;
    }
    if (room.roll_no === seen.current) return;
    seen.current = room.roll_no;
    const lc = room.last_color;
    if (lc !== null && lc !== undefined) {
      setRollCounts((c) => ({ ...c, [lc]: (c[lc] || 0) + 1 }));
    }
    const six = room.last_roll === 6;
    sfx("roll");
    clearTimeout(rollTimer.current);
    setRolling(true);
    rollTimer.current = setTimeout(() => {
      setRolling(false);
      if (six) sfx("six");
    }, 950);
  }, [room]);

  useEffect(() => {
    if (!room) return;
    const p = prevRoom.current;
    prevRoom.current = room;
    if (!p) return;
    if (room.status === "finished" && p.status !== "finished") {
      sfx("win");
      return;
    }
    if (room.status !== "playing") return;
    if (p.status === "waiting") {
      const first = room.seats[room.turn];
      if (first && first.uid === myId) sfx("turn");
      return;
    }
    if (JSON.stringify(p.tokens) !== JSON.stringify(room.tokens)) {
      let captured = false;
      let home = false;
      Object.keys(room.tokens || {}).forEach((col) => {
        const before = (p.tokens && p.tokens[col]) || [];
        const after = room.tokens[col] || [];
        for (let k = 0; k < 4; k += 1) {
          if (after[k] === 56 && before[k] !== 56) home = true;
          if (before[k] >= 0 && after[k] === -1) captured = true;
        }
      });
      Object.keys(p.tokens || {}).forEach((col) => {
        const before = p.tokens[col] || [];
        const after = (room.tokens && room.tokens[col]) || [];
        for (let k = 0; k < 4; k += 1) {
          if (before[k] >= 0 && after[k] === -1) captured = true;
        }
      });
      sfx(captured ? "capture" : home ? "home" : "move");
    }
    const newAuto = room.seats.some(
      (s, i) => s.auto === true && !(p.seats[i] && p.seats[i].auto === true)
    );
    if (newAuto) sfx("robot");
    const cur = room.seats[room.turn];
    if (room.turn !== p.turn && cur && cur.uid === myId) sfx("turn");
  }, [room]);

  useEffect(
    () => () => {
      clearTimeout(rollTimer.current);
      clearTimeout(bubbleTimer.current);
    },
    []
  );

  if (error) {
    return (
      <div style={{ ...page, justifyContent: "center" }}>
        <h2>Can't join</h2>
        <p style={{ color: "#ff9b9b" }}>{error}</p>
        <button style={yellowBtn} onClick={() => (window.location.hash = "online")}>
          Back
        </button>
      </div>
    );
  }
  if (!room) return <div style={{ ...page, justifyContent: "center" }}>Joining room...</div>;

  const link = window.location.origin + "/#room-" + room.code;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setNote("Link copied. Paste it to your friends.");
    } catch (e) {
      setNote(link);
    }
  };
  const share = async () => {
    const t = "Join my Ludo game! Room code: " + room.code;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Ludo", text: t, url: link });
      } catch (e) {}
    } else {
      copyLink();
    }
  };
  const messenger = () => {
    window.location.href = "fb-messenger://share/?link=" + encodeURIComponent(link);
  };
  const start = async () => {
    const { data, error: e } = await supabase.rpc("start_room", { p_id: room.id });
    if (e) setNote(e.message);
    else setRoom(data);
  };

  if (room.status === "waiting") {
    return (
      <Waiting
        room={room}
        myId={myId}
        note={note}
        onStart={start}
        onShare={share}
        onCopy={copyLink}
        onMessenger={messenger}
      />
    );
  }

  const seats = room.seats;
  const players = seats.map((s) => s.color);
  const cur = seats[room.turn];
  const ci = cur.color;
  const myTurn = cur.uid === myId;
  const mySeat = seats.find((s) => s.uid === myId);
  const iAmAuto = !!(mySeat && mySeat.auto === true);
  const ended = room.status === "finished";
  const canRoll = myTurn && room.dice === null && !rolling && !busy && !ended;
  const movable =
    myTurn && room.dice !== null && !rolling && !ended
      ? [0, 1, 2, 3].filter((t) => canMove(room.tokens[ci][t], room.dice))
      : [];

  const deadlineMs = room.turn_deadline ? new Date(room.turn_deadline).getTime() : 0;
  const left = deadlineMs
    ? Math.max(0, (deadlineMs - (Date.now() + offsetRef.current)) / 1000)
    : 0;
  const curAuto = cur.auto === true;
  const timerText = curAuto
    ? myTurn
      ? "🤖 Robot is playing for you"
      : "🤖 Robot is playing for " + cur.name
    : left <= 0.3
    ? "🤖 Robot is playing..."
    : myTurn
    ? room.dice === null
      ? "Your turn: tap your dice!"
      : "Your turn: pick a pawn!"
    : cur.name + " is playing";

  const slots = {};
  seats.forEach((s) => {
    slots[s.color] = {
      name: s.name,
      avatar: s.avatar,
      pct: calcProgress(room.tokens[s.color]),
      auto: s.auto === true,
      you: s.uid === myId,
    };
  });
  const vals = room.dice_vals || {};

  const roll = async () => {
    if (!canRoll) return;
    setBusy(true);
    const { data, error: e } = await supabase.rpc("roll_dice", { p_id: room.id });
    setBusy(false);
    if (e) setNote(e.message);
    else setRoom(data);
  };

  const move = async (t) => {
    if (!movable.includes(t)) return;
    setBusy(true);
    const { data, error: e } = await supabase.rpc("move_token", { p_id: room.id, p_t: t });
    setBusy(false);
    if (e) setNote(e.message);
    else setRoom(data);
  };

  const takeControl = async () => {
    setBusy(true);
    const { data, error: e } = await supabase.rpc("take_control", { p_id: room.id });
    setBusy(false);
    if (e) setNote(e.message);
    else setRoom(data);
  };

  const sendMsg = (content, big) => {
    const t = content.trim();
    if (!t || !channel.current) return;
    const mine = seats.find((s) => s.uid === myId);
    channel.current.send({
      type: "broadcast",
      event: "msg",
      payload: {
        ci: mine ? mine.color : 0,
        text: big || !mine ? t : mine.name + ": " + t,
        big,
      },
    });
    setPanel(null);
    setText("");
  };

  const hint = myTurn
    ? room.dice === null
      ? "Tap your dice to roll"
      : "Tap a glowing pawn"
    : "Waiting for " + cur.name + "...";

  return (
    <div style={page}>
      <style>{`
        @keyframes pulse { 0%{box-shadow:0 0 0 0 rgba(255,255,255,.95)} 100%{box-shadow:0 0 0 12px rgba(255,255,255,0)} }
        @keyframes pop { 0%{transform:scale(.6);opacity:0} 100%{transform:scale(1);opacity:1} }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", maxWidth: 440 }}>
        <button style={round} onClick={() => (window.location.hash = "online")}>‹</button>
        <div style={logo}>♛ LUDO</div>
        <div style={{ flex: 1 }} />
        <SoundButton />
        <div style={pill}>Room {room.code}</div>
      </div>

      {iAmAuto && !ended && (
        <div style={{ marginTop: 6, width: "100%", maxWidth: 440 }}>
          <RobotBanner onBack={takeControl} busy={busy} />
        </div>
      )}

      {deadlineMs > 0 && !ended && (
        <div style={{ marginTop: 6, width: "100%", maxWidth: 440 }}>
          <TurnTimer
            left={left}
            total={curAuto ? 1.5 : 10}
            color={COLORS[ci].hex}
            text={timerText}
          />
        </div>
      )}

      <Arena
        slots={slots}
        vals={vals}
        rollIds={rollCounts}
        activeColor={ci}
        rollableColor={canRoll ? ci : null}
        onRoll={roll}
      >
        <Board players={players} tokens={room.tokens} ci={ci} movable={movable} onMove={move} />
      </Arena>

      <p style={{ margin: "10px 0 0", fontWeight: 800, color: "#ffe887", minHeight: 22 }}>
        {note || room.msg}
      </p>
      <p style={{ opacity: 0.85, margin: "2px 0 8px", fontSize: 14 }}>{hint}</p>

      <Bubble bubble={bubble} />

      <ChatArea
        panel={panel}
        setPanel={setPanel}
        text={text}
        setText={setText}
        onSend={sendMsg}
        onPick={() => setNote("Pick-a-number (💎 10) is coming soon")}
      />

      <Winner
        winner={ended ? room.winner : null}
        onAgain={() => (window.location.hash = "online")}
        onHome={() => (window.location.hash = "")}
      />
    </div>
  );
}

export default function RoomPage({ code }) {
  return (
    <AuthGate pending={code}>
      {(session) => <Room code={code} myId={session.user.id} />}
    </AuthGate>
  );
  }
