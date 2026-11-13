import React, { useState } from 'react';
import { ArrowLeft, Check, LoaderCircle, TicketCheck } from 'lucide-react';
import { useCompanionStore, useSessionStore, celebrate, toast, THEME_OPTIONS } from '../store.js';
import { SURVEY } from '../fixtures.js';
import { Btn, Card, Seg, Sprite } from '../ui.jsx';


const DEMO_ACCOUNT = { name: 'Alex Chen', email: 'alex.chen@example.com' };

export default function Onboarding({ mode = 'event' }) {
  const theme = useCompanionStore((s) => s.theme);
  const setTheme = useCompanionStore((s) => s.setTheme);
  const { user, signIn, completeSurvey } = useSessionStore();
  const [busy, setBusy] = useState(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const connect = (provider) => {
    setBusy(provider);
    setTimeout(() => { signIn({ ...DEMO_ACCOUNT, provider }); setBusy(null); }, 900);
  };
  const pick = (id, value) => {
    setAnswers((a) => ({ ...a, [id]: value }));
    setTimeout(() => setStep((s) => s + 1), 180);
  };
  const issue = () => {
    completeSurvey(answers);
    celebrate();
    toast('Ticket issued. Open Pass to see it.', 'good');
  };

  return (
    <div className="onb">
      <div className="onb-card stack">
        <div className="row between wrap">
          <div className="brand"><span className="brand-dot" aria-hidden="true" />Detox</div>
          <Seg label="Visual style" value={theme} onChange={setTheme} options={THEME_OPTIONS} />
        </div>

        {!user && (
          <Card>
            <div className="row top">
              <Sprite stage={1} size="sm" />
              <div className="stack tight grow">
                <h1>{mode === 'event' ? 'Welcome to Event Mode' : 'Welcome to Detox'}</h1>
                <p className="muted">{mode === 'event' ? 'You scanned the event poster. Sign in to get your digital ticket and meet your companion.' : 'Sign in to meet your companion and start your detox.'}</p>
              </div>
            </div>
            <div className="stack tight">
              {['Google', 'Facebook'].map((p) => (
                <Btn key={p} block variant={p === 'Google' ? 'primary' : 'blue'} disabled={!!busy} icon={busy === p ? LoaderCircle : undefined} onClick={() => connect(p)}>
                  {busy === p ? `Connecting to ${p}` : `Continue with ${p}`}
                </Btn>
              ))}
            </div>
            <p className="xs muted">Demo sign-in. No real account is used.{mode === 'event' ? ' Your verified profile maps to your event profile.' : ''}</p>
          </Card>
        )}

        {mode === 'event' && (
          <div><Btn size="sm" variant="ghost" onClick={() => { try { window.location.hash = 'home'; } catch { /* ignore */ } }}>Go to the Detox app instead</Btn></div>
        )}

        {user && step < SURVEY.length && (
          <Card>
            <div className="steps" aria-label={`Question ${step + 1} of ${SURVEY.length}`}>
              {SURVEY.map((q, i) => <i key={q.id} className={i <= step ? 'on' : ''} />)}
            </div>
            <p className="small muted">Signed in as {user.name} with {user.provider}. Question {step + 1} of {SURVEY.length}.</p>
            <h1>{SURVEY[step].q}</h1>
            <div className="stack tight">
              {SURVEY[step].options.map((o) => (
                <Btn key={o} block className="option" aria-pressed={answers[SURVEY[step].id] === o} onClick={() => pick(SURVEY[step].id, o)}>{o}</Btn>
              ))}
            </div>
            {step > 0 && <div><Btn size="sm" variant="ghost" icon={ArrowLeft} onClick={() => setStep((s) => s - 1)}>Back</Btn></div>}
          </Card>
        )}

        {user && step >= SURVEY.length && (
          <Card>
            <div className="steps">{SURVEY.map((q) => <i key={q.id} className="on" />)}</div>
            <h1>Your profile is ready</h1>
            <div className="list">
              {SURVEY.map((q) => (
                <div key={q.id} className="row between">
                  <span className="small muted">{q.q}</span>
                  <span className="strong row"><Check size={15} aria-hidden="true" />{answers[q.id]}</span>
                </div>
              ))}
            </div>
            <Btn block variant="primary" icon={TicketCheck} onClick={issue}>Issue my ticket</Btn>
            <div><Btn size="sm" variant="ghost" icon={ArrowLeft} onClick={() => setStep(SURVEY.length - 1)}>Change answers</Btn></div>
          </Card>
        )}
      </div>
    </div>
  );
}
