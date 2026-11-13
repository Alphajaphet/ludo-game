import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Game from "./Game.jsx";
import Lobby from "./Lobby.jsx";
import RoomPage from "./RoomPage.jsx";
import { supabase } from "./supabase";

function Root() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const isHome = !(hash === "#play" || hash === "#online" || hash.startsWith("#room-"));

  useEffect(() => {
    if (!isHome) return;
    const id = setInterval(async () => {
      const p = localStorage.getItem("pendingRoom");
      if (!p) return;
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      const { data: prof } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.session.user.id)
        .maybeSingle();
      if (prof) {
        localStorage.removeItem("pendingRoom");
        window.location.hash = "room-" + p;
      }
    }, 1500);
    return () => clearInterval(id);
  }, [isHome]);

  if (hash === "#play") return <Game />;
  if (hash === "#online") return <Lobby />;
  if (hash.startsWith("#room-")) {
    const code = hash.slice(6).toUpperCase();
    return <RoomPage key={code} code={code} />;
  }
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
