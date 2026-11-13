import { useState } from "react";
import { supabase } from "./supabase";
import AuthGate from "./AuthGate.jsx";
import { page, round, yellowBtn, pill, logo } from "./ludoData.js";

function LobbyInner() {
  const [max, setMax] = useState(2);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const go = (c) => {
    window.location.hash = "room-" + c;
  };

  const run = async (fn, args) => {
    setBusy(true);
    setErr("");
    const { data, error } = await supabase.rpc(fn, args);
    setBusy(false);
    if (error) setErr(error.message);
    else go(data.code);
  };

  const join = () => {
    const c = code.trim().toUpperCase();
    if (c.length < 3) {
      setErr("Enter the room code");
      return;
    }
    run("join_room", { p_code: c });
  };

  return (
    <div style={page}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", maxWidth: 440 }}>
        <button style={round} onClick={() => (window.location.hash = "")}>‹</button>
        <div style={logo}>♛ LUDO</div>
      </div>

      <h2 style={{ marginTop: 24, color: "#ffdb75", textShadow: "0 0 12px orange" }}>
        Play online
      </h2>

      <p style={{ margin: "0 0 8px", fontWeight: 700 }}>How many players?</p>
      <div style={{ display: "flex", gap: 10 }}>
        {[2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => setMax(n)}
            style={{
              width: 88,
              height: 80,
              borderRadius: 16,
              border: max === n ? "4px solid #ffd54a" : "4px solid transparent",
              background: "linear-gradient(#26dfff,#0060ff,#062a9d)",
              boxShadow: "0 0 14px #00aaff",
              color: "#fff",
              fontSize: 24,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            {n}
            <div style={{ fontSize: 12 }}>Players</div>
          </button>
        ))}
      </div>

      <button
        style={{ ...yellowBtn, marginTop: 20, fontSize: 24, padding: "16px 40px" }}
        onClick={() => run("quick_match", { p_max: max })}
        disabled={busy}
      >
        ⚡ Play now
      </button>
      <p style={{ opacity: 0.75, margin: "0 0 6px", fontSize: 13, maxWidth: 280 }}>
        Finds other players who are online and want to play
      </p>

      <button
        style={{ ...pill, marginTop: 14, padding: "12px 22px", fontSize: 16 }}
        onClick={() => run("create_room", { p_max: max })}
        disabled={busy}
      >
        👥 Create private room (invite friends)
      </button>

      <p style={{ margin: "28px 0 6px", fontWeight: 700 }}>Have a code?</p>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={5}
          placeholder="CODE"
          style={{
            padding: 12,
            fontSize: 22,
            letterSpacing: 6,
            borderRadius: 10,
            border: "none",
            textAlign: "center",
            width: 150,
          }}
        />
        <button style={{ ...yellowBtn, margin: 0, padding: "12px 24px" }} onClick={join} disabled={busy}>
          Join
        </button>
      </div>
      {err && <p style={{ color: "#ff9b9b" }}>{err}</p>}
    </div>
  );
}

export default function Lobby() {
  return <AuthGate>{() => <LobbyInner />}</AuthGate>;
}
