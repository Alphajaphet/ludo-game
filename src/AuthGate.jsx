import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { page, yellowBtn } from "./ludoData.js";

export default function AuthGate({ pending, children }) {
  const [st, setSt] = useState({ loading: true, session: null, profile: null });

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      const s = data.session;
      if (!s) {
        if (alive) setSt({ loading: false, session: null, profile: null });
        return;
      }
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", s.user.id)
        .maybeSingle();
      if (alive) setSt({ loading: false, session: s, profile: p });
    });
    return () => {
      alive = false;
    };
  }, []);

  const remember = () => {
    if (pending) localStorage.setItem("pendingRoom", pending);
  };

  if (st.loading) {
    return <div style={{ ...page, justifyContent: "center" }}>Loading...</div>;
  }

  if (!st.session) {
    return (
      <div style={{ ...page, justifyContent: "center" }}>
        <h1 style={{ fontSize: 48, margin: 0 }}>🎲 Ludo</h1>
        <p style={{ opacity: 0.8 }}>Log in to play online</p>
        <button
          style={yellowBtn}
          onClick={() => {
            remember();
            supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: window.location.origin },
            });
          }}
        >
          Continue with Google
        </button>
      </div>
    );
  }

  if (!st.profile) {
    return (
      <div style={{ ...page, justifyContent: "center" }}>
        <h2>Create your profile first</h2>
        <button
          style={yellowBtn}
          onClick={() => {
            remember();
            window.location.hash = "";
          }}
        >
          Create profile
        </button>
      </div>
    );
  }

  return children(st.session, st.profile);
                          }
