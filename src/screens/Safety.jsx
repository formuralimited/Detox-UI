import React, { useState } from 'react';
import { Activity, Check, Copy, HeartHandshake, MapPin, Minus, Plus, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { toast, useSafetyStore } from '../store.js';
import { Async, Avatar, Btn, Card, InlineError, Seg, Switch, cx, copyText, useFixture, useInterval, useKept } from '../ui.jsx';

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
const PLACES = ['Hall 3, Main Stage', 'Hall 3, Food court', 'Hall 3, Gate C', 'Harbour District station'];
const MOODS = [{ value: 'good', label: 'Good' }, { value: 'okay', label: 'Okay' }, { value: 'struggling', label: 'Struggling' }];
const VIA = ['Push', 'SMS', 'WhatsApp'];
const HISTORY = ['Okay', 'Struggling', 'Struggling'];

export default function SafetyTab() {
  const trusted = useFixture('trusted');
  const support = useFixture('support');
  const { pending, alerts, hrLimit, idleMin, setLimit } = useSafetyStore();
  const [share, setShare] = useKept('safety.share', true);
  const [checkins, setCheckins] = useKept('safety.checkins', [{ id: 1, at: '11:42', place: PLACES[2] }]);
  const [hr, setHr] = useState(72);
  const [mood, setMood] = useKept('safety.mood', 'okay');
  const [showSupport, setShowSupport] = useKept('safety.showSupport', false);
  const [area, setArea] = useKept('safety.area', 'Harbour District');
  const [kind, setKind] = useKept('safety.kind', 'all');
  const [form, setForm] = useState({ name: '', via: 'SMS' });
  const [err, setErr] = useState('');
  const [copyFail, setCopyFail] = useState(null);

  useInterval(() => setHr((h) => Math.max(64, Math.min(86, h + ((Math.random() * 7) | 0) - 3))), 1500);
  const shownHr = pending?.type === 'hr' ? 142 : hr;

  const checkIn = () => {
    const place = PLACES[(Math.random() * PLACES.length) | 0];
    setCheckins((c) => [{ id: Date.now(), at: now(), place }, ...c].slice(0, 4));
    toast(share ? 'Check-in shared with your trusted contacts' : 'Check-in saved. Location sharing is off.', 'good');
  };
  const patch = (id, fn) => trusted.setData((list) => list.map((c) => (c.id === id ? fn(c) : c)));
  const add = (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return setErr('Enter a name.');
    trusted.setData((list) => [...list, { id: 't' + Date.now(), name: form.name.trim(), relation: 'Trusted contact', via: form.via, location: true, status: true, heart: false }]);
    toast(`${form.name.trim()} added`, 'good');
    setForm({ name: '', via: 'SMS' }); setErr('');
    return undefined;
  };
  const copy = async (x) => setCopyFail((await copyText(x.phone, 'Number copied')) ? null : x.id);
  const struggling = mood === 'struggling';
  const persistent = struggling && HISTORY.slice(-2).every((d) => d === 'Struggling');

  return (
    <>
      <div className="row between wrap">
        <p className="muted small">Check-ins, wearable alerts and support near you, shared only with the people you choose.</p>
        <span className={cx('chip', pending ? 'crit' : 'good')}><ShieldCheck size={13} aria-hidden="true" />{pending ? 'Alert pending' : 'Status: safe'}</span>
      </div>

      <div className="grid two">
        <div className="stack">
          <Card title="Check-in" action={<span className="row small"><Switch checked={share} label="Share location" onChange={setShare} />Share location</span>}>
            <div className="row between wrap">
              <div className="stat"><span className="small muted">Last check-in</span><b className="num">{checkins[0].at}</b><span className="small"><MapPin size={13} aria-hidden="true" /> {share ? checkins[0].place : 'Location hidden'}</span></div>
              <Btn variant="primary" icon={Check} onClick={checkIn}>I am safe, check in</Btn>
            </div>
            <div className="list">
              {checkins.slice(1).map((c) => <div key={c.id} className="row between small"><span>{share ? c.place : 'Location hidden'}</span><span className="muted num">{c.at}</span></div>)}
            </div>
          </Card>

          <Card title="How are you today?">
            <Seg label="Mood today" value={mood} onChange={(v) => { setMood(v); if (v !== 'struggling') setShowSupport(false); }} options={MOODS} />
            <p className="xs muted">Last three days: {HISTORY.join(', ')}.</p>
            {persistent && <div className="banner"><HeartHandshake size={17} aria-hidden="true" /><span className="grow">You have had a hard few days. Here are people near you who can help.</span></div>}
            {!struggling && !showSupport && <div><Btn icon={HeartHandshake} onClick={() => setShowSupport(true)}>Show support near me</Btn></div>}
            {(struggling || showSupport) && (
              <Async state={support} rows={4}>
                {(s) => {
                  const rows = s.services.filter((x) => kind === 'all' || x.kind === kind).map((x) => ({ ...x, near: x.area === area })).sort((a, b) => b.near - a.near || a.km - b.km);
                  return (
                    <div className="stack">
                      <div className="row wrap">
                        <label className="small strong" htmlFor="area">Your area</label>
                        <select id="area" className="input" style={{ width: 190 }} value={area} onChange={(e) => setArea(e.target.value)}>{s.areas.map((a) => <option key={a}>{a}</option>)}</select>
                        <Seg label="Support type" value={kind} onChange={setKind} options={[{ value: 'all', label: 'All' }, { value: 'Counselor', label: 'Counselors' }, { value: 'Church', label: 'Churches' }]} />
                      </div>
                      <div className="list">
                        {rows.map((x) => (
                          <div key={x.id} className="stack tight">
                            <div className="row between wrap"><span className="strong">{x.name}</span><span className="row"><span className="chip">{x.kind === 'Church' ? 'Partner church' : 'Licensed counselor'}</span>{x.near && <span className="chip good">In your area</span>}</span></div>
                            <span className="small muted">{x.detail} {x.area}.</span>
                            <div className="row between wrap"><span className="strong num">{x.phone}</span><Btn size="sm" icon={Copy} onClick={() => copy(x)}>Copy number</Btn></div>
                            {copyFail === x.id && <InlineError>Copying is blocked in this browser. Select the number and copy it.</InlineError>}
                          </div>
                        ))}
                      </div>
                      <p className="xs muted">Sample directory for the demo. If you are in immediate danger, call your local emergency number.</p>
                    </div>
                  );
                }}
              </Async>
            )}
          </Card>

          <Card title="Wearable monitoring">
            <div className="row between wrap">
              <div className="stat"><span className="small muted row"><Activity size={14} aria-hidden="true" />Heart rate, from smart ring</span><b className="num" style={shownHr > hrLimit ? { color: 'var(--crit)' } : undefined}>{shownHr} bpm</b></div>
              <span className={cx('chip', shownHr > hrLimit ? 'crit' : 'good')}>{shownHr > hrLimit ? 'Above limit' : 'In range'}</span>
            </div>
            <div className="list">
              <div className="row between"><span className="small strong grow">Alert above</span><Btn size="sm" icon={Minus} aria-label="Lower heart rate limit" disabled={hrLimit <= 100} onClick={() => setLimit('hrLimit', hrLimit - 5)} /><span className="num strong" style={{ minWidth: 70, textAlign: 'center' }}>{hrLimit} bpm</span><Btn size="sm" icon={Plus} aria-label="Raise heart rate limit" disabled={hrLimit >= 180} onClick={() => setLimit('hrLimit', hrLimit + 5)} /></div>
              <div className="row between"><span className="small strong grow">Alert after no activity for</span><Btn size="sm" icon={Minus} aria-label="Shorten inactivity time" disabled={idleMin <= 15} onClick={() => setLimit('idleMin', idleMin - 15)} /><span className="num strong" style={{ minWidth: 70, textAlign: 'center' }}>{idleMin} min</span><Btn size="sm" icon={Plus} aria-label="Lengthen inactivity time" disabled={idleMin >= 120} onClick={() => setLimit('idleMin', idleMin + 15)} /></div>
            </div>
            <p className="xs muted">When a limit is crossed, you get 10 seconds to cancel before your trusted contacts are alerted.</p>
          </Card>

          <Card title="Alert log">
            <div className="list">
              {alerts.length === 0 && <p className="small muted">No alerts sent. Automatic alerts appear here.</p>}
              {alerts.map((a) => <div key={a.id} className="stack tight small"><div className="row between"><span className="strong">{a.reason}</span><span className="muted num">{a.at}</span></div><span className="muted wrap-any">Sent to {a.who}</span></div>)}
            </div>
          </Card>
        </div>

        <div className="stack">
          <Card title="Trusted contacts">
            <Async state={trusted} rows={4}>
              {(list) => (
                <div className="list">
                  {list.length === 0 && <p className="small muted">No trusted contacts. Add one below so alerts reach someone.</p>}
                  {list.map((c) => (
                    <div key={c.id} className="stack tight">
                      <div className="row">
                        <Avatar name={c.name} />
                        <div className="grow"><div className="strong">{c.name}</div><div className="xs muted">{c.relation}</div></div>
                        <select className="input" style={{ width: 118 }} aria-label={`Alert channel for ${c.name}`} value={c.via} onChange={(e) => patch(c.id, (x) => ({ ...x, via: e.target.value }))}>{VIA.map((v) => <option key={v}>{v}</option>)}</select>
                        <Btn size="sm" icon={Trash2} aria-label={`Remove ${c.name}`} onClick={() => { trusted.setData((l) => l.filter((x) => x.id !== c.id)); toast(`${c.name} removed`); }} />
                      </div>
                      <div className="row wrap small">
                        {[['location', 'Location'], ['status', 'Safety status'], ['heart', 'Heart rate']].map(([k, label]) => (
                          <span key={k} className="row"><Switch checked={c[k]} label={`${c.name} sees ${label}`} onChange={(v) => patch(c.id, (x) => ({ ...x, [k]: v }))} />{label}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Async>
            <form className="row top wrap" onSubmit={add}>
              <div className="grow stack tight" style={{ minWidth: 150 }}>
                <input id="trusted-name" className="input" aria-label="Contact name" placeholder="Contact name" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setErr(''); }} />
                <InlineError>{err}</InlineError>
              </div>
              <select id="trusted-via" className="input" style={{ width: 118 }} aria-label="Alert channel" value={form.via} onChange={(e) => setForm({ ...form, via: e.target.value })}>{VIA.map((v) => <option key={v}>{v}</option>)}</select>
              <Btn type="submit" icon={UserPlus}>Add</Btn>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
