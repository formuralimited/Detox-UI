import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Eye, Focus, Hourglass, ShieldCheck, Users } from 'lucide-react';
import { useSessionStore, celebrate, toast, fmtMin } from '../store.js';
import { BASELINE, DAILY_TARGETS, HABIT_QUESTIONS, OBJECTIVES, PACES } from '../fixtures.js';
import { Btn, Card, InlineError, Seg, cx, fixtureData, patchFixture } from '../ui.jsx';

export const OBJECTIVE_ICONS = { focus: Focus, screen: Hourglass, aware: Eye, connect: Users };
const LIMIT_APPS = [['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['youtube', 'YouTube'], ['x', 'X'], ['facebook', 'Facebook'], ['reddit', 'Reddit']];
const STEPS = ['Purpose', 'Your habits', 'Measured', 'Your plan', 'Permission'];
const ESTIMATE_MIN = { 'Under 2 hours': 90, '2 to 3 hours': 150, '3 to 4 hours': 210, 'Over 4 hours': 270 };

/* Weekly targets from the baseline down to the daily target. */
export function planWeeks(baseline, target, pace) {
  const weeks = [];
  for (let w = 1; w <= 12; w += 1) {
    const t = Math.max(target, baseline - pace * w);
    weeks.push({ week: w, min: t });
    if (t === target) break;
  }
  return weeks;
}

/* Detox setup: what the app is for, the user's own habits, the measured baseline,
   a gradual plan, and explicit permission to limit apps. */
export default function DetoxSetup() {
  const setDetox = useSessionStore((s) => s.setDetox);
  const user = useSessionStore((s) => s.user);
  const [step, setStep] = useState(0);
  const [estimate, setEstimate] = useState(null);
  const [problems, setProblems] = useState([]);
  const [ack, setAck] = useState(false);
  const [objectives, setObjectives] = useState(OBJECTIVES.map((o) => o.id));
  const [targetMin, setTargetMin] = useState(120);
  const [pace, setPace] = useState(30);
  const [apps, setApps] = useState(['instagram', 'tiktok', 'x']);
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState('');
  const next = () => { setErr(''); setStep((s) => s + 1); };
  const back = () => { setErr(''); setStep((s) => s - 1); };
  const toggle = (list, setList, v) => setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const weeks = planWeeks(BASELINE.avgMin, targetMin, pace);
  const gap = estimate ? BASELINE.avgMin - ESTIMATE_MIN[estimate] : 0;

  const finish = async () => {
    if (!apps.length) return setErr('Choose at least one app to limit, or the detox cannot work.');
    if (!consent) return setErr('Tick the box to allow Detox to limit these apps.');
    const list = await fixtureData('apps');
    patchFixture('apps', () => list.map((a) => ({ ...a, blocked: apps.includes(a.id) })));
    setDetox({ objectives, estimate, problems, acknowledged: true, targetMin, pace, baselineMin: BASELINE.avgMin, consent: true, apps, since: new Date().toISOString().slice(0, 10) });
    celebrate();
    toast('Your detox has started. Limits are on.', 'good');
    return undefined;
  };

  return (
    <div className="onb">
      <div className="onb-card stack" style={{ width: 'min(560px, 100%)' }}>
        <div className="brand"><span className="brand-dot" aria-hidden="true" />Detox</div>
        <div className="steps" aria-label={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}>{STEPS.map((s, i) => <i key={s} className={i <= step ? 'on' : ''} />)}</div>

        {step === 0 && (
          <Card>
            <h1>Take back your time and attention</h1>
            <p className="muted">Hi {user.name.split(' ')[0]}. If your phone is taking more of your day than you want, you are not alone. Many apps are built to keep you scrolling, so breaking the habit is hard on your own. Opening Detox shows you are ready to make a change.</p>
            <p className="muted">Detox can help. It limits the apps that pull at you, shows you your real screen time, and gives you better things to do with the time you win back.</p>
            <div className="stack tight">
              {OBJECTIVES.map((o) => {
                const Icon = OBJECTIVE_ICONS[o.id];
                return (
                  <div key={o.id} className="inset row top">
                    <Icon size={20} aria-hidden="true" />
                    <div><div className="strong">{o.title}</div><div className="small muted">{o.text}</div></div>
                  </div>
                );
              })}
            </div>
            <p className="small">It works when you are honest about your habits and let the app hold you to your limits. Setup takes about 2 minutes.</p>
            <Btn variant="primary" icon={ArrowRight} onClick={next}>Start setup</Btn>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <h1>Be honest about your habits</h1>
            <p className="muted small">Naming the problem is the first step. Only you and your accountability circle see this.</p>
            <div className="field"><span>{HABIT_QUESTIONS.estimate.q}</span>
              <div className="stack tight">
                {HABIT_QUESTIONS.estimate.options.map((o) => <Btn key={o} block className="option" aria-pressed={estimate === o} onClick={() => setEstimate(o)}>{o}</Btn>)}
              </div>
            </div>
            <div className="field"><span>{HABIT_QUESTIONS.problems.q} Choose all that apply.</span>
              <div className="stack tight">
                {HABIT_QUESTIONS.problems.options.map((o) => (
                  <Btn key={o} block className="option" aria-pressed={problems.includes(o)} icon={problems.includes(o) ? Check : undefined} onClick={() => toggle(problems, setProblems, o)}>{o}</Btn>
                ))}
              </div>
            </div>
            <InlineError>{err}</InlineError>
            <div className="row wrap">
              <Btn variant="ghost" icon={ArrowLeft} onClick={back}>Back</Btn>
              <Btn variant="primary" icon={ArrowRight} onClick={() => (!estimate ? setErr('Choose how long you think you spend on your phone.') : !problems.length ? setErr('Choose at least one habit you want to change.') : next())}>Next</Btn>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <h1>What your phone measured</h1>
            <p className="muted small">Average of the last 7 days, from your phone and smart ring.</p>
            <div className="grid tiles">
              <div className="inset stat"><span className="small muted">Screen time per day</span><b className="num">{fmtMin(BASELINE.avgMin)}</b></div>
              <div className="inset stat"><span className="small muted">Phone pickups per day</span><b className="num">{BASELINE.pickups}</b></div>
              <div className="inset stat"><span className="small muted">First pickup</span><b className="num">{BASELINE.firstPickup}</b></div>
            </div>
            <div className="stack tight">
              <span className="small strong">Where the time goes</span>
              {BASELINE.topApps.map(([n, m]) => <div key={n} className="row between small"><span>{n}</span><span className="num strong">{fmtMin(m)} a day</span></div>)}
            </div>
            <div className={cx('banner', gap > 30 && 'crit')}>
              {gap > 30 ? `You guessed ${estimate.toLowerCase()}. You actually spend about ${fmtMin(gap)} more each day than you thought.` : `You guessed ${estimate.toLowerCase()}. That is close to what your phone measured.`}
            </div>
            <div className="inset stack tight">
              <span className="small strong">You told us</span>
              {problems.map((p) => <span key={p} className="small">{p}</span>)}
            </div>
            <label className="row top small strong" htmlFor="ack">
              <input id="ack" type="checkbox" checked={ack} onChange={(e) => { setAck(e.target.checked); setErr(''); }} style={{ width: 20, height: 20, marginTop: 2 }} />
              <span>I accept that these are my habits right now, and I want to change them.</span>
            </label>
            <InlineError>{err}</InlineError>
            <div className="row wrap">
              <Btn variant="ghost" icon={ArrowLeft} onClick={back}>Back</Btn>
              <Btn variant="primary" icon={ArrowRight} onClick={() => (ack ? next() : setErr('Tick the box to continue. The detox starts with accepting where you are now.'))}>Next</Btn>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <h1>Set your goals and plan</h1>
            <div className="field"><span>What do you want from your detox?</span>
              <div className="stack tight">
                {OBJECTIVES.map((o) => (
                  <Btn key={o.id} block className="option" aria-pressed={objectives.includes(o.id)} icon={objectives.includes(o.id) ? Check : undefined} onClick={() => toggle(objectives, setObjectives, o.id)}>{o.title}</Btn>
                ))}
              </div>
            </div>
            <div className="field"><span>Daily screen time goal</span>
              <Seg label="Daily screen time goal" value={targetMin} onChange={setTargetMin} options={DAILY_TARGETS} />
            </div>
            <div className="field"><span>How fast to cut down</span>
              <Seg label="Pace" value={pace} onChange={setPace} options={PACES.map((p) => ({ value: p.value, label: p.label }))} />
              <span className="xs muted">{PACES.find((p) => p.value === pace).hint}. Small steps are easier to keep.</span>
            </div>
            <div className="inset stack tight">
              <span className="small strong">Your plan: {fmtMin(BASELINE.avgMin)} today, {fmtMin(targetMin)} by week {weeks.length}</span>
              <div className="row wrap">
                {weeks.map((w) => <span key={w.week} className="chip num">Week {w.week}: {fmtMin(w.min)}</span>)}
              </div>
            </div>
            <InlineError>{err}</InlineError>
            <div className="row wrap">
              <Btn variant="ghost" icon={ArrowLeft} onClick={back}>Back</Btn>
              <Btn variant="primary" icon={ArrowRight} onClick={() => (objectives.length ? next() : setErr('Choose at least one goal.'))}>Next</Btn>
            </div>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <h1>Let Detox hold you to it</h1>
            <p className="muted small">Limits only work if they are on. Choose the apps that distract you most.</p>
            <div className="row wrap">
              {LIMIT_APPS.map(([id, name]) => (
                <button key={id} type="button" className="chip" aria-pressed={apps.includes(id)} onClick={() => { toggle(apps, setApps, id); setErr(''); }}>{name}</button>
              ))}
            </div>
            <div className="inset small stack tight">
              <span><b>What happens:</b> each chosen app gets a daily time limit. All of them are blocked during focus sessions and from 21:00 to 07:00.</span>
              <span>When you try to open one, Detox pauses you first. You can still open it, but it counts against your goals and your circle can see it.</span>
              <span>You can change this any time in Health, Focus.</span>
            </div>
            <label className="row top small strong" htmlFor="consent">
              <input id="consent" type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); setErr(''); }} style={{ width: 20, height: 20, marginTop: 2 }} />
              <span>I allow Detox to limit and block these apps to help me cut my screen time.</span>
            </label>
            <InlineError>{err}</InlineError>
            <div className="row wrap">
              <Btn variant="ghost" icon={ArrowLeft} onClick={back}>Back</Btn>
              <Btn variant="primary" icon={ShieldCheck} onClick={finish}>Start my detox</Btn>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
