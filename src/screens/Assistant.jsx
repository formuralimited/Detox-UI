import React, { useEffect, useRef } from 'react';
import { create } from 'zustand';
import { RotateCcw, Square, X } from 'lucide-react';
import { useCompanionStore, useSessionStore, planTarget, fmtMin, toast } from '../store.js';
import { GOALS } from '../fixtures.js';
import { askAssistant, assistantMode, offlineReply, STYLES } from '../assistant.js';
import { Btn, Chat, InlineError, Seg, Sprite } from '../ui.jsx';

const GREETING = { id: 'hello', from: 'bot', text: 'Hi. I am your Detox assistant. Tell me what is pulling you to your phone, or ask how to cut your screen time today.' };
export const STARTERS = ['I keep wanting to scroll', 'Help me focus for the next hour', 'What should I do instead of my phone tonight?'];
const MODE_LABEL = { ai: 'AI replies', backend: 'AI replies', offline: 'Offline replies' };

/* Everything the assistant may know about today. Built fresh on each message. */
function detoxContext() {
  const c = useCompanionStore.getState();
  const s = useSessionStore.getState();
  const d = s.detox;
  return {
    name: s.user ? s.user.name.split(' ')[0] : 'there',
    time_now: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    detox_day: c.detoxDays,
    screen_time_today: fmtMin(c.screenMin),
    screen_time_target_this_week: fmtMin(planTarget(d)),
    starting_average: d ? fmtMin(d.baselineMin) : null,
    final_daily_goal: d ? fmtMin(d.targetMin) : null,
    social_media_minutes_today: `${c.socialMin} of ${c.socialLimit}`,
    phone_pickups_today: c.pickups,
    focus_minutes_today: c.focusMin,
    focus_session_running: !!c.focusEndsAt,
    limited_apps_opened_anyway_today: c.overrides.length,
    goals_done: `${c.goalsDone.length} of ${GOALS.length}`,
    habits_user_wants_to_change: d ? d.problems : [],
    user_objectives: d ? d.objectives : [],
    offline_activities_done_today: c.activitiesDone.length,
  };
}

const TOOLS = [
  {
    name: 'start_focus_session',
    description: 'Start a focus session that blocks the user\'s limited apps. Only call when the user agrees.',
    inputSchema: { type: 'object', properties: { minutes: { type: 'integer', enum: [25, 50] } }, required: ['minutes'] },
    execute: ({ minutes }) => {
      const c = useCompanionStore.getState();
      if (c.focusEndsAt) return { started: false, reason: 'A session is already running.' };
      const m = minutes === 50 ? 50 : 25;
      c.startFocus(m);
      toast(`Focus session started: ${m} minutes.`);
      return { started: true, minutes: m };
    },
  },
];

const refusal = (e) => {
  if (!e) return 'unknown error';
  if (e.code === 'not_granted') return 'Claude access was not allowed for this page';
  if (e.code === 'rate_limited') return 'too many messages in a short time';
  return e.message || String(e);
};

/* One conversation shared by the Home prompt bar and the panel. */
export const useAssistant = create((set, get) => ({
  open: false,
  messages: [GREETING],
  style: 'warm',
  busy: false,
  waiting: false,
  err: '',
  note: '',
  mode: null,
  abort: null,
  setOpen: (open) => set({ open }),
  setStyle: (style) => set({ style }),
  reset: () => set({ messages: [GREETING], err: '', note: '' }),
  clearAll: () => set({ open: false, messages: [GREETING], err: '', note: '', busy: false, waiting: false }),
  stop: () => { const a = get().abort; if (a) a.abort(); },
  send: async (text) => {
    const t = (text || '').trim();
    if (!t || get().busy) return;
    const history = [...get().messages.filter((m) => m.id !== 'hello').map((m) => ({ role: m.from === 'me' ? 'user' : 'assistant', content: m.text })), { role: 'user', content: t }];
    const botId = 'b' + Date.now();
    const ctrl = new AbortController();
    set((s) => ({ open: true, err: '', busy: true, waiting: true, abort: ctrl, messages: [...s.messages, { id: 'u' + Date.now(), from: 'me', text: t }] }));
    let started = false;
    const put = (full, meta) => {
      if (!started) { started = true; set((s) => ({ waiting: false, messages: [...s.messages, { id: botId, from: 'bot', text: full, meta }] })); }
      else set((s) => ({ messages: s.messages.map((x) => (x.id === botId ? { ...x, text: full, meta } : x)) }));
    };
    const onText = ({ text: full }) => { if (full && full !== 'Thinking...') put(full); };
    let replied = false;
    try {
      const res = await askAssistant({ history, ctx: detoxContext(), style: get().style, tools: TOOLS, onText, signal: ctrl.signal });
      put(res.text, res.mode === 'offline' ? 'Offline reply' : undefined);
      set({ mode: res.mode, note: res.mode === 'offline' ? 'AI is not connected in this build. Replies are offline examples.' : '' });
      replied = true;
    } catch (e) {
      if (e && e.name === 'AbortError') {
        set({ err: 'Reply stopped.' });
      } else {
        /* AI refused or failed: still answer, and say why. */
        put(offlineReply(t, get().style), 'Offline reply');
        set({ mode: 'offline', note: `AI replies are not available here (${refusal(e)}). You are seeing offline replies. Open the prototype on its own page and allow Claude access to get AI replies.` });
        replied = true;
      }
    } finally {
      set({ busy: false, waiting: false, abort: null });
    }
    if (replied) {
      const c = useCompanionStore.getState();
      if (!c.goalsDone.includes('g-chat')) { c.completeGoal(GOALS.find((g) => g.id === 'g-chat')); toast('Goal done: talk with your Detox assistant. +15 Star Dust', 'good'); }
    }
  },
}));

function useMode() {
  const mode = useAssistant((s) => s.mode);
  useEffect(() => { if (!mode) assistantMode().then((m) => useAssistant.setState((s) => (s.mode ? {} : { mode: m }))); }, [mode]);
  return mode;
}

/* The assistant's face: the companion frog in a round frame with an online dot. */
export function AssistantAvatar({ size = 52 }) {
  const busy = useAssistant((s) => s.busy);
  const mode = useAssistant((s) => s.mode);
  return (
    <span className="assist-avatar" style={{ width: size, height: size }} aria-hidden="true">
      <Sprite stage={2} bob={false} />
      <i className={busy ? 'thinking' : mode === 'offline' ? 'offline' : ''} />
    </span>
  );
}

/* Floating button on every Detox screen. */
export function AssistantFab() {
  useMode();
  const open = useAssistant((s) => s.open);
  const setOpen = useAssistant((s) => s.setOpen);
  if (open) return null;
  return (
    <button type="button" className="assist-fab" onClick={() => setOpen(true)} aria-label="Open Detox assistant">
      <AssistantAvatar />
      <span className="assist-fab-text"><b>Ask assistant</b><small>Here to help, any time</small></span>
    </button>
  );
}

/* Slide-in panel: right side on desktop, bottom sheet on phones. */
export function AssistantPanel() {
  const { open, messages, style, busy, waiting, err, note, setOpen, setStyle, send, stop, reset } = useAssistant();
  const mode = useMode();
  const box = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => { const el = document.getElementById('assistant-chat'); if (el) el.focus(); }, 60);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey); };
  }, [open, setOpen]);
  if (!open) return null;
  return (
    <>
      <div className="assist-scrim" onMouseDown={() => setOpen(false)} aria-hidden="true" />
      <aside ref={box} className="assist-panel" role="dialog" aria-modal="false" aria-label="Detox assistant">
        <div className="assist-head">
          <AssistantAvatar size={44} />
          <div className="grow"><h2>Detox assistant</h2><span className="xs">{busy ? 'Typing' : mode === 'offline' ? 'Offline replies' : mode ? 'Online, AI replies' : 'Connecting'}</span></div>
          <Btn size="sm" icon={X} aria-label="Close assistant" onClick={() => setOpen(false)} />
        </div>
        <div className="assist-body stack">
          {note && <div className="inset small" role="status">{note}</div>}
          <Chat inputId="assistant-chat" messages={messages} typing={waiting} onSend={send} placeholder="Ask about focus, screen time or habits" emptyText="" />
          {messages.length <= 1 && <div className="row wrap">{STARTERS.map((s) => <button key={s} type="button" className="chip" disabled={busy} onClick={() => send(s)}>{s}</button>)}</div>}
          <InlineError>{err}</InlineError>
          <div className="row between wrap">
            <div className="row wrap small"><span className="strong">Reply style</span><Seg label="Reply style" value={style} onChange={setStyle} options={STYLES.map((s) => ({ value: s.value, label: s.label }))} /></div>
            <div className="row">
              {busy && <Btn size="sm" icon={Square} onClick={stop}>Stop</Btn>}
              <Btn size="sm" variant="ghost" icon={RotateCcw} disabled={busy} onClick={reset}>New chat</Btn>
            </div>
          </div>
          <p className="xs muted">The assistant sees your screen time, goals and the habits you named in setup. It is not a counselor. If you feel unsafe, call your local emergency number.</p>
        </div>
      </aside>
    </>
  );
}
