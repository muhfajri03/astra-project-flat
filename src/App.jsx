import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { AppCtx } from "./app-context.js";
import { loadState, saveState, resetState } from "./lib/store.js";
import { BADGES } from "./lib/progress.js";
import { Backdrop, Celebration } from "./components/ui.jsx";
import TabBar from "./components/TabBar.jsx";
import Onboarding from "./screens/Onboarding.jsx";
import Home from "./screens/Home.jsx";
import Hub from "./screens/Hub.jsx";
import ModuleScreen from "./screens/ModuleScreen.jsx";
import Practice from "./screens/Practice.jsx";
import ListenEcho from "./screens/ListenEcho.jsx";
import ToneMaster from "./screens/ToneMaster.jsx";
import Profile from "./screens/Profile.jsx";
import Privacy from "./screens/Privacy.jsx";

const TABS = ["home", "hub", "practice", "profile"];
const BADGE_NAMES = Object.fromEntries(BADGES.map((b) => [b.id, b.name]));

export default function App() {
  const [state, setState] = useState(null);
  const [stack, setStack] = useState([{ name: "home" }]);
  const [celebrate, setCelebrate] = useState(null);
  const ref = useRef(null);
  const celRef = useRef({ badges: [], challenge: false, timer: null });

  useEffect(() => {
    loadState().then((s) => {
      ref.current = s;
      setState(s);
    });
  }, []);

  // Semua perubahan state lewat act(): fn menerima state bersih dan mengembalikan state baru.
  const act = useCallback((fn) => {
    const { newBadges, challengeJustDone, ...base } = ref.current;
    const next = fn(base);
    ref.current = next;
    setState(next);
    saveState(next);
    if (next.newBadges?.length || next.challengeJustDone) {
      // Gabungkan perayaan yang berdekatan jadi satu overlay, dan beri jeda
      // agar hasil latihan terlihat dulu.
      const c = celRef.current;
      c.badges = [...new Set([...c.badges, ...(next.newBadges || [])])];
      c.challenge = c.challenge || !!next.challengeJustDone;
      clearTimeout(c.timer);
      c.timer = setTimeout(() => {
        const { badges, challenge } = c;
        c.badges = [];
        c.challenge = false;
        c.timer = null;
        setCelebrate((prev) =>
          prev
            ? { badges: [...new Set([...prev.badges, ...badges])], challenge: prev.challenge || challenge }
            : { badges, challenge }
        );
      }, 1400);
    }
    return next;
  }, []);

  const go = useCallback((name, params = {}) => {
    window.scrollTo(0, 0);
    setStack((s) => (TABS.includes(name) ? [{ name, params }] : [...s, { name, params }]));
  }, []);

  const replace = useCallback((name, params = {}) => {
    window.scrollTo(0, 0);
    setStack((s) => [...s.slice(0, -1), { name, params }]);
  }, []);

  const back = useCallback(() => {
    window.scrollTo(0, 0);
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : [{ name: "home" }]));
  }, []);

  // Tombol kembali Android: mundur satu layar, keluar aplikasi hanya dari Home.
  const depth = useRef(1);
  depth.current = stack.length;
  const onHome = useRef(true);
  onHome.current = stack.length === 1 && stack[0].name === "home";
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let handle;
    CapApp.addListener("backButton", () => {
      if (depth.current > 1 || !onHome.current) back();
      else CapApp.exitApp();
    }).then((h) => {
      handle = h;
    });
    return () => handle?.remove();
  }, [back]);

  const reset = useCallback(async () => {
    const fresh = await resetState();
    ref.current = fresh;
    setState(fresh);
    setStack([{ name: "home" }]);
  }, []);

  if (!state) {
    return (
      <>
        <Backdrop />
        <div className="grid h-full place-items-center">
          <div className="animate-pop grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-emerald-astra to-emerald-forest text-3xl text-mint shadow-glow">
            ✦
          </div>
        </div>
      </>
    );
  }

  const route = stack[stack.length - 1];
  const ctx = { state, act, go, back, replace, reset };
  const showTabs = TABS.includes(route.name);

  let screen;
  if (!state.onboarded) screen = <Onboarding />;
  else {
    switch (route.name) {
      case "hub":
        screen = <Hub />;
        break;
      case "module":
        screen = <ModuleScreen {...route.params} />;
        break;
      case "practice":
        screen = <Practice />;
        break;
      case "listen":
        screen = <ListenEcho key={route.params.phrase.id + (route.params.i ?? 0)} {...route.params} />;
        break;
      case "tone":
        screen = <ToneMaster />;
        break;
      case "profile":
        screen = <Profile />;
        break;
      case "privacy":
        screen = <Privacy />;
        break;
      default:
        screen = <Home />;
    }
  }

  return (
    <AppCtx.Provider value={ctx}>
      <Backdrop />
      <main className="mx-auto min-h-full max-w-md" style={{ paddingBottom: showTabs && state.onboarded ? "calc(var(--sab) + 96px)" : "var(--sab)" }}>
        <div key={route.name + (route.params?.moduleId || "")} className="screen">
          {screen}
        </div>
      </main>
      {showTabs && state.onboarded && <TabBar active={route.name} onChange={(n) => go(n)} />}
      {celebrate && <Celebration {...celebrate} names={BADGE_NAMES} onDone={() => setCelebrate(null)} />}
    </AppCtx.Provider>
  );
}
