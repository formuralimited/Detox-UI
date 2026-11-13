import React, { useMemo, useState } from 'react';
import { CalendarPlus, Check, Hand, Lock, MailCheck, MapPin, Plus, RotateCcw, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { toast } from '../store.js';
import { INTERESTS, PERSONALITY_QUIZ } from '../fixtures.js';
import { Async, Avatar, Btn, Card, InlineError, Meter, Modal, Seg, TimeSelect, cx, useFixture, useKept } from '../ui.jsx';

const DEMO_CODE = '482913';
const ageFrom = (dob) => {
  const d = new Date(dob), n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a -= 1;
  return a;
};

/* ---------------- Age and email gate ---------------- */
function Gate({ onVerified, blocked, onBlocked }) {
  const [step, setStep] = useState(blocked ? 'blocked' : 'email'); // email | code | dob | blocked
  const [email, setEmail] = useState('alex.chen@example.com');
  const [code, setCode] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState(null);
  const [err, setErr] = useState('');
  const go = (s) => { setErr(''); setStep(s); };

  const sendCode = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr('Enter a valid email address.');
    return go('code');
  };
  const checkCode = (e) => {
    e.preventDefault();
    if (code.trim() !== DEMO_CODE) return setErr('That code does not match. Use the demo code shown above.');
    return go('dob');
  };
  const checkAge = (e) => {
    e.preventDefault();
    if (!dob) return setErr('Enter your date of birth.');
    const age = ageFrom(dob);
    if (Number.isNaN(age) || age > 120 || age < 0) return setErr('Enter a real date of birth.');
    if (age < 18) { onBlocked(); return go('blocked'); }
    if (!gender) return setErr('Choose one option to continue.');
    toast('Verified as an adult', 'good');
    return onVerified({ email, age, gender });
  };

  return (
    <div className="page" style={{ maxWidth: 560 }}>
      <h1>Match</h1>
      <Card title="Verify your age to use Match">
        <p className="small muted">Matching and community features are for adults aged 18 and over. We check your email and your date of birth first.</p>
        <div className="steps" aria-hidden="true">{['email', 'code', 'dob'].map((s, i) => <i key={s} className={['email', 'code', 'dob', 'blocked'].indexOf(step) >= i ? 'on' : ''} />)}</div>

        {step === 'email' && (
          <form className="stack" onSubmit={sendCode}>
            <label className="field" htmlFor="gate-email">Email address<input id="gate-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <InlineError>{err}</InlineError>
            <div><Btn type="submit" variant="primary" icon={MailCheck}>Send verification code</Btn></div>
          </form>
        )}
        {step === 'code' && (
          <form className="stack" onSubmit={checkCode}>
            <div className="inset small">A code was created for <b className="wrap-any">{email}</b>. Demo code: <b className="num">{DEMO_CODE}</b></div>
            <label className="field" htmlFor="gate-code">6 digit code<input id="gate-code" className="input num" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} /></label>
            <InlineError>{err}</InlineError>
            <div className="row wrap"><Btn type="submit" variant="primary">Verify email</Btn><Btn variant="ghost" onClick={() => go('email')}>Change email</Btn></div>
          </form>
        )}
        {step === 'dob' && (
          <form className="stack" onSubmit={checkAge}>
            <label className="field" htmlFor="gate-dob">Date of birth<input id="gate-dob" className="input" type="date" value={dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDob(e.target.value)} /></label>
            <div className="field"><span>I am a</span>
              <Seg label="Gender" value={gender} onChange={setGender} options={[{ value: 'lady', label: 'Lady' }, { value: 'man', label: 'Man' }]} />
            </div>
            <InlineError>{err}</InlineError>
            <div><Btn type="submit" variant="primary" icon={ShieldCheck}>Confirm and continue</Btn></div>
          </form>
        )}
        {step === 'blocked' && (
          <div className="stack">
            <div className="banner crit"><Lock size={17} aria-hidden="true" />Match is closed to anyone under 18.</div>
            <p className="small">You can still use your companion, the event features and Safety. Match will not open on this account.</p>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------------- Main ---------------- */
const TABS = [{ value: 'discover', label: 'Discover', icon: MapPin }, { value: 'pairing', label: 'Pairing', icon: Sparkles }, { value: 'groups', label: 'Groups', icon: Users }];
const SPOTS = ['Food court, Hall 3', 'Arcade Corner (C1)', 'Main Stage seating'];

export default function Match() {
  const [me, setMe] = useKept('match.me', null);
  const [blocked, setBlocked] = useKept('match.blocked', false);
  const [tab, setTab] = useKept('match.tab', 'discover');
  const [type, setType] = useKept('match.type', null);
  const [mine, setMine] = useKept('match.mine', ['Manga', 'Retro games']);
  const people = useFixture('people');
  if (!me) return <Gate key={blocked ? 'blocked' : 'open'} onVerified={setMe} blocked={blocked} onBlocked={() => setBlocked(true)} />;
  const pool = (list) => list.filter((p) => p.gender !== me.gender);
  return (
    <div className="page">
      <div className="page-head">
        <div className="stack tight">
          <h1>Match</h1>
          <p className="muted">Meet adults who share your interests, nearby or at the event.</p>
        </div>
        <Seg label="Match sections" scroll value={tab} onChange={setTab} options={TABS} />
      </div>
      <div className="row wrap">
        <span className="chip good"><ShieldCheck size={13} aria-hidden="true" />Adult verified, age {me.age}</span>
        <span className="chip">Pairing: {me.gender === 'lady' ? 'lady with men' : 'man with ladies'}</span>
        {type && <span className="chip accent">{type}</span>}
      </div>
      {tab === 'groups' ? <Groups /> : (
        <Async state={people} rows={6}>
          {(list) => tab === 'discover'
            ? <Discover people={pool(list)} mine={mine} setMine={setMine} />
            : <Pairing people={pool(list)} mine={mine} type={type} setType={setType} />}
        </Async>
      )}
    </div>
  );
}

function PersonRow({ p, shared, extra, waved, onWave, onMeet }) {
  return (
    <div className="stack tight">
      <div className="row top">
        <Avatar name={p.name} />
        <div className="grow">
          <div className="row between wrap"><span className="strong">{p.name}, {p.age}</span><span className="small muted num">{p.km} km away</span></div>
          <p className="small">{p.bio}</p>
          <div className="row wrap" style={{ marginTop: 6 }}>
            {p.interests.map((t) => <span key={t} className={cx('chip', shared.includes(t) && 'sun')}>{t}</span>)}
            {extra}
          </div>
        </div>
      </div>
      <div className="row wrap">
        <Btn size="sm" icon={waved ? Check : Hand} onClick={onWave}>{waved ? 'Hello sent' : 'Say hello'}</Btn>
        <Btn size="sm" icon={CalendarPlus} onClick={onMeet}>Suggest a meetup</Btn>
      </div>
    </div>
  );
}

function useSocial() {
  const [waved, setWaved] = useKept('match.waved', []);
  const [meet, setMeet] = useState(null);
  const [spot, setSpot] = useState(SPOTS[0]);
  const [time, setTime] = useState('15:30');
  const wave = (p) => { setWaved((w) => (w.includes(p.id) ? w.filter((x) => x !== p.id) : [...w, p.id])); if (!waved.includes(p.id)) toast(`Hello sent to ${p.name}`, 'good'); };
  const modal = meet && (
    <Modal title={`Meet ${meet.name}`} onClose={() => setMeet(null)}>
      <p className="small muted">Meetups are suggested in public places at the event.</p>
      <label className="field" htmlFor="meet-spot">Place
        <select id="meet-spot" className="input" value={spot} onChange={(e) => setSpot(e.target.value)}>{SPOTS.map((s) => <option key={s}>{s}</option>)}</select>
      </label>
      <label className="field" htmlFor="meet-time">Time<TimeSelect id="meet-time" value={time} onChange={setTime} /></label>
      <div className="row wrap">
        <Btn variant="primary" icon={CalendarPlus} onClick={() => { toast(`Meetup suggested to ${meet.name}: ${spot}, ${time}`, 'good'); setMeet(null); }}>Send suggestion</Btn>
        <Btn variant="ghost" onClick={() => setMeet(null)}>Cancel</Btn>
      </div>
    </Modal>
  );
  return { waved, wave, setMeet, modal };
}

/* ---------------- Interest and location discovery ---------------- */
function Discover({ people, mine, setMine }) {
  const [km, setKm] = useKept('match.km', 5);
  const [sel, setSel] = useState(null);
  const social = useSocial();
  const results = useMemo(
    () => people
      .map((p) => ({ ...p, shared: p.interests.filter((t) => mine.includes(t)) }))
      .filter((p) => p.km <= km && (mine.length === 0 || p.shared.length > 0))
      .sort((a, b) => b.shared.length - a.shared.length || a.km - b.km),
    [people, mine, km]
  );
  const toggle = (t) => setMine(mine.includes(t) ? mine.filter((x) => x !== t) : [...mine, t]);
  return (
    <div className="grid two">
      <div className="stack">
        <Card title="Your interests">
          <div className="row wrap">{INTERESTS.map((t) => <button key={t} type="button" className="chip" aria-pressed={mine.includes(t)} onClick={() => toggle(t)}>{t}</button>)}</div>
          <label className="field" htmlFor="km">Within {km} km
            <input id="km" type="range" min="1" max="10" step="1" value={km} onChange={(e) => setKm(+e.target.value)} />
          </label>
        </Card>
        <Card title="People near you" action={<span className="chip">{results.length} found</span>}>
          <div className="map-wrap">
            <svg viewBox="-11 -11 22 22" role="group" aria-label="Nearby people map">
              <rect x="-11" y="-11" width="22" height="22" fill="#130d30" />
              {[2.5, 5, 7.5, 10].map((r) => <circle key={r} r={r} fill="none" stroke={r <= km ? '#6a5be0' : '#2a2068'} strokeWidth="0.08" />)}
              <circle r={km} fill="#3de0ff" opacity="0.08" />
              {[5, 10].map((r) => <text key={r} x="0.3" y={-r + 0.9} fontSize="0.8" fill="#b0a7e0">{r} km</text>)}
              <rect x="-0.4" y="-0.4" width="0.8" height="0.8" fill="#ff3d7f" stroke="#fff" strokeWidth="0.12" />
              {results.map((p, i) => {
                const a = (i * 137.5 * Math.PI) / 180, x = Math.cos(a) * p.km, y = Math.sin(a) * p.km;
                return (
                  <g key={p.id} className="map-booth" tabIndex={0} role="button" aria-label={`${p.name}, ${p.km} km away`} onClick={() => setSel(p.id)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSel(p.id))}>
                    <circle cx={x} cy={y} r="1.4" fill="transparent" />
                    <circle cx={x} cy={y} r={sel === p.id ? 0.75 : 0.55} fill="#ffd23f" stroke={sel === p.id ? '#fff' : '#0d0b1e'} strokeWidth="0.14" />
                    <text x={x} y={y - 0.95} textAnchor="middle" fontSize="0.8" fontWeight="700" fill="#f4f0ff">{p.name}</text>
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="xs muted">Pink square is you. Tap a dot to highlight that person in the list.</p>
        </Card>
      </div>
      <Card title="Shared interests first">
        <div className="list">
          {results.length === 0 && <p className="small muted">Nobody matches yet. Add an interest or widen the distance.</p>}
          {results.map((p) => (
            <div key={p.id} style={sel === p.id ? { background: 'var(--surface-2)', margin: '0 -8px', padding: '10px 8px' } : undefined}>
              <PersonRow p={p} shared={p.shared} waved={social.waved.includes(p.id)} onWave={() => social.wave(p)} onMeet={() => social.setMeet(p)} />
            </div>
          ))}
        </div>
      </Card>
      {social.modal}
    </div>
  );
}

/* ---------------- Personality and community pairing ---------------- */
function Pairing({ people, mine, type, setType }) {
  const [answers, setAnswers] = useState({});
  const social = useSocial();
  const done = PERSONALITY_QUIZ.every((q) => answers[q.id] != null);
  const score = (p) => {
    const letters = [...type].filter((ch, i) => p.type[i] === ch).length;
    const shared = p.interests.filter((t) => mine.includes(t)).length;
    return Math.min(98, 30 + letters * 13 + shared * 9);
  };
  const ranked = type ? people.map((p) => ({ ...p, fit: score(p), shared: p.interests.filter((t) => mine.includes(t)) })).sort((a, b) => b.fit - a.fit).slice(0, 3) : [];
  return (
    <div className="grid two">
      <Card title={type ? `Your profile: ${type}` : 'Find your profile'} action={type && <Btn size="sm" icon={RotateCcw} onClick={() => { setType(null); setAnswers({}); }}>Retake</Btn>}>
        {type ? (
          <p className="small muted">Pairing uses this profile and how you chat with your companion. It updates as your conversations grow.</p>
        ) : (
          <>
            {PERSONALITY_QUIZ.map((q) => (
              <div key={q.id} className="field"><span>{q.q}</span>
                <Seg label={q.q} value={answers[q.id]} onChange={(v) => setAnswers({ ...answers, [q.id]: v })} options={q.a.map((a, i) => ({ value: i, label: a }))} />
              </div>
            ))}
            <div><Btn variant="primary" icon={Sparkles} disabled={!done} onClick={() => { setType(PERSONALITY_QUIZ.map((q) => q.letters[answers[q.id]]).join('')); toast('Profile saved', 'good'); }}>See my pairings</Btn></div>
            {!done && <p className="xs muted">Answer all four to continue.</p>}
          </>
        )}
      </Card>
      <Card title="Paired for you">
        {!type && <p className="small muted">Answer the four questions to see who you pair well with.</p>}
        <div className="list">
          {ranked.map((p) => (
            <div key={p.id} className="stack tight">
              <div className="row between small"><span className="strong">Compatibility</span><span className="num strong">{p.fit}%</span></div>
              <Meter value={p.fit} tone="accent" label={`Compatibility with ${p.name}`} />
              <PersonRow p={p} shared={p.shared} extra={<span className="chip accent">{p.type}</span>} waved={social.waved.includes(p.id)} onWave={() => social.wave(p)} onMeet={() => social.setMeet(p)} />
            </div>
          ))}
        </div>
      </Card>
      {social.modal}
    </div>
  );
}

/* ---------------- Micro-communities ---------------- */
function Groups() {
  const state = useFixture('groups');
  const [form, setForm] = useState({ name: '', tag: INTERESTS[0] });
  const [err, setErr] = useState('');
  const create = (e) => {
    e.preventDefault();
    if (form.name.trim().length < 3) return setErr('Give your club a name of at least 3 letters.');
    state.setData((g) => [{ id: 'g' + Date.now(), name: form.name.trim(), tags: [form.tag], members: 1, fit: 'Started by you', joined: true }, ...g]);
    toast(`${form.name.trim()} created`, 'good');
    setForm({ name: '', tag: INTERESTS[0] }); setErr('');
    return undefined;
  };
  return (
    <div className="grid two">
      <Card title="Groups that fit you">
        <Async state={state} rows={5}>
          {(groups) => (
            <div className="list">
              {groups.map((g) => (
                <div key={g.id} className="row between top">
                  <div className="grow stack tight">
                    <span className="strong">{g.name}</span>
                    <span className="xs muted">{g.members} members. {g.fit}.</span>
                    <span className="row wrap">{g.tags.map((t) => <span key={t} className="chip">{t}</span>)}</span>
                  </div>
                  <Btn size="sm" icon={g.joined ? Check : Plus}
                    onClick={() => { state.setData((list) => list.map((x) => (x.id === g.id ? { ...x, joined: !x.joined, members: x.members + (x.joined ? -1 : 1) } : x))); toast(g.joined ? `Left ${g.name}` : `Joined ${g.name}`, g.joined ? 'info' : 'good'); }}>
                    {g.joined ? 'Joined' : 'Join'}
                  </Btn>
                </div>
              ))}
            </div>
          )}
        </Async>
      </Card>
      <Card title="Start a club">
        <form className="stack" onSubmit={create}>
          <label className="field" htmlFor="club-name">Club name<input id="club-name" className="input" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setErr(''); }} placeholder="Sunday Card Swap" /></label>
          <label className="field" htmlFor="club-tag">Main interest
            <select id="club-tag" className="input" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })}>{INTERESTS.map((t) => <option key={t}>{t}</option>)}</select>
          </label>
          <InlineError>{err}</InlineError>
          <div><Btn type="submit" variant="primary" icon={Plus}>Create club</Btn></div>
        </form>
      </Card>
    </div>
  );
}
