import React, { useEffect, useState } from 'react';
import {
  ArrowRight, Check, Focus, HeartHandshake, Hourglass, MessageCircle, Pause, Play, RotateCcw, Smartphone, Users, Wind,
} from 'lucide-react';
import {
  useCompanionStore, useSessionStore, useInterceptStore, planTarget, fmtMin, PLAN_WEEK, celebrate, toast,
} from '../store.js';
import { ACTIVITIES, APPS, INSIGHTS, OBJECTIVES, SCREEN_WEEK } from '../fixtures.js';
import { BarChart, Btn, Card, InlineError, Meter, Modal, Seg, cx, useCountdown, useInterval, useKept } from '../ui.jsx';
import { OBJECTIVE_ICONS, planWeeks } from './DetoxSetup.jsx';
import { useAssistant } from './Assistant.jsx';

/* ---------- Focus sessions ---------- */
export function useFocusLeft() {
  const endsAt = useCompanionStore((s) => s.focusEndsAt);
  const [now, setNow] = useState(Date.now());
  useInterval(() => setNow(Date.now()), endsAt ? 1000 : null);
  return endsAt ? Math.max(0, Math.round((endsAt - now) / 1000)) : null;
}
export const mmss = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

/* App-level bar while a focus session runs. Finishes the session when time is up. */
export function FocusBar() {
  const left = useFocusLeft();
  const { focusLen, stopFocus, finishFocus } = useCompanionStore();
  useEffect(() => {
    if (left === 0) {
      finishFocus();
      celebrate();
      toast(`Focus session done. ${focusLen} minutes without distractions.`, 'good');
    }
  }, [left]); // eslint-disable-line react-hooks/exhaustive-deps
  if (left == null) return null;
  return (
    <div className="focus-bar" role="status">
      <Focus size={18} aria-hidden="true" />
      <span className="grow">Focus session: <b className="num">{mmss(left)}</b> left. Limited apps are blocked.</span>
      <Btn size="sm" icon={Pause} onClick={() => { stopFocus(); toast('Focus session ended early. No reward this time.'); }}>End early</Btn>
    </div>
  );
}

export function FocusCard() {
  const left = useFocusLeft();
  const { startFocus, focusMin, focusLen } = useCompanionStore();
  const [len, setLen] = useKept('focus.len', 25);
  return (
    <Card title="Focus session" action={<span className="chip num">{focusMin} min focused today</span>}>
      {left != null ? (
        <>
          <div className="row between"><span className="timer num">{mmss(left)}</span><span className="chip crit">Limited apps blocked</span></div>
          <Meter value={focusLen * 60 - left} max={focusLen * 60} tone="accent" label="Focus progress" />
          <p className="small muted">Put your phone face down. You can end early from the bar at the top.</p>
        </>
      ) : (
        <>
          <p className="small muted">Blocks every limited app and site so you can work, study or rest without interruptions.</p>
          <div className="row wrap">
            <Seg label="Session length" value={len} onChange={setLen} options={[{ value: 25, label: '25 min' }, { value: 50, label: '50 min' }]} />
            <Btn variant="primary" icon={Play} onClick={() => { startFocus(len); toast(`Focus session started: ${len} minutes.`); }}>Start focus session</Btn>
          </div>
        </>
      )}
    </Card>
  );
}

/* ---------- Screen time ---------- */
export function ScreenTimeCard({ go }) {
  const detox = useSessionStore((s) => s.detox);
  const { screenMin, pickups } = useCompanionStore();
  const target = planTarget(detox);
  const left = target - screenMin;
  const ratio = screenMin / target;
  return (
    <Card title="Screen time today" action={<span className={cx('chip', left < 0 ? 'crit' : ratio > 0.8 ? 'warn' : 'good')}>{left < 0 ? 'Over target' : ratio > 0.8 ? 'Close to target' : 'On track'}</span>}>
      <div className="row between top wrap">
        <div className="stat"><b className="num">{fmtMin(screenMin)}</b><span className="small muted">of {fmtMin(target)} target, week {PLAN_WEEK} of your plan</span></div>
        <div className="stat" style={{ textAlign: 'right' }}><b className="num">{pickups}</b><span className="small muted">pickups, down from {96}</span></div>
      </div>
      <Meter value={screenMin} max={target} tone={left < 0 ? 'crit' : ratio > 0.8 ? 'warn' : ''} label="Screen time against target" />
      <p className="small">{left >= 0 ? `${fmtMin(left)} left today. ` : `${fmtMin(-left)} over today. `}Your starting average was {fmtMin(detox ? detox.baselineMin : 252)}.</p>
      {go && <div className="row wrap"><Btn icon={Hourglass} onClick={() => go('health', { tab: 'blocking' })}>See limits and plan</Btn></div>}
    </Card>
  );
}

export function PlanCard() {
  const detox = useSessionStore((s) => s.detox);
  const screenMin = useCompanionStore((s) => s.screenMin);
  if (!detox) return null;
  const weeks = planWeeks(detox.baselineMin, detox.targetMin, detox.pace);
  const target = planTarget(detox);
  return (
    <Card title="Your reduction plan">
      <BarChart data={[...SCREEN_WEEK, { day: 'Fri', min: screenMin }]} xKey="day" yKey="min" unit="min" markIndex={SCREEN_WEEK.length} markLabel="Today"
        goal={target} goalLabel="" label="Screen time per day for the last 7 days, in minutes, with this week's target" />
      <p className="xs muted">Bars: minutes of screen time per day. Dashed line: this week's target, {fmtMin(target)}.</p>
      <div className="row wrap">
        {weeks.map((w) => <span key={w.week} className={cx('chip num', w.week === PLAN_WEEK && 'accent', w.week < PLAN_WEEK && 'good')}>Week {w.week}: {fmtMin(w.min)}</span>)}
      </div>
      <p className="small muted">You started at {fmtMin(detox.baselineMin)} a day. Each week the target drops by {detox.pace} minutes until you reach {fmtMin(detox.targetMin)}.</p>
    </Card>
  );
}

/* ---------- Instead of scrolling ---------- */
export function ActivitiesCard({ go, limit }) {
  const { activitiesDone, doActivity } = useCompanionStore();
  const list = limit ? ACTIVITIES.filter((a) => !activitiesDone.includes(a.id)).slice(0, limit) : ACTIVITIES;
  const [all, setAll] = useState(false);
  const shown = all ? ACTIVITIES : list;
  return (
    <Card id="activities" title="Instead of scrolling" action={<span className="chip">{activitiesDone.length} done today</span>}>
      <p className="small muted">Fill the time you win back with something real. Each one earns Star Dust.</p>
      <div className="list">
        {shown.length === 0 && <p className="small muted">You did every activity today. Well done.</p>}
        {shown.map((a) => {
          const done = activitiesDone.includes(a.id);
          return (
            <div key={a.id} className="row between">
              <div className="grow"><div className="strong">{a.title}</div><div className="xs muted">{a.kind}, about {a.min} min, {a.reward} Star Dust</div></div>
              {done ? <span className="chip good"><Check size={13} aria-hidden="true" />Done</span> : (
                <Btn size="sm" icon={a.link ? ArrowRight : Check} onClick={() => {
                  if (a.link && go) { go(...a.link); return; }
                  doActivity(a); toast(`+${a.reward} Star Dust. Time well spent.`, 'good');
                }}>{a.link ? 'Find one' : 'I did this'}</Btn>
              )}
            </div>
          );
        })}
      </div>
      {limit && !all && <div><Btn size="sm" variant="ghost" onClick={() => setAll(true)}>Show all activities</Btn></div>}
    </Card>
  );
}

/* ---------- Your why ---------- */
export function WhyCard({ go }) {
  const { detox, setDetox } = useSessionStore();
  const { focusMin, screenMin, activitiesDone, reflections } = useCompanionStore();
  if (!detox) return null;
  const target = planTarget(detox);
  const status = {
    focus: `${focusMin} min in focus sessions today`,
    screen: `${fmtMin(screenMin)} of ${fmtMin(target)} today`,
    aware: reflections.length ? `${reflections.length} reflections written` : 'No reflection yet this week',
    connect: `${activitiesDone.length} offline activities today`,
  };
  const links = { focus: ['health', { tab: 'blocking' }], screen: ['health', { tab: 'blocking' }], aware: ['health', { tab: 'health' }], connect: ['community', { tab: 'groups' }] };
  return (
    <Card title="Why you are doing this">
      <div className="list">
        {OBJECTIVES.filter((o) => detox.objectives.includes(o.id)).map((o) => {
          const Icon = OBJECTIVE_ICONS[o.id];
          return (
            <div key={o.id} className="row between">
              <Icon size={18} aria-hidden="true" />
              <div className="grow"><div className="strong">{o.title}</div><div className="xs muted">{status[o.id]}</div></div>
              <Btn size="sm" variant="ghost" icon={ArrowRight} aria-label={`Open ${o.title}`} onClick={() => go(...links[o.id])} />
            </div>
          );
        })}
      </div>
      <div className="inset stack tight">
        <span className="small strong">Habits you said you want to change</span>
        {detox.problems.map((p) => <span key={p} className="small">{p}</span>)}
      </div>
      <div><Btn size="sm" variant="ghost" icon={RotateCcw} onClick={() => { setDetox(null); toast('Habit check restarted'); }}>Redo habit check</Btn></div>
    </Card>
  );
}

/* ---------- Pause screen when a limited app is opened ---------- */
export function InterceptModal({ go }) {
  const { app, close } = useInterceptStore();
  const detox = useSessionStore((s) => s.detox);
  const openAnyway = useCompanionStore((s) => s.openAnyway);
  const focusLeft = useFocusLeft();
  const [breathing, setBreathing] = useState(false);
  const [left, setLeft] = useCountdown(60, breathing, () => { setBreathing(false); toast('One calm minute done. The urge usually passes.', 'good'); });
  if (!app) return null;
  const a = APPS.find((x) => x.name === app) || { used: 0, limit: 30 };
  const why = detox && detox.problems[0];
  const done = () => { setBreathing(false); setLeft(60); close(); };
  return (
    <Modal title={`Pause before opening ${app}`} onClose={done}>
      <div className="banner"><Smartphone size={17} aria-hidden="true" />{focusLeft != null ? `${app} is blocked during your focus session.` : `You have used ${a.used} of your ${a.limit} minutes on ${app} today.`}</div>
      {why && <p>You told us: <b>{why.charAt(0).toLowerCase() + why.slice(1)}</b>. This limit is there to help with that.</p>}
      {breathing ? (
        <div className="stack">
          <span className="timer num" aria-live="polite">{mmss(left)}</span>
          <p className="small muted">Breathe in for 4 seconds, out for 6. Notice the urge without acting on it.</p>
          <Meter value={60 - left} max={60} tone="blue" label="Breathing minute" />
        </div>
      ) : (
        <div className="stack tight">
          <Btn variant="primary" block icon={ArrowRight} onClick={() => { done(); go('home'); }}>Do something offline instead</Btn>
          <Btn block icon={Wind} onClick={() => { setLeft(60); setBreathing(true); }}>Breathe for 1 minute</Btn>
          <Btn block variant="ghost" disabled={focusLeft != null} onClick={() => { openAnyway(app); toast(`Logged: you opened ${app} anyway. It counts against today's goals.`, 'bad'); done(); }}>
            {focusLeft != null ? 'Not available during a focus session' : 'Open anyway for 5 minutes'}
          </Btn>
        </div>
      )}
      {breathing && <Btn onClick={done}>Close</Btn>}
    </Modal>
  );
}

export function OverridesCard() {
  const overrides = useCompanionStore((s) => s.overrides);
  return (
    <Card title="Times you opened a limited app anyway">
      {overrides.length === 0 ? <p className="small muted">None so far. Each time you open one anyway, it shows here and your circle can see it.</p> : (
        <div className="list">{overrides.map((o) => <div key={o.id} className="row between small"><span>{o.app}</span><span className="muted num">{o.at}</span></div>)}</div>
      )}
    </Card>
  );
}

/* ---------- Self-awareness and support ---------- */
export function InsightsCard() {
  return (
    <Card title="What your habits show this week">
      <div className="list">
        {INSIGHTS.map((i) => <div key={i.id} className="stack tight"><span className="strong">{i.title}</span><span className="small muted">{i.detail}</span></div>)}
      </div>
    </Card>
  );
}

const PULLS = ['Boredom', 'Stress or worry', 'Loneliness', 'Habit, without thinking', 'Avoiding work'];
export function ReflectionCard() {
  const { reflections, addReflection, earn } = useCompanionStore();
  const [focus, setFocus] = useState(null);
  const [pull, setPull] = useState(null);
  const [helped, setHelped] = useState('');
  const [err, setErr] = useState('');
  const save = (e) => {
    e.preventDefault();
    if (!focus || !pull) return setErr('Answer the first two questions to save.');
    addReflection({ focus, pull, helped: helped.trim(), at: new Date().toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }) });
    earn(10, 'Weekly reflection');
    toast('Reflection saved. +10 Star Dust.', 'good');
    setFocus(null); setPull(null); setHelped(''); setErr('');
    return undefined;
  };
  return (
    <Card title="Weekly reflection">
      <form className="stack" onSubmit={save}>
        <div className="field"><span>How was your focus this week?</span>
          <Seg label="Focus this week" value={focus} onChange={setFocus} options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))} />
          <span className="xs muted">1 is very scattered, 5 is very focused.</span>
        </div>
        <div className="field"><span>What pulled you to your phone most?</span>
          <div className="row wrap">{PULLS.map((p) => <button key={p} type="button" className="chip" aria-pressed={pull === p} onClick={() => setPull(p)}>{p}</button>)}</div>
        </div>
        <label className="field" htmlFor="helped">What helped you stay off it?
          <textarea id="helped" className="input" maxLength={300} value={helped} onChange={(e) => setHelped(e.target.value)} placeholder="A walk after dinner, leaving my phone in the hallway" />
        </label>
        <InlineError>{err}</InlineError>
        <div><Btn type="submit" icon={Check}>Save reflection</Btn></div>
      </form>
      {reflections.length > 0 && (
        <div className="list">
          {reflections.map((r) => <div key={r.id} className="small"><b>{r.at}:</b> focus {r.focus} of 5, pulled by {r.pull.toLowerCase()}{r.helped ? `. Helped: ${r.helped}` : ''}.</div>)}
        </div>
      )}
    </Card>
  );
}

export function TalkCard({ go }) {
  return (
    <Card title="Talk it through">
      <p className="small muted">If something keeps pulling you back to your phone, you do not have to work it out alone.</p>
      <div className="list">
        <div className="row between"><div className="grow"><div className="strong">Your accountability circle</div><div className="xs muted">People you trust who see your progress</div></div><Btn size="sm" icon={Users} onClick={() => go('community', { tab: 'circle' })}>Open circle</Btn></div>
        <div className="row between"><div className="grow"><div className="strong">Licensed counselors and partner churches</div><div className="xs muted">Support near you</div></div><Btn size="sm" icon={HeartHandshake} onClick={() => go('health', { tab: 'safety' })}>Find support</Btn></div>
        <div className="row between"><div className="grow"><div className="strong">Detox assistant</div><div className="xs muted">Talk about an urge as it happens</div></div><Btn size="sm" icon={MessageCircle} onClick={() => useAssistant.getState().setOpen(true)}>Chat now</Btn></div>
      </div>
    </Card>
  );
}
