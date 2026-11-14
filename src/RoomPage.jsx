import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import AuthGate from "./AuthGate.jsx";
import Board from "./Board.jsx";
import Waiting from "./Waiting.jsx";
import { Die, ChatArea, Bubble, Winner } from "./Parts.jsx";
import { PlayerBar, TurnTimer, RobotBanner, calcProgress } from "./Progress.jsx";
import { COLORS, canMove, page, pill, round, yellowBtn, logo } from "./ludoData.js";

function Room({ code, myId }) {
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [face, setFace] = useState(6);
  const [rolling, setRolling] = useState(false);
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
    ch.on("broadcast", { event: "msg" }, ({ payload }) => showBubble(payload));
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
      const late = Date.now() + offsetRef.current - new Date(r.turn_deadline).getTime();
      const mine = r.seats[r.turn] && r.seats[r.turn].uid === myId;
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
      if (room.last_roll) setFace(room.last_roll);
      return;
    }
    if (room.roll_no === seen.current) return;
    seen.current = room.roll_no;
    const final = room.last_roll;
    clearInterval(rollTimer.current);
    setRolling(true);
    let n = 0;
    rollTimer.current = setInterval(() => {
      n += 1;
      if (n >= 7) {
        clearInterval(rollTimer.current);
        setFace(final);
        setRolling(false);
      } else {
        setFace(1 + Math.floor(Math.random() * 6));
      }
    }, 80);
  }, [room]);

  useEffect(
    () => () => {
      clearInterval(rollTimer.current);
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
      ? "Your turn: roll the dice!"
      : "Your turn: pick a pawn!"
    : cur.name + " is playing";

  const items = seats.map((s, i) => ({
    key: s.uid,
    color: s.color,
    label: s.name,
    avatar: s.avatar,
    pct: calcProgress(room.tokens[s.color]),
    active: i === room.turn,
    you: s.uid === myId,
    auto: s.auto === true,
  }));

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
      ? "Tap GO to roll"
      : "Tap a glowing pawn"
    : "Waiting for " + cur.name + "...";

  return (
    <div style={page}>
      <style>{`
        @keyframes shake { 0%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} 100%{transform:rotate(-8deg)} }
        @keyframes pulse { 0%{box-shadow:0 0 0 0 rgba(255,255,255,.95)} 100%{box-shadow:0 0 0 12px rgba(255,255,255,0)} }
        @keyframes pop { 0%{transform:scale(.6);opacity:0} 100%{transform:scale(1);opacity:1} }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", maxWidth: 440 }}>
        <button style={round} onClick={() => (window.location.hash = "online")}>‹</button>
        <div style={logo}>♛ LUDO</div>
        <div style={{ flex: 1 }} />
        <div style={pill}>Room {room.code}</div>
      </div>

      <PlayerBar items={items} />

      {iAmAuto && !ended && <RobotBanner onBack={takeControl} busy={busy} />}

      {deadlineMs > 0 && !ended && (
        <TurnTimer
          left={left}
          total={curAuto ? 1.5 : 10}
          color={COLORS[ci].hex}
          text={timerText}
        />
      )}

      <Board players={players} tokens={room.tokens} ci={ci} movable={movable} onMove={move} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          margin: "14px 0 4px",
        }}
      >
        <Die v={face} rolling={rolling} glow={COLORS[ci].hex} disabled={!canRoll} onClick={roll} />
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

      <p style={{ margin: "8px 0 0", fontWeight: 800, color: "#ffe887", minHeight: 22 }}>
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
