import { useEffect, useState } from "react";

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

export default function InstallButton() {
  const [evt, setEvt] = useState(window.__installEvt || null);
  const [help, setHelp] = useState(false);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const ready = () => setEvt(window.__installEvt || null);
    const done = () => {
      setInstalled(true);
      setEvt(null);
    };
    window.addEventListener("installready", ready);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("installready", ready);
      window.removeEventListener("appinstalled", done);
    };
  }, []);

  if (installed) return null;
  const ios = isIos();
  if (!evt && !ios) return null;

  const install = async () => {
    if (evt) {
      evt.prompt();
      try {
        await evt.userChoice;
      } catch (e) {}
      window.__installEvt = null;
      setEvt(null);
    } else {
      setHelp(true);
    }
  };

  return (
    <>
      <button
        onClick={install}
        style={{
          position: "fixed",
          right: 12,
          bottom: 92,
          zIndex: 60,
          border: "2px solid #ffcf54",
          background: "linear-gradient(145deg,#15245d,#050b2d)",
          boxShadow: "0 0 14px #148bff",
          color: "#fff",
          borderRadius: 20,
          padding: "10px 16px",
          fontSize: 15,
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        📲 Install app
      </button>

      {help && (
        <div
          onClick={() => setHelp(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2,7,43,.88)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 70,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(88vw, 340px)",
              background: "linear-gradient(145deg,#15245d,#050b2d)",
              border: "2px solid #ffcf54",
              borderRadius: 22,
              padding: 22,
              textAlign: "center",
              color: "#fff",
              fontFamily: "system-ui, Arial, sans-serif",
            }}
          >
            <div style={{ fontSize: 44 }}>📲</div>
            <h3 style={{ color: "#ffdb75", margin: "6px 0 12px" }}>Install on iPhone</h3>
            <p style={{ margin: "6px 0" }}>1. Tap the Share button in Safari</p>
            <p style={{ margin: "6px 0" }}>2. Tap "Add to Home Screen"</p>
            <p style={{ margin: "6px 0" }}>3. Tap "Add"</p>
            <button
              onClick={() => setHelp(false)}
              style={{
                marginTop: 14,
                padding: "10px 30px",
                borderRadius: 14,
                border: "none",
                background: "linear-gradient(180deg,#ffd54a,#f5a623)",
                color: "#5a2a00",
                fontWeight: 800,
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
        }
