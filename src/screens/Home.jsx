import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Flame, Timer, Gamepad2, Map as MapIcon, MessageCircle, Nfc, ShoppingBag, Sparkles, Ticket, SkipForward } from 'lucide-react';
import { useCompanionStore, useSessionStore, stageForDays, nextStage, hpState, entryTier } from '../store.js';
import { GOALS } from '../fixtures.js';
import { Btn, Card, Meter, Sprite, cx, useInterval } from '../ui.jsx';
import { ActivitiesCard, FocusCard, ScreenTimeCard, WhyCard } from './Detox.jsx';
import { useAssistant } from './Assistant.jsx';

export function HpBlock() {
  const { hp, detoxDays } = useCompanionStore();
  const state = hpState(hp);
  const next = nextStage(detoxDays);
  const stage = stageForDays(detoxDays);
  return (
    <div className="stack tight">
      <div className="row between small">
        <span className="strong">Health points</span>
        <span className="num"><b>{hp}</b> / 100 <span className={`chip ${hp >= 70 ? 'good' : hp >= 40 ? 'warn' : 'crit'}`}>{state.label}</span></span>
      </div>
      <Meter value={hp} tone={hp >= 70 ? '' : hp >= 40 ? 'warn' : 'crit'} label="Health points" />
      <div className="row between small">
        <span className="strong">Growth</span>
        <span className="muted">{next ? `${next.fromDay - detoxDays} detox days to ${next.name}` : 'Final stage reached'}</span>
      </div>
      <Meter value={detoxDays - stage.fromDay} max={next ? next.fromDay - stage.fromDay : 1} tone="blue" label="Growth to next stage" />
    </div>
  );
}

/* Goals are measured, not ticked by hand. Each row shows live progress and how it completes. */
function goalProgress(g, s) {
  const done = s.goalsDone.includes(g.id);
  if (g.id === 'g-social') {
    const over = s.socialMin > s.socialLimit;
    return { done, value: s.socialMin, max: s.socialLimit, text: `${s.socialMin} of ${s.socialLimit} min used`, status: over ? 'Over limit' : 'On track', tone: over ? 'crit' : 'good', meterTone: over ? 'crit' : s.socialMin / s.socialLimit > 0.8 ? 'warn' : '' };
  }
  if (g.id === 'g-steps') return { done, value: s.steps, max: 6000, text: `${s.steps.toLocaleString()} of 6,000 steps`, status: 'In progress', tone: '', meterTone: 'blue' };
  if (g.id === 'g-block') return { done, text: s.blockedOpens ? `Blocked apps opened ${s.blockedOpens} times` : 'No blocked app opened so far', status: s.blockedOpens ? 'Missed' : 'On track', tone: s.blockedOpens ? 'crit' : 'good' };
  if (g.id === 'g-focus') return { done, text: done ? `${s.focusMin} min focused today` : 'No focus session finished yet', status: s.focusEndsAt ? 'In progress' : 'Not yet', tone: '' };
  return { done, text: done ? 'You talked with your Detox assistant today' : 'Not yet today', status: 'Not yet', tone: '' };
}

export function GoalsCard({ go }) {
  const s = useCompanionStore();
  return (
    <Card title="Today's detox goals" action={<span className="chip">{s.goalsDone.length} of {GOALS.length} done</span>}>
      <div className="list">
        {GOALS.map((g) => {
          const p = goalProgress(g, s);
          return (
            <div key={g.id} className="stack tight">
              <div className="row between top">
                <div className="grow">
                  <div className="strong">{g.label}</div>
                  <div className="xs muted">{p.text}. {g.check}. Earns {g.reward} Star Dust and {g.hp} health points.</div>
                </div>
                {p.done
                  ? <span className="chip good"><Check size={13} aria-hidden="true" />Done</span>
                  : <span className={cx('chip', p.tone)}>{p.status}</span>}
              </div>
              {p.max && !p.done && <Meter value={p.value} max={p.max} tone={p.meterTone} label={g.label} />}
              {g.id === 'g-chat' && !p.done && go && <div><Btn size="sm" icon={MessageCircle} onClick={() => useAssistant.getState().setOpen(true)}>Talk now</Btn></div>}
              {g.id === 'g-focus' && !p.done && !s.focusEndsAt && go && <div><Btn size="sm" icon={Timer} onClick={() => go('health', { tab: 'blocking' })}>Start a session</Btn></div>}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* Detox app home: purpose first, then screen time, focus, offline activities, the companion and goals. */
export default function DetoxHome({ go, params }) {
  const { hp, detoxDays, goalsDone } = useCompanionStore();
  const { user } = useSessionStore();
  const stage = stageForDays(detoxDays);
  const mood = hpState(hp);
  const prompts = useMemo(() => {
    const list = [];
    if (!goalsDone.includes('g-focus')) list.push({ text: 'Start a focus session. I will keep your distracting apps closed until it ends.', cta: 'Start focus', to: ['health', { tab: 'blocking' }] });
    if (hp < 40) list.push({ text: 'I am running low on health. Feed me before I faint.', cta: 'Open food shop', to: ['health', { tab: 'pet' }] });
    list.push({ text: 'Feeling the urge to scroll? Try something offline instead. It feeds me too.', cta: 'See activities', to: ['home', { focus: 'activities' }] });
    if (!goalsDone.includes('g-chat')) list.push({ text: 'Tell the Detox assistant what pulled you to your phone today. Noticing it is half the work.', cta: 'Talk now', to: ['home', { focus: 'assistant' }] });
    list.push({ text: 'Your weekly reflection is waiting. It helps you see your habits clearly.', cta: 'Reflect', to: ['health', { tab: 'health' }] });
    return list;
  }, [hp, goalsDone]);
  const [i, setI] = useState(0);
  useInterval(() => setI((x) => x + 1), 8000);
  const prompt = prompts[i % prompts.length];
  const scrollTo = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  useEffect(() => {
    if (!params || !params.focus) return;
    if (params.focus === 'assistant') useAssistant.getState().setOpen(true);
    else setTimeout(() => scrollTo(params.focus), 50);
  }, [params]);
  return (
    <div className="page">
      <div className="page-head">
        <div className="stack tight">
          <h1>Day {detoxDays} of your digital detox</h1>
          <p className="muted">Hi {user.name.split(' ')[0]}. Less scrolling, more focus, and more time for the people and things that matter to you.</p>
        </div>
      </div>
      <div className="grid two">
        <ScreenTimeCard go={go} />
        <FocusCard />
      </div>
      <div className="grid two">
        <ActivitiesCard go={go} limit={3} />
        <WhyCard go={go} />
      </div>
      <div className="grid two">
        <Card className="tone" title={`Companion: ${stage.name}`}>
          <div className="hud">
            <Sprite stage={stage.id} mood={mood.key} />
            <div className="stack">
              <div className="bubble" aria-live="polite">{prompt.text}</div>
              <div className="row wrap">
                <Btn variant="ghost" size="sm" icon={ArrowRight} onClick={() => { if (prompt.to[0] === 'home') { if (prompt.to[1].focus === 'assistant') useAssistant.getState().setOpen(true); else scrollTo(prompt.to[1].focus); } else go(...prompt.to); }}>{prompt.cta}</Btn>
                <Btn size="sm" variant="ghost" icon={SkipForward} onClick={() => setI((x) => x + 1)}>Next tip</Btn>
              </div>
            </div>
          </div>
          <HpBlock />
        </Card>
        <GoalsCard go={go} />
      </div>
      <Card title="Going to the event?">
        <p className="small muted">Event Mode has your ticket, mini-games, the hall map and collectibles. Star Dust you earn there feeds your companion here.</p>
        <div><Btn icon={Ticket} onClick={() => go(null, null, 'event')}>Open Event Mode</Btn></div>
      </Card>
    </div>
  );
}

/* Event Mode home: companion HUD with event prompts and the pass. */
export function EventHome({ go }) {
  const { hp, detoxDays } = useCompanionStore();
  const { user, gamesDone, streak, checkins, ticketId } = useSessionStore();
  const stage = stageForDays(detoxDays);
  const mood = hpState(hp);
  const tier = entryTier(gamesDone);
  const prompts = useMemo(() => {
    const list = [];
    if (!gamesDone.includes('trivia')) list.push({ text: 'Play the pre-event trivia. Two right answers move your entry to 11:00.', cta: 'Play trivia', to: ['games', { play: 'trivia' }] });
    if (!checkins.includes('C1')) list.push({ text: 'Arcade Corner has no queue right now. Check in there for a Legendary collectible.', cta: 'Open map', to: ['map', { booth: 'C1' }] });
    if (gamesDone.length < 3) list.push({ text: `Finish ${3 - gamesDone.length} more mini-games to enter at 10:00.`, cta: 'Mini-games', to: ['games', {}] });
    list.push({ text: 'Show your pass at Gate C. Your entry window is on it.', cta: 'Open pass', to: ['pass', {}] });
    return list;
  }, [gamesDone, checkins]);
  const [i, setI] = useState(0);
  useInterval(() => setI((x) => x + 1), 8000);
  const prompt = prompts[i % prompts.length];
  return (
    <div className="page">
      <div className="page-head">
        <div className="stack tight">
          <h1>Event Mode</h1>
          <p className="muted">Welcome, {user.name.split(' ')[0]}. Your companion guides you around the hall.</p>
        </div>
      </div>
      <div className="grid two">
        <Card className="tone" title={`Companion: ${stage.name}`} action={<span className="chip sun"><Flame size={13} aria-hidden="true" />{streak} game streak</span>}>
          <div className="hud">
            <Sprite stage={stage.id} mood={mood.key} />
            <div className="stack">
              <div className="bubble" aria-live="polite">{prompt.text}</div>
              <div className="row wrap">
                <Btn variant="primary" size="sm" icon={ArrowRight} onClick={() => go(...prompt.to)}>{prompt.cta}</Btn>
                <Btn size="sm" variant="ghost" icon={SkipForward} onClick={() => setI((x) => x + 1)}>Next tip</Btn>
              </div>
            </div>
          </div>
        </Card>
        <Card title="Your event pass" action={<span className={`chip ${tier.tier ? 'good' : ''}`}>{tier.label}</span>}>
          <div className="row between top wrap">
            <div className="stat"><span className="small muted">Entry window</span><b className="num">{tier.window}</b></div>
            <div className="stat"><span className="small muted">Pass</span><span className="strong num">{ticketId}</span></div>
          </div>
          <p className="small muted">
            {tier.tier === 2 ? 'You hold the earliest window.' : tier.tier === 1 ? `Finish ${3 - gamesDone.length} more mini-games to enter at 10:00.` : 'Pass the trivia to enter at 11:00. Finish three mini-games to enter at 10:00.'}
          </p>
          <div className="row wrap">
            <Btn icon={Ticket} onClick={() => go('pass')}>Open pass</Btn>
            <Btn icon={Gamepad2} onClick={() => go('games')}>Mini-games</Btn>
            <Btn icon={MapIcon} onClick={() => go('map')}>Hall map</Btn>
          </div>
          <div className="inset row between">
            <span className="small"><Sparkles size={14} aria-hidden="true" /> Booth check-ins</span>
            <span className="strong num">{checkins.length} of 7</span>
          </div>
        </Card>
      </div>
      <div className="shortcuts only-mobile">
        <Btn icon={MessageCircle} onClick={() => go('channels')}>Messaging</Btn>
        <Btn icon={Nfc} onClick={() => go('ring')}>Ring and badge</Btn>
        <Btn icon={ShoppingBag} onClick={() => go('store')}>Store</Btn>
      </div>
    </div>
  );
}
