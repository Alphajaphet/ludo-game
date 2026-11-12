import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import Home from "./Home.jsx";

const AVATARS = ["😀","😎","🤠","🦁","🐯","🦊","🐼","👑","🔥","⚡","🎯","🚀"];

const box = {
  minHeight: "100vh",
  background: "linear-gradient(180deg,#4b3fa3 0%,#3a3180 45%,#2d2766 100%)",
  color: "#fff",
  fontFamily: "system-ui, sans-serif",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  textAlign: "center",
};
const btn = {
  padding: "14px 28px",
  fontSize: 18,
  borderRadius: 14,
  border: "none",
  background: "linear-gradient(180deg,#ffd54a,#f5a623)",
  color: "#5a2a00",
  fontWeight: 800,
  cursor: "pointer",
  margin: 6,
  boxShadow: "0 4px 0 #b36b00",
};

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState("");

  const userId = session?.user?.id;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data);
        if (data) {
          setName(data.display_name || "");
          setAvatar(data.avatar || AVATARS[0]);
        }
        setLoading(false);
      });
  }, [userId]);

  const signIn = () =>
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });

  const signOut = () => supabase.auth.signOut();

  const saveProfile = async () => {
    setError("");
    const clean = name.trim();
    if (clean.length < 2) {
      setError("Name must be at least 2 letters");
      return;
    }
    const query = profile
      ? supabase
          .from("profiles")
          .update({ display_name: clean, avatar })
          .eq("id", userId)
      : supabase
          .from("profiles")
          .insert({ id: userId, display_name: clean, avatar });
    const { error: err } = await query;
    if (err) {
      setError(err.message);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    setProfile(data);
    setEditing(false);
  };

  if (loading) return <div style={box}>Loading...</div>;

  if (!session) {
    return (
      <div style={box}>
        <h1 style={{ fontSize: 52, margin: 0 }}>🎲 Ludo</h1>
        <p style={{ opacity: 0.8 }}>Play Ludo online with friends</p>
        <button style={btn} onClick={signIn}>
          Continue with Google
        </button>
      </div>
    );
  }

  if (!profile || editing) {
    return (
      <div style={box}>
        <h2>{profile ? "Edit profile" : "Create your profile"}</h2>
        <div style={{ fontSize: 64 }}>{avatar}</div>
        <div style={{ maxWidth: 320, margin: "12px 0" }}>
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => setAvatar(a)}
              style={{
                fontSize: 28,
                margin: 4,
                padding: 6,
                borderRadius: 10,
                border: a === avatar ? "2px solid #ffd54a" : "2px solid transparent",
                background: "rgba(0,0,0,.3)",
                cursor: "pointer",
              }}
            >
              {a}
            </button>
          ))}
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={16}
          placeholder="Your player name"
          style={{
            padding: 12,
            fontSize: 18,
            borderRadius: 10,
            border: "none",
            textAlign: "center",
            width: 240,
          }}
        />
        {error && <p style={{ color: "#ff9b9b" }}>{error}</p>}
        <button style={btn} onClick={saveProfile}>
          Save
        </button>
        {profile && (
          <button
            style={{ ...btn, background: "#555", color: "#fff", boxShadow: "none" }}
            onClick={() => setEditing(false)}
          >
            Cancel
          </button>
        )}
      </div>
    );
  }

  return (
    <Home
      profile={profile}
      onPlayLocal={() => {
        window.location.hash = "play";
      }}
      onEdit={() => setEditing(true)}
      onLogout={signOut}
    />
  );
                                                                }
