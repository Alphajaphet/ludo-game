import { page, round, yellowBtn, logo, pill } from "./ludoData.js";

export default function Waiting({ room, myId, note, onStart, onShare, onCopy, onMessenger }) {
  const isHost = room.host === myId;
  const n = room.seats.length;
  return (
    <div style={page}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", maxWidth: 440 }}>
        <button style={round} onClick={() => (window.location.hash = "online")}>‹</button>
        <div style={logo}>♛ LUDO</div>
      </div>

      <h3 style={{ marginTop: 26, marginBottom: 0, color: "#ffdb75" }}>Room code</h3>
      <div
        style={{
          fontSize: 52,
          fontWeight: 900,
          letterSpacing: 8,
          color: "#fff2a2",
          textShadow: "0 0 18px #ffcf35",
        }}
      >
        {room.code}
      </div>
      <p style={{ opacity: 0.85, margin: "4px 0 14px" }}>
        Players {n}/{room.max_players}
      </p>

      <div style={{ width: "100%", maxWidth: 360 }}>
        {room.seats.map((s) => (
          <div
            key={s.uid}
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
            }}
          >
            <span style={{ fontSize: 28 }}>{s.avatar}</span>
            {s.name}
            {s.uid === room.host && (
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#ffd54a" }}>HOST</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, margin: "16px 0", flexWrap: "wrap", justifyContent: "center" }}>
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

      {isHost ? (
        <button
          style={{ ...yellowBtn, opacity: n >= 2 ? 1 : 0.5 }}
          onClick={onStart}
          disabled={n < 2}
        >
          Start game
        </button>
      ) : (
        <p style={{ opacity: 0.85 }}>Waiting for the host to start...</p>
      )}
      {note && <p style={{ color: "#ffe887", maxWidth: 300 }}>{note}</p>}
    </div>
  );
      }
