import { useEffect, useState } from "react";

const loadedBuild = () => {
  const src = Array.from(document.scripts)
    .map((s) => s.src)
    .find((u) => /\/assets\/index-[^/]+\.js/.test(u));
  if (!src) return null;
  const m = src.match(/\/assets\/index-([^/]+)\.js/);
  return m ? m[1] : null;
};

export default function UpdateBanner() {
  const [fresh, setFresh] = useState(false);
  const me = loadedBuild();

  useEffect(() => {
    if (!me) return;
    let stop = false;

    const check = async () => {
      try {
        const res = await fetch("/", { cache: "no-store" });
        const html = await res.text();
        const m = html.match(/\/assets\/index-([^"'/]+)\.js/);
        if (!m || stop) return;
        if (m[1] !== me) {
          const done = sessionStorage.getItem("updatedTo");
          if (window.location.hash.startsWith("#room-") && done !== m[1]) {
            sessionStorage.setItem("updatedTo", m[1]);
            window.location.reload();
            return;
          }
          setFresh(true);
        }
      } catch (e) {}
    };

    const onVis = () => {
      if (!document.hidden) check();
    };

    const id = setInterval(check, 20000);
    document.addEventListener("visibilitychange", onVis);
    check();

    return () => {
      stop = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [me]);

  const inRoom = window.location.hash.startsWith("#room-");

  return (
    <>
      {fresh && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 200,
            display: "flex",
            justifyContent: "center",
            padding: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "linear-gradient(145deg,#15245d,#050b2d)",
              border: "2px solid #ffcf54",
              boxShadow: "0 0 16px #148bff",
              borderRadius: 18,
              padding: "8px 12px",
              color: "#fff",
              fontFamily: "system-ui, Arial, sans-serif",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            🔄 New version ready
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "8px 14px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(180deg,#ffd54a,#f5a623)",
                color: "#5a2a00",
                fontWeight: 900,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Update now
            </button>
          </div>
        </div>
      )}

      {me && inRoom && (
        <div
          style={{
            position: "fixed",
            bottom: 2,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 10,
            color: "#fff",
            opacity: 0.4,
            pointerEvents: "none",
            zIndex: 5,
          }}
        >
          build {me.slice(0, 6)}
        </div>
      )}
    </>
  );
      }
