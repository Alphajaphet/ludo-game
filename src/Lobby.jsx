import { useState } from "react";
import { supabase } from "./supabase";
import AuthGate from "./AuthGate.jsx";
import { page, round, yellowBtn, logo } from "./ludoData.js";

function LobbyInner() {
  const [max, setMax] = useState(2);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const go = (c) => {
    window.location.hash = "room-" + c;
  };

  const create = async () => {
    setBusy(true);
    setErr("");
    const { data, error } = await supabase.rpc("create_room", { p_max: max });
    setBusy(false);
    if (error) setErr(error.message);
    else go(data.code);
  };

  const join = async () => {
    const c = code.trim().toUpperCase();
    if (c.length < 3) {
      setErr("Enter the room code");
      return;
    }
    setBusy(true);
    setErr("");
    const { data, error } = await supabase.rpc("join_room", { p_code: c });
    setBusy(false);
    if (error) setErr(error.message);
    else go(data.code);
  };

  return (
    <div style={page}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", maxWidth: 440 }}>
        <button style={round} onClick={() => (window.location.hash = "")}>‹</button>
        <div style={logo}>♛ LUDO</div>
      </div>

      <h2 style={{ marginTop: 28, color: "#ffdb75", textShadow: "0 0 12px orange" }}>
        Play online
      </h2>

      <p style={{ margin: "4px 0", fontWeight: 700 }}>Create a room</p>
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
      <button style={{ ...yellowBtn, marginTop: 14 }} onClick={create} disabled={busy}>
        Create room
      </button>

      <p style={{ margin: "30px 0 6px", fontWeight: 700 }}>Or join with a code</p>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        maxLength={5}
        placeholder="CODE"
        style={{
          padding: 12,
          fontSize: 24,
          letterSpacing: 6,
          borderRadius: 10,
          border: "none",
          textAlign: "center",
          width: 180,
        }}
      />
      <button style={{ ...yellowBtn, marginTop: 10 }} onClick={join} disabled={busy}>
        Join
      </button>
      {err && <p style={{ color: "#ff9b9b" }}>{err}</p>}
    </div>
  );
}

export default function Lobby() {
  return <AuthGate>{() => <LobbyInner />}</AuthGate>;
              }
