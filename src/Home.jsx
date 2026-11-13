import { useRef, useState } from "react";

const pill = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "rgba(0,0,0,.3)",
  color: "#fff",
  borderRadius: 20,
  padding: "7px 12px",
  fontSize: 16,
  fontWeight: 700,
  border: "none",
  cursor: "pointer",
};
const plus = {
  background: "#ffd54a",
  color: "#5a2a00",
  borderRadius: "50%",
  width: 22,
  height: 22,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 15,
  fontWeight: 900,
};
const card = {
  border: "none",
  borderRadius: 22,
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
  position: "relative",
  textShadow: "0 2px 3px rgba(0,0,0,.35)",
  boxShadow: "0 5px 0 rgba(0,0,0,.25)",
};

export default function Home({ profile, onPlayLocal, onEdit, onLogout }) {
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState(false);
  const t = useRef(null);

  const soon = (what) => {
    setMenu(false);
    setToast(what + " is coming soon");
    clearTimeout(t.current);
    t.current = setTimeout(() => setToast(""), 1800);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#4b3fa3 0%,#3a3180 45%,#2d2766 100%)",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        padding: "14px 14px 110px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 440, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={onEdit}
            style={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              border: "3px solid #4fb3ff",
              background: "rgba(255,255,255,.2)",
              fontSize: 30,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {profile.avatar}
          </button>
          <div style={pill}>
            🪙 {profile.coins}
            <span style={plus} onClick={() => soon("Buying coins")}>+</span>
          </div>
          <div style={pill}>
            💎 {profile.diamonds}
            <span style={plus} onClick={() => soon("Watching ads")}>▶</span>
          </div>
          <div style={{ flex: 1 }} />
          <button style={pill} onClick={() => setMenu(!menu)}>⚙️</button>
        </div>

        {menu && (
          <div
            style={{
              position: "absolute",
              right: 14,
              marginTop: 6,
              background: "#fff",
              color: "#222",
              borderRadius: 12,
              overflow: "hidden",
              zIndex: 10,
              boxShadow: "0 6px 20px rgba(0,0,0,.4)",
            }}
          >
            <div
              style={{ padding: "12px 20px", fontWeight: 700, cursor: "pointer" }}
              onClick={() => {
                setMenu(false);
                onEdit();
              }}
            >
              Edit profile
            </div>
            <div
              style={{ padding: "12px 20px", fontWeight: 700, cursor: "pointer", borderTop: "1px solid #eee" }}
              onClick={onLogout}
            >
              Log out
            </div>
          </div>
        )}

        <p style={{ margin: "12px 4px 0", fontSize: 18, fontWeight: 700 }}>
          Hi, {profile.display_name}
        </p>

        <div style={{ display: "flex", justifyContent: "space-around", margin: "18px 0 8px" }}>
          {[
            ["🎁", "Daily Reward"],
            ["🪙", "Free Coins"],
            ["📝", "Feedback"],
          ].map(([icon, label]) => (
            <div
              key={label}
              onClick={() => soon(label)}
              style={{ textAlign: "center", cursor: "pointer" }}
            >
              <div style={{ fontSize: 38 }}>{icon}</div>
              <div
                style={{
                  background: "rgba(0,0,0,.3)",
                  borderRadius: 12,
                  padding: "3px 10px",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, margin: "18px 0 12px" }}>
          <button
            onClick={() => { window.location.hash = "online"; }}
            style={{
              ...card,
              flex: 1,
              height: 190,
              fontSize: 28,
              background: "linear-gradient(160deg,#ffd54a,#f08c00)",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                background: "#e2493b",
                borderRadius: 10,
                padding: "2px 8px",
                fontSize: 13,
              }}
            >
              HOT
            </span>
            <div style={{ fontSize: 70 }}>🎲</div>
            ONLINE
          </button>
          <button
            onClick={onPlayLocal}
            style={{
              ...card,
              flex: 1,
              height: 190,
              fontSize: 28,
              background: "linear-gradient(160deg,#ff8a65,#e2493b)",
            }}
          >
            <div style={{ fontSize: 70 }}>♟️</div>
            LOCAL
          </button>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => { window.location.hash = "online"; }}
            style={{
              ...card,
              flex: 1,
              height: 110,
              fontSize: 17,
              background: "linear-gradient(160deg,#26c6da,#00897b)",
            }}
          >
            <div style={{ fontSize: 38 }}>💬</div>
            Invite Friends
          </button>
          <button
            onClick={() => soon("Pro plan")}
            style={{
              ...card,
              flex: 1,
              height: 110,
              fontSize: 17,
              background: "linear-gradient(160deg,#4fb3ff,#4a6cf0)",
            }}
          >
            <div style={{ fontSize: 38 }}>👑</div>
            Go Pro
          </button>
        </div>
      </div>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 100,
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
              background: "rgba(0,0,0,.8)",
              borderRadius: 20,
              padding: "10px 18px",
              fontWeight: 700,
            }}
          >
            {toast}
          </div>
        </div>
      )}

      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          justifyContent: "space-around",
          padding: "10px 6px 14px",
          background: "rgba(20,16,60,.92)",
          zIndex: 20,
        }}
      >
        {[
          ["👥", "Friends"],
          ["🏆", "Ranking"],
          ["👑", "Pro"],
          ["📋", "Mission"],
          ["🛒", "Shop"],
        ].map(([icon, label]) => (
          <div
            key={label}
            onClick={() => soon(label)}
            style={{ textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
          >
            <div style={{ fontSize: 26 }}>{icon}</div>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
              }
