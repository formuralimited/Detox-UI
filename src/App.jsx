import React, { useEffect, useRef, useState } from 'react';
import {
  Home as HomeIcon, Ticket, Heart, Users, MessageCircle, Nfc, ShoppingBag, Radar, Menu, Sparkles, Palette, Gamepad2,
  Map as MapIcon, Grid3x3, RotateCcw, LogOut, Megaphone, Leaf, FlaskConical, BellRing,
} from 'lucide-react';
import { useCompanionStore, useSessionStore, useKeepStore, useSafetyStore, toast, THEME_OPTIONS, DEMO_MODE } from './store.js';
import { Btn, Seg, Modal, Toasts, Confetti, ErrorBoundary, cx, useCountdown, fixtureData } from './ui.jsx';
import DemoPanel from './screens/Demo.jsx';
import Onboarding from './screens/Onboarding.jsx';
import DetoxSetup from './screens/DetoxSetup.jsx';
import { FocusBar, InterceptModal } from './screens/Detox.jsx';
import { AssistantFab, AssistantPanel, useAssistant } from './screens/Assistant.jsx';
import DetoxHome, { EventHome } from './screens/Home.jsx';
import { PassPage, GamesPage, MapPage, RewardsPage } from './screens/Event.jsx';
import Health, { LedgerList } from './screens/Companion.jsx';
import Community from './screens/Match.jsx';
import { Channels, Ring, Shop } from './screens/More.jsx';
import { Listening } from './screens/Ops.jsx';

/* Three routes, each with its own navigation:
   Detox app (#home, #health, #community), Event Mode (#event...), Marketing ops (#ops). */
const WORKSPACES = {
  detox: {
    label: 'Detox app', icon: Leaf,
    nav: [
      { id: 'home', hash: 'home', label: 'Home', icon: HomeIcon, el: DetoxHome },
      { id: 'health', hash: 'health', label: 'Health', icon: Heart, el: Health },
      { id: 'community', hash: 'community', label: 'Community', icon: Users, el: Community },
    ],
    more: [],
  },
  event: {
    label: 'Event Mode', icon: Ticket,
    nav: [
      { id: 'event', hash: 'event', label: 'Event home', icon: HomeIcon, el: EventHome },
      { id: 'pass', hash: 'event-pass', label: 'Pass', icon: Ticket, el: PassPage },
      { id: 'games', hash: 'event-games', label: 'Games', icon: Gamepad2, el: GamesPage },
      { id: 'map', hash: 'event-map', label: 'Map', icon: MapIcon, el: MapPage },
      { id: 'rewards', hash: 'event-rewards', label: 'Collectibles', icon: Grid3x3, el: RewardsPage },
    ],
    more: [
      { id: 'channels', hash: 'event-messaging', label: 'Messaging', icon: MessageCircle, el: Channels },
      { id: 'ring', hash: 'event-ring', label: 'Ring and badge', icon: Nfc, el: Ring },
      { id: 'store', hash: 'event-store', label: 'Store', icon: ShoppingBag, el: Shop },
    ],
  },
  ops: {
    label: 'Marketing ops', icon: Megaphone,
    nav: [{ id: 'listening', hash: 'ops', label: 'Social listening', icon: Radar, el: Listening }],
    more: [],
  },
};
const ROUTES = Object.entries(WORKSPACES).flatMap(([ws, w]) => [...w.nav, ...w.more].map((r) => ({ ...r, ws })));
const routeById = (id) => ROUTES.find((r) => r.id === id) || ROUTES[0];
const routeFromHash = () => {
  let h = '';
  try { h = window.location.hash.replace(/^#/, ''); } catch { h = ''; }
  return ROUTES.find((r) => r.hash === h) || ROUTES[0];
};

/* AppLayout: top bar, side rail on desktop, BottomNav on phones. */
function AppLayout({ workspace, view, onNav, onMenu, onLedger, children }) {
  const ws = WORKSPACES[workspace];
  const theme = useCompanionStore((s) => s.theme);
  const setTheme = useCompanionStore((s) => s.setTheme);
  const toggleTheme = useCompanionStore((s) => s.toggleTheme);
  const starDust = useCompanionStore((s) => s.starDust);
  const pending = useSafetyStore((s) => s.pending);
  const focusing = useCompanionStore((s) => !!s.focusEndsAt);
  return (
    <div className={cx('shell', (pending || focusing) && 'has-alert')}>
      <header className="topbar">
        <div className="brand"><span className="brand-dot" aria-hidden="true" />Detox</div>
        {workspace !== 'detox' && <span className="chip accent">{ws.label}</span>}
        <div className="spacer" />
        {workspace !== 'ops' && (
          <button type="button" className="chip sun num" aria-label={`Star Dust: ${starDust}. Open ledger`} onClick={onLedger}><Sparkles size={13} aria-hidden="true" />{starDust}</button>
        )}
        <span className="only-desktop"><Seg label="Visual style" value={theme} onChange={setTheme} options={THEME_OPTIONS} /></span>
        <Btn className="only-mobile" icon={Palette} aria-label={`Switch to ${theme === 'anime' ? 'Retro Arcade' : 'Anime/Manga'} Mode`} onClick={toggleTheme} />
        <Btn icon={Menu} aria-label="Open menu" onClick={onMenu} />
      </header>
      {(pending || focusing) && (
        <div className="bars">
          {pending && <SafetyAlertBar onOpen={() => onNav('health', { tab: 'safety' })} />}
          <FocusBar />
        </div>
      )}
      <nav className="rail" aria-label="Sections">
        <div className="rail-label">{ws.label}</div>
        {[...ws.nav, ...ws.more].map((n) => (
          <button key={n.id} type="button" aria-current={view === n.id ? 'page' : undefined} onClick={() => onNav(n.id)}>
            <n.icon size={17} aria-hidden="true" />{n.label}
          </button>
        ))}
        <div className="rail-label">Switch to</div>
        {Object.entries(WORKSPACES).filter(([k]) => k !== workspace).map(([k, w]) => (
          <button key={k} type="button" onClick={() => onNav(null, null, k)}><w.icon size={17} aria-hidden="true" />{w.label}</button>
        ))}
      </nav>
      <main className="main" id="main">{children}</main>
      {ws.nav.length > 1 && <BottomNav items={ws.nav} view={view} onNav={onNav} />}
    </div>
  );
}

/* Pinned on every screen while an automatic safety alert counts down. */
function SafetyAlertBar({ onOpen }) {
  const { pending, cancel, dispatch } = useSafetyStore();
  const send = async () => {
    const contacts = await fixtureData('trusted');
    const who = contacts.filter((c) => c.status).map((c) => `${c.name} (${c.via})`).join(', ') || 'nobody, because no contact has safety status sharing on';
    dispatch(who);
    toast('Alert sent to your trusted contacts', 'bad');
  };
  const [left] = useCountdown(10, !!pending, send);
  return (
    <div className="alert-bar" role="alert">
      <BellRing size={18} aria-hidden="true" />
      <span className="grow">{pending.reason}. Alerting your trusted contacts in <b className="num">{left} s</b>.</span>
      <Btn size="sm" onClick={() => { cancel(); toast('Alert cancelled. Status set to safe.', 'good'); }}>I am OK, cancel</Btn>
      <Btn size="sm" variant="ghost" onClick={onOpen}>Open Safety</Btn>
    </div>
  );
}

function BottomNav({ items, view, onNav }) {
  return (
    <nav className="bottomnav" aria-label="Main">
      {items.map((n) => (
        <button key={n.id} type="button" aria-current={view === n.id ? 'page' : undefined} onClick={() => onNav(n.id)}>
          <n.icon size={20} aria-hidden="true" /><span>{n.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default function App() {
  const theme = useCompanionStore((s) => s.theme);
  const setTheme = useCompanionStore((s) => s.setTheme);
  const resetCompanion = useCompanionStore((s) => s.resetCompanion);
  const { user, ticketId, detox, resetSession } = useSessionStore();
  const [route, setRoute] = useState(routeFromHash);
  const [params, setParams] = useState({});
  const [menu, setMenu] = useState(false);
  const [ledger, setLedger] = useState(false);
  const [demo, setDemo] = useState(false);
  const current = useRef(route.id);

  useEffect(() => { document.documentElement.dataset.mode = theme; }, [theme]);

  /* Back, forward and pasted links: follow the hash. */
  useEffect(() => {
    const onHash = () => {
      const r = routeFromHash();
      if (r.id === current.current) return;
      current.current = r.id;
      setRoute(r);
      setParams({});
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (id, p, ws) => {
    const r = id ? routeById(id) : { ...WORKSPACES[ws].nav[0], ws };
    current.current = r.id;
    setRoute(r);
    setParams(p || {});
    setMenu(false);
    try { if (window.location.hash !== '#' + r.hash) window.location.hash = r.hash; } catch { /* hash not available */ }
    const main = document.getElementById('main');
    if (main) main.scrollTop = 0;
  };

  const workspace = route.ws;
  const ws = WORKSPACES[workspace];
  const ready = workspace === 'event' ? user && ticketId : !!user;
  const needsSetup = ready && workspace === 'detox' && !detox;
  const Screen = route.el;

  return (
    <>
      {!ready ? (
        <ErrorBoundary><Onboarding mode={workspace === 'event' ? 'event' : 'detox'} /></ErrorBoundary>
      ) : needsSetup ? (
        <ErrorBoundary><DetoxSetup /></ErrorBoundary>
      ) : (
        <AppLayout workspace={workspace} view={route.id} onNav={go} onMenu={() => setMenu(true)} onLedger={() => setLedger(true)}>
          <ErrorBoundary resetKey={route.id}>
            <Screen key={route.id} go={go} params={params} />
          </ErrorBoundary>
        </AppLayout>
      )}
      {menu && (
        <Modal title="Menu" onClose={() => setMenu(false)}>
          <div className="stack tight">
            <span className="small strong">Visual style</span>
            <Seg label="Visual style" value={theme} onChange={setTheme} options={THEME_OPTIONS} />
          </div>
          {ws.more.length > 0 && (
            <div className="stack tight">
              <span className="small strong">More in {ws.label}</span>
              <div className="row wrap">
                {ws.more.map((n) => <Btn key={n.id} icon={n.icon} onClick={() => go(n.id)}>{n.label}</Btn>)}
              </div>
            </div>
          )}
          <div className="stack tight">
            <span className="small strong">Switch to</span>
            <div className="row wrap">
              {Object.entries(WORKSPACES).map(([k, w]) => (
                <Btn key={k} icon={w.icon} variant={k === workspace ? 'primary' : undefined} onClick={() => go(null, null, k)}>{w.label}</Btn>
              ))}
            </div>
          </div>
          <div className="stack tight">
            <span className="small strong">{user ? `Signed in as ${user.name} with ${user.provider}` : 'Not signed in'}</span>
            <div className="row wrap">
              <Btn icon={RotateCcw} onClick={() => { resetCompanion(); toast('Companion progress reset'); setMenu(false); }}>Reset companion progress</Btn>
              <Btn icon={LogOut} variant="danger" onClick={() => { resetSession(); resetCompanion(); useKeepStore.getState().clear(); useSafetyStore.getState().reset(); useAssistant.getState().clearAll(); setMenu(false); }}>Sign out and restart</Btn>
            </div>
          </div>
          {DEMO_MODE && (
            <div className="stack tight">
              <span className="small strong">Prototype</span>
              <div><Btn icon={FlaskConical} onClick={() => { setMenu(false); setDemo(true); }}>Demo controls</Btn></div>
            </div>
          )}
        </Modal>
      )}
      {ledger && (
        <Modal title="Star Dust ledger" onClose={() => setLedger(false)}>
          <LedgerList limit={20} />
          <div><Btn onClick={() => { setLedger(false); go('health', { tab: 'pet' }); }}>Spend Star Dust on food</Btn></div>
        </Modal>
      )}
      {demo && <DemoPanel onClose={() => setDemo(false)} go={go} />}
      {ready && <InterceptModal go={go} />}
      {ready && !needsSetup && workspace === 'detox' && <><AssistantFab /><AssistantPanel /></>}
      <Toasts />
      <Confetti />
      <div className="scanlines" aria-hidden="true" />
    </>
  );
}
