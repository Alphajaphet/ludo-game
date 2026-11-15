import { useEffect, useRef, useState } from "react";
import { getMode, cycleMode } from "./sound.js";

const ICON = { all: "🔊", sfx: "🔔", off: "🔇" };
const LABEL = {
  all: "Sound + music",
  sfx: "Sound effects only",
  off: "Muted",
};

export default function SoundButton({ size = 40 }) {
  const [mode, setMode] = useState(getMode());
  const [label, setLabel] = useState("");
  const timer = useRef(null);

  useEffect(() => {
    const h = () => setMode(getMode());
    window.addEventListener("ttt-sound", h);
    return () => {
      window.removeEventListener("ttt-sound", h);
      clearTimeout(timer.current);
    };
  }, []);

  const onClick = () => {
    const next = cycleMode();
    setLabel(LABEL[next]);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setLabel(""), 1600);
  };

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={onClick}
        aria-label={LABEL[mode]}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: "2px solid #ffcf54",
          background: "linear-gradient(145deg,#15245d,#050b2d)",
          boxShadow: "0 0 10px #148bff",
          fontSize: size * 0.5,
          color: "#fff",
          cursor: "pointer",
          padding: 0,
        }}
      >
        {ICON[mode]}
      </button>
      {label && (
        <div
          style={{
            position: "absolute",
            top: size + 6,
            right: 0,
            whiteSpace: "nowrap",
            background: "rgba(0,0,0,.85)",
            color: "#fff",
            borderRadius: 12,
            padding: "5px 10px",
            fontSize: 12,
            fontWeight: 700,
            zIndex: 90,
            fontFamily: "system-ui, Arial, sans-serif",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
