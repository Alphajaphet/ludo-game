import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import { sfx } from "./sound.js";

export const AD_REWARD = 8;
const AD_SECONDS = 5;

const AD_SRC = "https://bauval.org/21/6f33d0e10f55a9bc999e1d79fd9fe510";
const AD_CONTAINER_ID = "container-6f33d0e10f55a9bc999e1d79fd9fe510";

// While Adsterra is still reviewing the site, no ad can show.
// true  = still give diamonds when no ad appears (testing)
// false = give diamonds only when a real ad appeared (use after approval)
const ALLOW_WITHOUT_AD = true;

export function AdModal({ open, onClose, onReward }) {
  const [phase, setPhase] = useState("starting");
  const [left, setLeft] = useState(AD_SECONDS);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);
  const [round, setRound] = useState(0);
  const adId = useRef(null);
  const holder = useRef(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPhase("starting");
    setErr("");
    setResult(null);
    setLeft(AD_SECONDS);
    supabase.rpc("start_ad").then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        setErr(error.message);
        setPhase("error");
        return;
      }
      adId.current = data.id;
      setPhase("loading");
    });
    return () => {
      cancelled = true;
    };
  }, [open, round]);

  useEffect(() => {
    if (!open || phase !== "loading") return;
    const h = holder.current;
    if (!h) return;
    const old = document.getElementById(AD_CONTAINER_ID);
    if (old) old.innerHTML = "";
    h.querySelectorAll("script").forEach((n) => n.remove());
    const s = document.createElement("script");
    s.async = true;
    s.setAttribute("data-cfasync", "false");
    s.src = AD_SRC;
    h.appendChild(s);

    let tries = 0;
    const poll = setInterval(() => {
      tries += 1;
      const c = document.getElementById(AD_CONTAINER_ID);
      const shown = c && (c.childElementCount > 0 || c.offsetHeight > 30);
      if (shown) {
        clearInterval(poll);
        setPhase("playing");
        return;
      }
      if (tries >= 16) {
        clearInterval(poll);
        if (ALLOW_WITHOUT_AD) {
          setPhase("playing");
        } else {
          setErr("No ad is available right now. Please try again in a minute.");
          setPhase("error");
        }
      }
    }, 500);
    return () => clearInterval(poll);
  }, [open, phase]);

  useEffect(() => {
    if (!open || phase !== "playing") return;
    let s = AD_SECONDS;
    setLeft(s);
    const t = setInterval(() => {
      s -= 1;
      setLeft(s);
      if (s <= 0) {
        clearInterval(t);
        setPhase("ready");
      }
    }, 1000);
    return () => clearInterval(t);
  }, [open, phase]);

  const collect = async () => {
    setPhase("claiming");
    const { data, error } = await supabase.rpc("claim_ad", { p_id: adId.current });
    if (!alive.current) return;
    if (error) {
      setErr(error.message);
      setPhase("error");
      return;
    }
    sfx("home");
    setResult(data);
    setPhase("done");
    if (onReward) onReward(data.diamonds);
  };

  if (!open) return null;

  const showSlot = ["loading", "playing", "ready", "claiming"].includes(phase);

  const btn = {
    padding: "12px 30px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(180deg,#ffd54a,#f5a623)",
    color: "#5a2a00",
    fontWeight: 900,
    fontSize: 18,
    cursor: "pointer",
    boxShadow: "0 4px 0 #b36b00",
    margin: "6px 0",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,7,43,.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 150,
        fontFamily: "system-ui, Arial, sans-serif",
        color: "#fff",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "min(92vw, 360px)",
          background: "linear-gradient(145deg,#15245d,#050b2d)",
          border: "2px solid #ffcf54",
          borderRadius: 22,
          padding: 18,
          textAlign: "center",
          boxShadow: "0 0 26px #148bff",
          margin: "12px 0",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 8,
            right: 10,
            background: "transparent",
            border: "none",
            color: "#cfd8ff",
            fontSize: 22,
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        <h3 style={{ margin: "0 0 12px", color: "#ffdb75", textShadow: "0 0 12px orange" }}>
          💎 Free diamonds
        </h3>

        {phase === "starting" && <p>Loading...</p>}

        {showSlot && (
          <>
            <div
              ref={holder}
              style={{
                minHeight: 250,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "rgba(255,255,255,.07)",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <div id={AD_CONTAINER_ID} />
            </div>

            {phase === "loading" && <p style={{ margin: "12px 0 0" }}>Loading ad...</p>}

            {phase === "playing" && (
              <>
                <div
                  style={{
                    height: 8,
                    borderRadius: 6,
                    background: "rgba(255,255,255,.2)",
                    overflow: "hidden",
                    margin: "12px 0 6px",
                  }}
                >
                  <div
                    style={{
                      width: ((AD_SECONDS - left) / AD_SECONDS) * 100 + "%",
                      height: "100%",
                      background: "#ffd54a",
                      transition: "width 1s linear",
                    }}
                  />
                </div>
                <p style={{ margin: 0, opacity: 0.9 }}>Ad ends in {left}s</p>
              </>
            )}

            {phase === "ready" && (
              <button style={{ ...btn, marginTop: 14 }} onClick={collect}>
                Collect 💎 {AD_REWARD}
              </button>
            )}
            {phase === "claiming" && <p style={{ margin: "12px 0 0" }}>Collecting...</p>}
          </>
        )}

        {phase === "done" && result && (
          <>
            <div style={{ fontSize: 56, fontWeight: 900, color: "#7fe9ff" }}>
              +{result.reward} 💎
            </div>
            <p style={{ margin: "4px 0 10px" }}>You now have 💎 {result.diamonds}</p>
            <button style={btn} onClick={() => setRound((r) => r + 1)}>
              ▶ Watch another ad
            </button>
            <div>
              <button
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#cfd8ff",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                  marginTop: 4,
                }}
              >
                Done
              </button>
            </div>
          </>
        )}

        {phase === "error" && (
          <>
            <p style={{ color: "#ff9b9b" }}>{err}</p>
            <button style={btn} onClick={onClose}>
              OK
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function AdButton({ onReward, style }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => {
          sfx("tap");
          setOpen(true);
        }}
        style={{
          border: "2px solid #ffcf54",
          background: "linear-gradient(145deg,#4a1d96,#1e3a8a)",
          boxShadow: "0 0 14px #8a4dff",
          color: "#fff",
          borderRadius: 20,
          padding: "10px 18px",
          fontSize: 15,
          fontWeight: 800,
          cursor: "pointer",
          ...style,
        }}
      >
        ▶ Watch ad · +💎 {AD_REWARD}
      </button>
      <AdModal open={open} onClose={() => setOpen(false)} onReward={onReward} />
    </>
  );
    }
