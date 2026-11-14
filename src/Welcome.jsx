import { useEffect } from "react";

const badges = [
  { name: "Truth", ring: "#ffca05", glow: "#fff7a1" },
  { name: "Tamasha", ring: "#087cff", glow: "#baffff" },
  { name: "Tereza", ring: "#f21d16", glow: "#ffc0ad" },
];

export default function Welcome({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 6000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      onClick={onDone}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        boxSizing: "border-box",
        textAlign: "center",
        color: "#fff",
        fontFamily: "system-ui, Arial, sans-serif",
        background:
          "radial-gradient(ellipse at 50% 18%, rgba(62,130,255,.6), transparent 50%), linear-gradient(145deg,#02072b,#081a55,#16043b)",
      }}
    >
      <style>{`
        @keyframes wlUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes wlBob { 0%,100% { transform: translateY(0) rotate(-8deg); } 50% { transform: translateY(-10px) rotate(8deg); } }
        @keyframes wlGlow { 0%,100% { text-shadow: 0 4px #a34a00, 0 0 18px #ffcf35; } 50% { text-shadow: 0 4px #a34a00, 0 0 38px #ffcf35; } }
        @keyframes wlTwinkle { 0%,100% { opacity: .3; } 50% { opacity: 1; } }
      `}</style>

      <div style={{ color: "#ffdb75", fontSize: 22, letterSpacing: 10, animation: "wlTwinkle 2s infinite" }}>
        ✦ ✦ ✦
      </div>

      <div style={{ fontSize: 56, marginTop: 8, animation: "wlUp .6s both" }}>♛</div>

      <div
        style={{
          fontSize: 16,
          letterSpacing: 6,
          color: "#ffe887",
          fontWeight: 700,
          animation: "wlUp .6s .15s both",
        }}
      >
        WELCOME TO
      </div>

      <div
        style={{
          fontSize: "clamp(44px, 15vw, 76px)",
          fontWeight: 900,
          lineHeight: 1,
          color: "#fff2a2",
          margin: "8px 0 2px",
          animation: "wlUp .6s .3s both, wlGlow 2.4s 1s infinite",
        }}
      >
        TRIPLE TTT
      </div>

      <div
        style={{
          fontSize: "clamp(34px, 11vw, 56px)",
          fontWeight: 900,
          color: "#fff",
          letterSpacing: 8,
          textShadow: "0 0 18px #00aaff",
          animation: "wlUp .6s .45s both",
        }}
      >
        LUDO
      </div>

      <div style={{ fontSize: 54, margin: "14px 0 6px", animation: "wlBob 1.8s ease-in-out infinite" }}>
        🎲
      </div>

      <div style={{ display: "flex", gap: 18, margin: "10px 0 8px", animation: "wlUp .6s .6s both" }}>
        {badges.map((b) => (
          <div key={b.name} style={{ textAlign: "center" }}>
            <div
              style={{
                width: 62,
                height: 62,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                fontSize: 32,
                fontWeight: 900,
                background: "radial-gradient(circle at 32% 25%, #fff, " + b.ring + ")",
                color: "#16245d",
                border: "3px solid #fff",
                boxShadow: "0 0 18px " + b.glow + ", 0 5px 6px rgba(0,0,0,.5)",
              }}
            >
              T
            </div>
            <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: "#ffe887" }}>
              {b.name}
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 15, opacity: 0.9, margin: "8px 0 22px", animation: "wlUp .6s .75s both" }}>
        Inspired by Truth, Tamasha &amp; Tereza
      </div>

      <button
        onClick={onDone}
        style={{
          padding: "14px 44px",
          fontSize: 22,
          borderRadius: 16,
          border: "none",
          background: "linear-gradient(180deg,#ffd54a,#f5a623)",
          color: "#5a2a00",
          fontWeight: 900,
          cursor: "pointer",
          boxShadow: "0 5px 0 #b36b00",
          animation: "wlUp .6s .9s both",
        }}
      >
        Let's Play 🎲
      </button>
    </div>
  );
          }
