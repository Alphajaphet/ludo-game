import {
  COLORS, PIPS, EMOJIS, PHRASES, pill, chatBtn, phrase, yellowBtn,
} from "./ludoData.js";

export function Die({ v, rolling, disabled, glow, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 70,
        height: 70,
        borderRadius: 16,
        background: "#fff",
        border: "none",
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gridTemplateRows: "repeat(3,1fr)",
        padding: 11,
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

export function Bubble({ bubble }) {
  if (!bubble) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 70,
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
          boxShadow: "0 4px 14px rgba(0,0,0,.5)",
          animation: "pop .25s",
        }}
      >
        {bubble.text}
      </div>
    </div>
  );
}

export function ChatArea({ panel, setPanel, text, setText, onSend, onPick }) {
  return (
    <>
      {panel && (
        <div
          style={{
            position: "fixed",
            left: 12,
            bottom: 112,
            width: "min(92vw, 360px)",
            background: "linear-gradient(145deg,#15245d,#050b2d)",
            border: "2px solid #ffcf54",
            borderRadius: 16,
            padding: 12,
            zIndex: 24,
            boxShadow: "0 0 18px #148bff",
            boxSizing: "border-box",
          }}
        >
          {panel === "emoji" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => onSend(e, true)}
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
                  <button key={p} onClick={() => onSend(p, false)} style={phrase}>
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
                  onClick={() => onSend(text, false)}
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
        <button style={chatBtn} onClick={() => setPanel(panel === "emoji" ? null : "emoji")}>
          😊 Emoji
        </button>
        <button style={chatBtn} onClick={() => setPanel(panel === "chat" ? null : "chat")}>
          💬 Chat
        </button>
      </div>

      <button
        style={{ ...pill, position: "fixed", right: 12, bottom: 12, zIndex: 25, padding: "10px 14px" }}
        onClick={onPick}
      >
        💎 Pick number
      </button>
    </>
  );
}

export function Winner({ winner, onAgain, onHome }) {
  if (winner === null) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,7,43,.92)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 40,
      }}
    >
      <div style={{ fontSize: 72 }}>🏆</div>
      <h2 style={{ color: COLORS[winner].hex, textShadow: "0 0 14px #ffd45a" }}>
        {COLORS[winner].name} wins!
      </h2>
      <button style={yellowBtn} onClick={onAgain}>
        Play again
      </button>
      <button
        style={{ ...yellowBtn, background: "#444", color: "#fff", boxShadow: "none" }}
        onClick={onHome}
      >
        Home
      </button>
    </div>
  );
            }
