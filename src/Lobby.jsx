import { useState } from "react";
import { supabase } from "./supabase";
import AuthGate from "./AuthGate.jsx";
import { page, round, yellowBtn, logo } from "./ludoData.js";

const bigCard = {
  width: "100%",
  maxWidth: 360,
  minHeight: 175,
  borderRadius: 26,
  border: "3px solid #ffda57",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 2,
  margin: "10px 0",
  padding: "14px 10px",
  fontWeight: 900,
};

const numBtn = {
  width: 80,
  height: 76,
  borderRadius: 16,
  border: "3px solid #ffda57",
  background: "linear-gradient(#26dfff,#0060ff,#062a9d)",
  boxShadow: "0 0 14px #00aaff",
  color: "#fff",
  fontSize: 26,
  fontWeight: 900,
  cursor: "pointer",
};

function LobbyInner() {
  const [pick, setPick] = useState(null);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const open = (kind) => {
    setErr("");
    setPick(kind);
  };

  const start = async (n) => {
    setBusy(true);
    setErr("");
    const fn = pick === "quick" ? "quick_match" : "create_room";
    const { data, error } = await supabase.rpc(fn, { p_max: n });
    setBusy(false);
    if (error) setErr(error.message);
    else window.location.hash = "room-" + data.code;
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
    else window.location.hash = "room-" + data.code;
  };

  return (
    <div style={page}>
      <style>{`
        @keyframes bob {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-8px) rotate(5deg); }
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", maxWidth: 440 }}>
        <button style={round} onClick={() => (window.location.hash = "")}>‹</button>
        <div>
          <div style={logo}>♛ LUDO</div>
          <div style={{ fontSize: 9, letterSpacing: 1, color: "#ffe887", fontWeight: 700, textAlign: "left" }}>
            ONLINE
          </div>
        </div>
      </div>

      <div style={{ height: 20 }} />

      <button
        style={{
          ...bigCard,
          background: "linear-gradient(160deg,#26dfff,#0060ff,#062a9d)",
          color: "#fff",
          boxShadow: "0 0 26px #00aaff, 0 6px 0 rgba(0,0,0,.35)",
        }}
        onClick={() => open("quick")}
      >
        <span style={{ fontSize: 78, lineHeight: 1.1, animation: "bob 1.6s ease-in-out infinite" }}>
          😉
        </span>
        <span style={{ fontSize: 32, letterSpacing: 1, textShadow: "0 3px rgba(0,0,0,.4)" }}>
          PLAY NOW
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.9 }}>
          Match with players who are online
        </span>
      </button>

      <button
        style={{
          ...bigCard,
          background: "linear-gradient(160deg,#ffe66b,#ffb300,#e07800)",
          color: "#5a2a00",
          boxShadow: "0 0 26px #ffb300, 0 6px 0 rgba(0,0,0,.35)",
        }}
        onClick={() => open("room")}
      >
        <span style={{ fontSize: 78, lineHeight: 1.1 }}>🏰</span>
        <span style={{ fontSize: 32, letterSpacing: 1, textShadow: "0 2px rgba(255,255,255,.4)" }}>
          CREATE ROOM
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.85 }}>
          Invite friends with a link or code
        </span>
      </button>

      <p style={{ margin: "22px 0 6px", fontWeight: 700, opacity: 0.9 }}>Have a code?</p>
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
        <button
          style={{ ...yellowBtn, margin: 0, padding: "12px 24px" }}
          onClick={join}
          disabled={busy}
        >
          Join
        </button>
      </div>
      {!pick && err && <p style={{ color: "#ff9b9b" }}>{err}</p>}

      {pick && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2,7,43,.88)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => !busy && setPick(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(88vw, 340px)",
              background: "linear-gradient(145deg,#15245d,#050b2d)",
              border: "2px solid #ffcf54",
              borderRadius: 22,
              padding: 20,
              textAlign: "center",
              boxShadow: "0 0 24px #148bff",
            }}
          >
            <div style={{ fontSize: 48 }}>{pick === "quick" ? "😉" : "🏰"}</div>
            <h3 style={{ margin: "4px 0 14px", color: "#ffdb75", textShadow: "0 0 12px orange" }}>
              {pick === "quick" ? "Play now" : "Create a room"}
            </h3>
            <p style={{ margin: "0 0 10px", fontWeight: 700 }}>How many players?</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              {[2, 3, 4].map((n) => (
                <button key={n} disabled={busy} onClick={() => start(n)} style={numBtn}>
                  {n}
                  <div style={{ fontSize: 11 }}>Players</div>
                </button>
              ))}
            </div>
            {busy && (
              <p style={{ margin: "14px 0 0", color: "#ffe887", fontWeight: 700 }}>
                {pick === "quick" ? "Finding players..." : "Creating room..."}
              </p>
            )}
            {err && <p style={{ color: "#ff9b9b", margin: "12px 0 0" }}>{err}</p>}
            <button
              disabled={busy}
              onClick={() => setPick(null)}
              style={{
                marginTop: 16,
                background: "transparent",
                border: "none",
                color: "#cfd8ff",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Lobby() {
  return <AuthGate>{() => <LobbyInner />}</AuthGate>;
                       }
