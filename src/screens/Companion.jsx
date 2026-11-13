import React, { useEffect, useState } from 'react';
import {
  Activity, Ban, Check, Clock, ShieldCheck, Footprints, HeartPulse, MessageCircle, Minus, Moon, PawPrint, Plus, Send, Sparkles, Timer, Trash2, UserPlus, Users,
} from 'lucide-react';
import { useCompanionStore, useSessionStore, STAGES, stageForDays, hpState, toast, fmtMin } from '../store.js';
import { FOODS, GOALS, TONES } from '../fixtures.js';
import { Async, Avatar, BarChart, Btn, Card, Chat, InlineError, Meter, Seg, Sprite, Switch, TimeSelect, cx, useCountdown, useFixture, useInterval, useKept } from '../ui.jsx';
import { GoalsCard, HpBlock } from './Home.jsx';
import SafetyTab from './Safety.jsx';
import { FocusCard, InsightsCard, OverridesCard, PlanCard, ReflectionCard, ScreenTimeCard, TalkCard } from './Detox.jsx';

const TABS = [
  { value: 'pet', label: 'Companion', icon: PawPrint },
  { value: 'blocking', label: 'Focus', icon: Ban },
  { value: 'health', label: 'Coach', icon: HeartPulse },
  { value: 'safety', label: 'Safety', icon: ShieldCheck },
];

export function LedgerList({ limit = 6 }) {
  const ledger = useCompanionStore((s) => s.ledger);
  return (
    <div className="list">
      {ledger.slice(0, limit).map((l) => (
        <div key={l.id} className="row between small">
          <span className="grow wrap-any">{l.label}</span>
          <span className="muted num">{l.at}</span>
          <span className="strong num" style={{ color: l.amount > 0 ? 'var(--good)' : 'var(--crit)', minWidth: 44, textAlign: 'right' }}>{l.amount > 0 ? '+' : ''}{l.amount}</span>
        </div>
      ))}
    </div>
  );
}

/* Health: companion, chat, app blocking, health coach and safety. Community features live in Community. */
export default function Health({ go, params }) {
  const [kept, setKept] = useKept('health.tab', 'pet');
  const [tab, setTabState] = useState(params.tab || kept);
  const setTab = (t) => { setTabState(t); setKept(t); };
  useEffect(() => { if (params.tab) setTab(params.tab); }, [params]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="page">
      <div className="page-head">
        <div className="stack tight">
          <h1>Health</h1>
          <p className="muted">Your companion, detox goals, app limits, health coach and safety.</p>
        </div>
        <Seg label="Health sections" scroll value={tab} onChange={setTab} options={TABS} />
      </div>
      {tab === 'pet' && <PetTab go={go} />}
      {tab === 'blocking' && <BlockingTab />}
      {tab === 'health' && <HealthTab go={go} />}
      {tab === 'safety' && <SafetyTab />}
    </div>
  );
}

/* ---------------- Pet, HP and Star Dust ---------------- */
function PetTab({ go }) {
  const { hp, starDust, detoxDays, spend, heal } = useCompanionStore();
  const [shopError, setShopError] = useState('');
  const stage = stageForDays(detoxDays);
  const mood = hpState(hp);
  const feed = (f) => {
    if (!spend(f.cost, `Food: ${f.name}`)) return setShopError(`${f.name} costs ${f.cost} Star Dust. You have ${starDust}. Finish a goal or a mini-game to earn more.`);
    setShopError('');
    heal(f.hp);
    return toast(`Fed ${f.name}. +${f.hp} health points.`, 'good');
  };
  return (
    <div className="grid two">
      <div className="stack">
        <Card className="tone" title={`${stage.name}, day ${detoxDays}`} action={<span className="chip sun"><Sparkles size={13} aria-hidden="true" />{starDust} Star Dust</span>}>
          <div className="hud">
            <Sprite stage={stage.id} mood={mood.key} />
            <div className="stack grow"><HpBlock /></div>
          </div>
          {mood.key !== 'thriving' && <div className={cx('banner', mood.key !== 'hungry' && 'crit')}>{mood.key === 'hungry' ? 'Your companion is hungry. Feed it or finish a goal.' : mood.key === 'fainted' ? 'Your companion fainted. Feed it to bring it back.' : 'Your companion feels neglected. Health points drop each day you miss your goals.'}</div>}
        </Card>

        <Card title="Growth stages">
          <div className="row" style={{ gap: 8, alignItems: 'stretch' }}>
            {STAGES.map((s) => (
              <div key={s.id} className="inset stack tight grow" style={{ alignItems: 'center', padding: 8, borderColor: s.id === stage.id ? 'var(--accent)' : undefined, opacity: s.id > stage.id ? 0.55 : 1 }}>
                <Sprite stage={s.id} size="sm" bob={false} />
                <span className="xs strong">{s.name}</span>
                <span className="xs muted">Day {s.fromDay}+</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Food shop" action={<span className="small muted">Paid with Star Dust</span>}>
          <div className="list">
            {FOODS.map((f) => (
              <div key={f.id} className="row between">
                <div><div className="strong">{f.name}</div><div className="xs muted">Restores {f.hp} health points</div></div>
                <Btn size="sm" icon={Sparkles} onClick={() => feed(f)} disabled={hp >= 100}>{f.cost}, buy and feed</Btn>
              </div>
            ))}
          </div>
          <InlineError>{shopError}</InlineError>
          {hp >= 100 && <p className="xs muted">Health points are full. Your companion is not hungry.</p>}
        </Card>
      </div>

      <div className="stack">
        <GoalsCard go={go} />
        <Card title="Star Dust ledger"><LedgerList /></Card>
      </div>
    </div>
  );
}

/* ---------------- App blocking and URL restrictions ---------------- */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function BlockingTab() {
  const state = useFixture('apps');
  const [sched, setSched] = useKept('block.sched', { on: true, start: '21:00', end: '07:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Sun'] });
  const [urls, setUrls] = useKept('block.urls', ['news-scroll.example', 'shop-deals.example']);
  const [url, setUrl] = useState('');
  const [urlErr, setUrlErr] = useState('');
  const detox = useSessionStore((s) => s.detox);
  const patch = (id, fn) => state.setData((apps) => apps.map((a) => (a.id === id ? fn(a) : a)));
  const addUrl = (e) => {
    e.preventDefault();
    const d = url.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(d)) return setUrlErr('Enter a domain like example.com.');
    if (urls.includes(d)) return setUrlErr('That domain is already blocked.');
    setUrls((u) => [...u, d]); setUrl(''); setUrlErr('');
    return toast(`${d} blocked`, 'good');
  };
  return (
    <div className="stack">
      <div className="grid two">
        <FocusCard />
        <ScreenTimeCard />
      </div>
      <PlanCard />
      {detox && <div className="inset small">You allowed Detox to limit {detox.apps.length} apps on {detox.since}. Limits stay on until you turn them off here.</div>}
    <div className="grid two">
      <Card title="Apps and daily limits">
        <Async state={state} rows={5}>
          {(apps) => (
            <div className="list">
              {apps.map((a) => (
                <div key={a.id} className="stack tight">
                  <div className="row between">
                    <span className="strong grow">{a.name}</span>
                    <span className="xs muted">{a.blocked ? 'Limited' : 'No limit'}</span>
                    <Switch checked={a.blocked} label={`Limit ${a.name}`} onChange={(v) => patch(a.id, (x) => ({ ...x, blocked: v }))} />
                  </div>
                  {a.blocked && (
                    <>
                      <Meter value={a.used} max={a.limit} tone={a.used >= a.limit ? 'crit' : a.used / a.limit > 0.7 ? 'warn' : ''} label={`${a.name} usage`} />
                      <div className="row between small">
                        <span className="num">{a.used} of {a.limit} min used{a.used >= a.limit ? '. Blocked until tomorrow.' : ''}</span>
                        <span className="row" style={{ gap: 6 }}>
                          <Btn size="sm" icon={Minus} aria-label={`Lower ${a.name} limit`} disabled={a.limit <= 5} onClick={() => patch(a.id, (x) => ({ ...x, limit: x.limit - 5 }))} />
                          <Btn size="sm" icon={Plus} aria-label={`Raise ${a.name} limit`} disabled={a.limit >= 180} onClick={() => patch(a.id, (x) => ({ ...x, limit: x.limit + 5 }))} />
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </Async>
      </Card>

      <div className="stack">
        <Card title="Block schedule" action={<Switch checked={sched.on} label="Schedule on" onChange={(v) => setSched({ ...sched, on: v })} />}>
          <div className="row wrap">
            <label className="field" htmlFor="sched-start">From<TimeSelect id="sched-start" value={sched.start} onChange={(v) => setSched({ ...sched, start: v })} /></label>
            <label className="field" htmlFor="sched-end">Until<TimeSelect id="sched-end" value={sched.end} onChange={(v) => setSched({ ...sched, end: v })} /></label>
          </div>
          <div className="row wrap">
            {DAYS.map((d) => (
              <button key={d} type="button" className="chip" aria-pressed={sched.days.includes(d)}
                onClick={() => setSched({ ...sched, days: sched.days.includes(d) ? sched.days.filter((x) => x !== d) : [...sched.days, d] })}>{d}</button>
            ))}
          </div>
          <p className="small muted">{sched.on && sched.days.length ? `Limited apps and blocked sites close from ${sched.start} to ${sched.end} on ${sched.days.length} days a week.` : 'No schedule is active.'}</p>
        </Card>

        <Card title="Blocked websites">
          <form className="row top" onSubmit={addUrl}>
            <div className="grow stack tight">
              <input id="block-url" className="input" aria-label="Domain to block" placeholder="example.com" value={url} onChange={(e) => { setUrl(e.target.value); setUrlErr(''); }} />
              <InlineError>{urlErr}</InlineError>
            </div>
            <Btn type="submit" icon={Plus}>Block</Btn>
          </form>
          <div className="list">
            {urls.length === 0 && <p className="small muted">No websites blocked yet.</p>}
            {urls.map((u) => (
              <div key={u} className="row between"><span className="wrap-any">{u}</span><Btn size="sm" icon={Trash2} aria-label={`Unblock ${u}`} onClick={() => setUrls(urls.filter((x) => x !== u))} /></div>
            ))}
          </div>
        </Card>

        <OverridesCard />
      </div>
    </div>
    </div>
  );
}

/* ---------------- AI health coach ---------------- */
const SOURCES = [{ value: 'ring', label: 'Smart ring' }, { value: 'apple', label: 'Apple Health' }, { value: 'google', label: 'Google Fit' }];
const ADVICE = {
  Sleep: 'Keep the same wake time for 7 days. Dim screens 60 minutes before bed and charge your phone outside the bedroom.',
  Exercise: 'Add two 10 minute walks, one after lunch and one after dinner. That adds about 2,000 steps.',
};
/* Green at 90 percent of goal or more, amber from 60 percent, red below. */
const progressTone = (r) => (r >= 0.9 ? '' : r >= 0.6 ? 'warn' : 'crit');

function HealthTab({ go }) {
  const state = useFixture('health');
  const steps = useCompanionStore((s) => s.steps);
  const [source, setSource] = useKept('health.source', 'ring');
  const [hr, setHr] = useState(64);
  const [remind, setRemind] = useKept('health.remind', { on: true, at: '21:00' });
  useInterval(() => setHr((h) => Math.max(58, Math.min(74, h + ((Math.random() * 5) | 0) - 2))), 2000);
  const changeSource = (v) => { setSource(v); state.reload(); toast(`Syncing from ${SOURCES.find((s) => s.value === v).label}`); };
  return (
    <div className="stack">
      <div className="grid two">
        <InsightsCard />
        <div className="stack">
          <ReflectionCard />
          <TalkCard go={go} />
        </div>
      </div>
      <div className="row between wrap">
        <span className="small strong">Data source</span>
        <Seg label="Health data source" scroll value={source} onChange={changeSource} options={SOURCES} />
      </div>
      <Async state={state} rows={6}>
        {(h) => (
          <div className="grid two">
            <div className="stack">
              <div className="grid tiles">
                <Card className="flat"><div className="stat"><span className="small muted row"><Footprints size={14} aria-hidden="true" />Steps today</span><b className="num">{steps.toLocaleString()}</b></div><Meter value={steps} max={h.stepGoal} tone={progressTone(steps / h.stepGoal)} label="Steps" /><span className="xs muted">Goal {h.stepGoal.toLocaleString()}</span></Card>
                <Card className="flat"><div className="stat"><span className="small muted row"><Moon size={14} aria-hidden="true" />Sleep</span><b className="num">{h.sleepH} h</b></div><Meter value={h.sleepH} max={h.sleepGoal} tone={progressTone(h.sleepH / h.sleepGoal)} label="Sleep" /><span className="xs muted">Goal {h.sleepGoal} h</span></Card>
                <Card className="flat"><div className="stat"><span className="small muted row"><Activity size={14} aria-hidden="true" />Heart rate</span><b className="num">{hr} bpm</b></div><span className="xs muted">Live from {SOURCES.find((s) => s.value === source).label}. Resting {h.restingHr}.</span></Card>
              </div>
              <Card title="Steps, last 7 days">
                <BarChart data={h.week.map((d, k) => (k === h.week.length - 1 ? { ...d, steps } : d))} xKey="day" yKey="steps" unit="steps" markIndex={h.week.length - 1} markLabel="Today" goal={h.stepGoal} label="Steps per day for the last 7 days, with the 6,000 step goal" />
              </Card>
            </div>
            <div className="stack">
              <Card title="Coach reminders" action={<Switch checked={remind.on} label="Daily reminders" onChange={(v) => setRemind({ ...remind, on: v })} />}>
                <div className="row wrap small">
                  <label htmlFor="remind-at" className="strong">Daily check-in at</label>
                  <TimeSelect id="remind-at" value={remind.at} disabled={!remind.on} onChange={(v) => setRemind({ ...remind, at: v })} />
                </div>
                <div className="list">
                  {h.reminders.length === 0 && <p className="small muted">No open reminders. Ask the coach for a tip below.</p>}
                  {h.reminders.map((r) => (
                    <div key={r.id} className="stack tight">
                      <div className="row"><span className="chip">{r.topic}</span></div>
                      <p className="small">{r.text}</p>
                      <div className="row wrap">
                        <Btn size="sm" icon={Check} onClick={() => { state.setData((d) => ({ ...d, reminders: d.reminders.filter((x) => x.id !== r.id) })); toast('Marked done', 'good'); }}>Done</Btn>
                        <Btn size="sm" variant="ghost" icon={Clock} onClick={() => { state.setData((d) => ({ ...d, reminders: d.reminders.filter((x) => x.id !== r.id) })); toast('Snoozed for 1 hour'); }}>Snooze 1 hour</Btn>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card title="Ask the coach">
                <div className="row wrap">
                  {Object.keys(ADVICE).map((k) => (
                    <Btn key={k} onClick={() => state.setData((d) => ({ ...d, reminders: [{ id: 'r' + Date.now(), topic: k, text: ADVICE[k] }, ...d.reminders] }))}>{k} advice</Btn>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </Async>
    </div>
  );
}

/* ---------------- Accountability circle ---------------- */
const RELATIONS = ['Spouse', 'Church leader', 'Close friend', 'Family member'];
export function CircleTab() {
  const state = useFixture('circle');
  const { detoxDays, goalsDone, screenMin, overrides } = useCompanionStore();
  const [form, setForm] = useState({ name: '', relation: RELATIONS[0] });
  const [err, setErr] = useState('');
  const [feed, setFeed] = useKept('circle.feed', [{ id: 1, text: 'Daniel Park sent a cheer: "Proud of you. Day 5!"', at: '08:12' }]);
  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const invite = (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return setErr('Enter the name of the person you want to invite.');
    state.setData((c) => [...c, { id: 'a' + Date.now(), name: form.name.trim(), relation: form.relation, status: 'pending', sees: { progress: true, health: false } }]);
    toast(`Invite created for ${form.name.trim()}`, 'good');
    setForm({ name: '', relation: RELATIONS[0] }); setErr('');
    return undefined;
  };
  const patch = (id, fn) => state.setData((c) => c.map((m) => (m.id === id ? fn(m) : m)));
  return (
    <div className="grid two">
      <Card title="Your circle">
        <Async state={state} rows={4}>
          {(circle) => (
            <div className="list">
              {circle.length === 0 && <p className="small muted">Nobody yet. Invite someone you trust.</p>}
              {circle.map((m) => (
                <div key={m.id} className="stack tight">
                  <div className="row">
                    <Avatar name={m.name} />
                    <div className="grow"><div className="strong">{m.name}</div><div className="xs muted">{m.relation}</div></div>
                    <span className={cx('chip', m.status === 'active' ? 'good' : 'warn')}>{m.status === 'active' ? 'Active' : 'Invite pending'}</span>
                  </div>
                  <div className="row wrap small">
                    <span className="row"><Switch checked={m.sees.progress} label={`${m.name} sees detox progress`} onChange={(v) => patch(m.id, (x) => ({ ...x, sees: { ...x.sees, progress: v } }))} />Detox progress</span>
                    <span className="row"><Switch checked={m.sees.health} label={`${m.name} sees health data`} onChange={(v) => patch(m.id, (x) => ({ ...x, sees: { ...x.sees, health: v } }))} />Health data</span>
                  </div>
                  <div className="row wrap">
                    <Btn size="sm" variant="ghost" icon={Trash2} onClick={() => { state.setData((c) => c.filter((x) => x.id !== m.id)); toast(`${m.name} removed`); }}>Remove</Btn>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Async>
      </Card>
      <div className="stack">
        <Card title="Invite someone you trust">
          <form className="stack" onSubmit={invite}>
            <label className="field" htmlFor="circle-name">Name<input id="circle-name" className="input" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setErr(''); }} placeholder="Full name" /></label>
            <label className="field" htmlFor="circle-rel">Relationship
              <select id="circle-rel" className="input" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })}>{RELATIONS.map((r) => <option key={r}>{r}</option>)}</select>
            </label>
            <InlineError>{err}</InlineError>
            <div><Btn type="submit" variant="primary" icon={UserPlus}>Create invite</Btn></div>
          </form>
        </Card>
        <Card title="Status updates">
          <div className="inset small">What your circle sees: day {detoxDays}, {fmtMin(screenMin)} screen time today, {goalsDone.length} of {GOALS.length} goals done, limited apps opened anyway {overrides.length} {overrides.length === 1 ? 'time' : 'times'}.</div>
          <div><Btn icon={Send} onClick={() => { setFeed((f) => [{ id: Date.now(), text: `You shared today's status with your circle.`, at: now() }, ...f]); toast('Status shared with your circle', 'good'); }}>Share today's status</Btn></div>
          <div className="list">
            {feed.map((f) => <div key={f.id} className="row between small"><span className="grow wrap-any">{f.text}</span><span className="muted num">{f.at}</span></div>)}
          </div>
        </Card>
      </div>
    </div>
  );
}
