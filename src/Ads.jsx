import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import { sfx } from "./sound.js";

export const AD_REWARD = 8;
const AD_SECONDS = 5;

export function AdModal({ open, onClose, onReward }) {
  const [phase, setPhase] = useState("loading");
  const [left, setLeft] = useState(AD_SECONDS);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);
  const [round, setRound] = useState(0);
  const adId = useRef(null);
  const timer = useRef(null);
  const alive = useRef(true);
  const real = typeof window !== "undefined" && typeof window.showRewardedAd === "function";

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      clearInterval(timer.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    clearInterval(timer.current);
    setPhase("loading");
    setErr("");
    setResult(null);
    setLeft(AD_SECONDS);

    (async () => {
      const { data, error } = await supabase.rpc("start_ad");
      if (cancelled) return;
      if (error) {
        setErr(error.message);
        setPhase("error");
        return;
      }
      adId.current = data.id;
      setPhase("playing");

      if (real) {
        try {
          const ok = await window.showRewardedAd();
          if (cancelled) return;
          if (ok) setPhase("ready");
          else {
            setErr("The ad was not completed, so there is no reward.");
            setPhase("error");
          }
        } catch (e) {
          if (!cancelled) {
            setErr("No ad is available right now. Try again later.");
            setPhase("error");
          }
        }
        return;
      }

      let s = AD_SECONDS;
      setLeft(s);
      timer.current = setInterval(() => {
        s -= 1;
        setLeft(s);
        if (s <= 0) {
          clearInterval(timer.current);
          setPhase("ready");
        }
      }, 1000);
    })();

    return () => {
      cancelled = true;
      clearInterval(timer.current);
    };
  }, [open, round]);

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
      }}
    >
      <div
        style={{
          position: "relative",
          width: "min(90vw, 360px)",
          background: "linear-gradient(145deg,#15245d,#050b2d)",
          border: "2px solid #ffcf54",
          borderRadius: 22,
          padding: 20,
          textAlign: "center",
          boxShadow: "0 0 26px #148bff",
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

        {phase === "loading" && <p>Loading ad...</p>}

        {(phase === "playing" || phase === "ready" || phase === "claiming") && (
          <>
            <div
              style={{
                height: 150,
                borderRadius: 16,
                background: "linear-gradient(135deg,#3b2a8c,#0b1d63)",
                border: "2px dashed rgba(255,255,255,.35)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <div style={{ fontSize: 44 }}>📺</div>
              <div style={{ fontWeight: 800 }}>Ad space</div>
              {!real && (
                <div style={{ fontSize: 12, opacity: 0.8 }}>Real ads are coming soon</div>
              )}
            </div>

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
                      width: real ? "100%" : ((AD_SECONDS - left) / AD_SECONDS) * 100 + "%",
                      height: "100%",
                      background: "#ffd54a",
                      transition: "width 1s linear",
                    }}
                  />
                </div>
                <p style={{ margin: 0, opacity: 0.9 }}>
                  {real ? "Watching ad..." : "Ad ends in " + left + "s"}
                </p>
              </>
            )}

            {phase === "ready" && (
              <button style={{ ...btn, marginTop: 14 }} onClick={collect}>
                Collect 💎 {AD_REWARD}
              </button>
            )}
            {phase === "claiming" && <p>Collecting...</p>}
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
