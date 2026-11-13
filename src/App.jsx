import React, { useEffect, useState } from 'react';
import {
  Home as HomeIcon, Ticket, Heart, Users, ShieldCheck, MessageCircle, Nfc, ShoppingBag, Radar, Menu, Sparkles, Palette,
  RotateCcw, LogOut, Megaphone, Smartphone, FlaskConical, BellRing,
} from 'lucide-react';
import { useCompanionStore, useSessionStore, useKeepStore, useSafetyStore, toast, THEME_OPTIONS, DEMO_MODE } from './store.js';
import { Btn, Seg, Modal, Toasts, Confetti, ErrorBoundary, cx, useCountdown, fixtureData } from './ui.jsx';
import DemoPanel from './screens/Demo.jsx';
import { LedgerList } from './screens/Companion.jsx';
import Onboarding from './screens/Onboarding.jsx';
import Home from './screens/Home.jsx';
import EventScreen from './screens/Event.jsx';
import Companion from './screens/Companion.jsx';
import Match from './screens/Match.jsx';
import Safety from './screens/Safety.jsx';
import { Channels, Ring, Shop } from './screens/More.jsx';
import { Listening } from './screens/Ops.jsx';

const WORKSPACES = {
  fan: {
    label: 'Fan app', icon: Smartphone,
    nav: [
      { id: 'home', label: 'Home', icon: HomeIcon, el: Home },
      { id: 'event', label: 'Event', icon: Ticket, el: EventScreen },
      { id: 'companion', label: 'Companion', icon: Heart, el: Companion },
      { id: 'match', label: 'Match', icon: Users, el: Match },
      { id: 'safety', label: 'Safety', icon: ShieldCheck, el: Safety },
    ],
    more: [
      { id: 'channels', label: 'Messaging', icon: MessageCircle, el: Channels },
      { id: 'ring', label: 'Ring and badge', icon: Nfc, el: Ring },
      { id: 'store', label: 'Store', icon: ShoppingBag, el: Shop },
    ],
  },
  ops: {
    label: 'Marketing ops', icon: Megaphone,
    nav: [{ id: 'listening', label: 'Social listening', icon: Radar, el: Listening }],
    more: [],
  },
};

/* AppLayout: top bar, side rail on desktop, BottomNav on phones. */
function AppLayout({ workspace, view, onNav, onMenu, onLedger, children }) {
  const ws = WORKSPACES[workspace];
  const theme = useCompanionStore((s) => s.theme);
  const setTheme = useCompanionStore((s) => s.setTheme);
  const toggleTheme = useCompanionStore((s) => s.toggleTheme);
  const starDust = useCompanionStore((s) => s.starDust);
  const pending = useSafetyStore((s) => s.pending);
  return (
    <div className={cx('shell', pending && 'has-alert')}>
      <header className="topbar">
        <div className="brand"><span className="brand-dot" aria-hidden="true" />Detox</div>
        {workspace !== 'fan' && <span className="chip accent">{ws.label}</span>}
        <div className="spacer" />
        {workspace === 'fan' && (
          <button type="button" className="chip sun num" aria-label={`Star Dust: ${starDust}. Open ledger`} onClick={onLedger}><Sparkles size={13} aria-hidden="true" />{starDust}</button>
        )}
        <span className="only-desktop"><Seg label="Visual style" value={theme} onChange={setTheme} options={THEME_OPTIONS} /></span>
        <Btn className="only-mobile" icon={Palette} aria-label={`Switch to ${theme === 'anime' ? 'Retro Arcade' : 'Anime/Manga'} Mode`} onClick={toggleTheme} />
        <Btn icon={Menu} aria-label="Open menu" onClick={onMenu} />
      </header>
      {pending && <SafetyAlertBar onOpen={() => onNav('safety', null, 'fan')} />}
      <nav className="rail" aria-label="Sections">
        <div className="rail-label">{ws.label}</div>
        {[...ws.nav, ...ws.more].map((n) => (
          <button key={n.id} type="button" aria-current={view === n.id ? 'page' : undefined} onClick={() => onNav(n.id)}>
            <n.icon size={17} aria-hidden="true" />{n.label}
          </button>
        ))}
        <div className="rail-label">Switch workspace</div>
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
  const { user, ticketId, resetSession } = useSessionStore();
  const [workspace, setWorkspace] = useState('fan');
  const [view, setView] = useState('home');
  const [params, setParams] = useState({});
  const [menu, setMenu] = useState(false);
  const [ledger, setLedger] = useState(false);
  const [demo, setDemo] = useState(false);

  useEffect(() => { document.documentElement.dataset.mode = theme; }, [theme]);

  const go = (id, p, ws) => {
    const nextWs = ws || workspace;
    if (ws) setWorkspace(ws);
    setView(id || WORKSPACES[nextWs].nav[0].id);
    setParams(p || {});
    setMenu(false);
    const main = document.getElementById('main');
    if (main) main.scrollTop = 0;
  };

  const onboarded = user && ticketId;
  const ws = WORKSPACES[workspace];
  const current = [...ws.nav, ...ws.more].find((n) => n.id === view) || ws.nav[0];
  const Screen = current.el;

  return (
    <>
      {!onboarded ? (
        <ErrorBoundary><Onboarding /></ErrorBoundary>
      ) : (
        <AppLayout workspace={workspace} view={current.id} onNav={go} onMenu={() => setMenu(true)} onLedger={() => setLedger(true)}>
          <ErrorBoundary resetKey={workspace + current.id}>
            <Screen key={workspace + current.id} go={go} params={params} />
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
              <span className="small strong">More in the fan app</span>
              <div className="row wrap">
                {ws.more.map((n) => <Btn key={n.id} icon={n.icon} onClick={() => go(n.id)}>{n.label}</Btn>)}
              </div>
            </div>
          )}
          <div className="stack tight">
            <span className="small strong">Workspace</span>
            <div className="row wrap">
              {Object.entries(WORKSPACES).map(([k, w]) => (
                <Btn key={k} icon={w.icon} variant={k === workspace ? 'primary' : undefined} onClick={() => go(null, null, k)}>{w.label}</Btn>
              ))}
            </div>
          </div>
          <div className="stack tight">
            <span className="small strong">Signed in as {user?.name} with {user?.provider}</span>
            <div className="row wrap">
              <Btn icon={RotateCcw} onClick={() => { resetCompanion(); toast('Companion progress reset'); setMenu(false); }}>Reset companion progress</Btn>
              <Btn icon={LogOut} variant="danger" onClick={() => { resetSession(); resetCompanion(); useKeepStore.getState().clear(); useSafetyStore.getState().reset(); setWorkspace('fan'); setView('home'); setMenu(false); }}>Sign out and restart</Btn>
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
          <div><Btn onClick={() => { setLedger(false); go('companion', { tab: 'pet' }); }}>Spend Star Dust on food</Btn></div>
        </Modal>
      )}
      {demo && <DemoPanel onClose={() => setDemo(false)} go={go} />}
      <Toasts />
      <Confetti />
      <div className="scanlines" aria-hidden="true" />
    </>
  );
}
