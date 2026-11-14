import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Game from "./Game.jsx";
import Lobby from "./Lobby.jsx";
import RoomPage from "./RoomPage.jsx";
import Welcome from "./Welcome.jsx";
import InstallButton from "./InstallButton.jsx";
import { supabase } from "./supabase";

window.__installEvt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.__installEvt = e;
  window.dispatchEvent(new Event("installready"));
});

function Root() {
  const [hash, setHash] = useState(window.location.hash);
  const [welcomed, setWelcomed] = useState(() => {
    try {
      return sessionStorage.getItem("welcomed") === "1";
    } catch (e) {
      return false;
    }
  });

  const finish = () => {
    try {
      sessionStorage.setItem("welcomed", "1");
    } catch (e) {}
    setWelcomed(true);
  };

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

  if (!welcomed) return <Welcome onDone={finish} />;

  if (hash === "#play") return <Game />;
  if (hash === "#online") return <Lobby />;
  if (hash.startsWith("#room-")) {
    const code = hash.slice(6).toUpperCase();
    return <RoomPage key={code} code={code} />;
  }
  return (
    <>
      <App />
      <InstallButton />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
