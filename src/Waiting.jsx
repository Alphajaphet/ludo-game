import { supabase } from "./supabase";
import { page, round, yellowBtn, logo, pill } from "./ludoData.js";

export default function Waiting({ room, myId, note, onStart, onShare, onCopy, onMessenger }) {
  const isHost = room.host === myId;
  const n = room.seats.length;
  const slots = Array.from({ length: room.max_players }).map((_, i) => room.seats[i] || null);

  const leave = async () => {
    await supabase.rpc("leave_room", { p_id: room.id });
    window.location.hash = "online";
  };

  return (
    <div style={page}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", maxWidth: 440 }}>
        <button style={round} onClick={leave}>‹</button>
        <div style={logo}>♛ LUDO</div>
      </div>

      <h3 style={{ marginTop: 22, marginBottom: 0, color: "#ffdb75" }}>
        {room.is_public ? "Finding players..." : "Private room"}
      </h3>
      <div
        style={{
          fontSize: 48,
          fontWeight: 900,
          letterSpacing: 8,
          color: "#fff2a2",
          textShadow: "0 0 18px #ffcf35",
        }}
      >
        {room.code}
      </div>
      <p style={{ opacity: 0.85, margin: "2px 0 12px" }}>
        Players {n}/{room.max_players}
      </p>

      <div style={{ width: "100%", maxWidth: 360 }}>
        {slots.map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(0,0,0,.35)",
              borderRadius: 14,
              padding: "8px 14px",
              margin: "6px 0",
              fontWeight: 700,
              fontSize: 18,
              opacity: s ? 1 : 0.5,
            }}
          >
            <span style={{ fontSize: 28 }}>{s ? s.avatar : "⏳"}</span>
            {s ? s.name : "Waiting for player..."}
            {s && s.uid === room.host && (
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#ffd54a" }}>HOST</span>
            )}
          </div>
        ))}
      </div>

      <p style={{ opacity: 0.8, margin: "14px 0 6px", fontSize: 14 }}>Invite friends to this room</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <button style={{ ...pill, padding: "10px 14px" }} onClick={onMessenger}>
          💬 Messenger
        </button>
        <button style={{ ...pill, padding: "10px 14px" }} onClick={onShare}>
          📤 Share
        </button>
        <button style={{ ...pill, padding: "10px 14px" }} onClick={onCopy}>
          🔗 Copy link
        </button>
      </div>

      <div style={{ marginTop: 18 }}>
        {room.is_public ? (
          <p style={{ opacity: 0.9, maxWidth: 300 }}>
            The game starts automatically when the room is full.
          </p>
        ) : isHost ? (
          <button
            style={{ ...yellowBtn, opacity: n >= 2 ? 1 : 0.5 }}
            onClick={onStart}
            disabled={n < 2}
          >
            Start game
          </button>
        ) : (
          <p style={{ opacity: 0.9 }}>Waiting for the host to start...</p>
        )}
      </div>
      {note && <p style={{ color: "#ffe887", maxWidth: 300 }}>{note}</p>}
    </div>
  );
}
