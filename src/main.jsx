import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Game from "./Game.jsx";
import Lobby from "./Lobby.jsx";
import RoomPage from "./RoomPage.jsx";
import Welcome from "./Welcome.jsx";
import InstallButton from "./InstallButton.jsx";
import UpdateBanner from "./UpdateBanner.jsx";
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

  let view;
  if (!welcomed) {
    view = <Welcome onDone={finish} />;
  } else if (hash === "#play") {
    view = <Game />;
  } else if (hash === "#online") {
    view = <Lobby />;
  } else if (hash.startsWith("#room-")) {
    const code = hash.slice(6).toUpperCase();
    view = <RoomPage key={code} code={code} />;
  } else {
    view = (
      <>
        <App />
        <InstallButton />
      </>
    );
  }

  return (
    <>
      {view}
      <UpdateBanner />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
