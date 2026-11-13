import React, { useState } from 'react';
import { Check, Megaphone, MessageSquareReply, Send, ThumbsUp, Users } from 'lucide-react';
import { toast } from '../store.js';
import { Async, Btn, Card, InlineError, LineChart, Modal, Seg, cx, useFixture, useInterval } from '../ui.jsx';

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

/* ---------------- Social listening (marketing ops) ---------------- */
const tone = (s) => (s <= -0.3 ? { key: 'crit', label: 'Negative' } : s >= 0.3 ? { key: 'good', label: 'Positive' } : { key: 'warn', label: 'Neutral' });
const LEVELS = { critical: { chip: 'crit', label: 'Critical' }, serious: { chip: 'serious', label: 'Serious' }, warning: { chip: 'warn', label: 'Warning' } };
const PUBLISH_TO = ['Social', 'Discord', 'WhatsApp'];
export function Listening() {
  const trend = useFixture('sentiment');
  const alerts = useFixture('alerts');
  const mentions = useFixture('mentions');
  const [filter, setFilter] = useState('all');
  const [stream, setStream] = useState(null);
  const [draft, setDraft] = useState(null); // { id, title, text, to }
  const [boosted, setBoosted] = useState([]);
  const [draftErr, setDraftErr] = useState('');
  const all = mentions.data || [];
  const shown = stream || all.slice(0, 5);

  useInterval(() => {
    if (!all.length) return;
    const next = all[(shown.length + Date.now()) % all.length];
    setStream([{ ...next, id: next.id + '-' + Date.now(), at: now() }, ...shown].slice(0, 8));
  }, all.length ? 4500 : null);

  const setAlert = (id, patch) => alerts.setData((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const publish = () => {
    if (!draft.text.trim()) return setDraftErr('Write a response before publishing.');
    if (!draft.to.length) return setDraftErr('Choose at least one channel.');
    setDraftErr('');
    if (draft.id) setAlert(draft.id, { status: 'responded', note: `Response published on ${draft.to.join(', ')} at ${now()}` });
    toast(`Response published on ${draft.to.join(', ')}`, 'good');
    return setDraft(null);
  };
  const visible = shown.filter((m) => filter === 'all' || tone(m.score).key === (filter === 'neg' ? 'crit' : 'good'));
  const openCount = (alerts.data || []).filter((a) => a.status === 'open').length;

  return (
    <div className="page">
      <div className="page-head">
        <div className="stack tight"><h1>Social listening</h1><p className="muted">Sentiment across social, Discord and WhatsApp, with alerts when something goes wrong on the floor.</p></div>
        <span className={cx('chip', openCount ? 'crit' : 'good')}>{openCount} open alerts</span>
      </div>

      <div className="grid two">
        <div className="stack">
          <Card title="Sentiment score, today" action={<span className="small muted">0 to 100, higher is better</span>}>
            <Async state={trend} rows={5}>
              {(rows) => (
                <>
                  <LineChart data={rows} xKey="t" yKey="score" label="Sentiment score through the day" />
                  <div className="inset small">Score fell from <b className="num">71</b> at 11:00 to <b className="num">{rows[rows.length - 1].score}</b> now. Entry queue complaints drive the drop.</div>
                </>
              )}
            </Async>
          </Card>

          <Card title="Live mentions" action={<Seg label="Mention filter" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All' }, { value: 'neg', label: 'Negative' }, { value: 'pos', label: 'Positive' }]} />}>
            <Async state={mentions} rows={6}>
              {() => (
                <div className="list">
                  {visible.length === 0 && <p className="small muted">No mentions match this filter right now.</p>}
                  {visible.map((m) => {
                    const t = tone(m.score);
                    return (
                      <div key={m.id} className="stack tight">
                        <div className="row between wrap small"><span className="strong">{m.handle} <span className="muted">on {m.source}</span></span><span className="row"><span className="chip">{m.topic}</span><span className={cx('chip', t.key)}>{t.label}</span></span></div>
                        <p className="small wrap-any">{m.text}</p>
                        <div className="row wrap">
                          <Btn size="sm" icon={MessageSquareReply} onClick={() => setDraft({ id: null, title: `Reply to ${m.handle}`, text: t.key === 'good' ? 'Thank you! Glad you are enjoying it. Tell us your favorite booth so far.' : 'Thanks for flagging this. Our floor team is on it now and we will update you here.', to: [m.source] })}>Reply</Btn>
                          {t.key === 'good' && <Btn size="sm" icon={boosted.includes(m.id) ? Check : ThumbsUp} onClick={() => { setBoosted((b) => (b.includes(m.id) ? b : [...b, m.id])); toast('Queued for reshare on event channels', 'good'); }}>{boosted.includes(m.id) ? 'Queued' : 'Amplify'}</Btn>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Async>
          </Card>
        </div>

        <div className="stack">
          <Async state={alerts} rows={8}>
            {(list) => list.map((a) => {
              const lv = LEVELS[a.level];
              return (
                <Card key={a.id} className={cx('alert', a.level, a.status !== 'open' && 'done')} title={a.title} action={<span className={cx('chip', a.status === 'open' ? lv.chip : 'good')}>{a.status === 'open' ? lv.label : a.status === 'resolved' ? 'Resolved' : 'Handled'}</span>}>
                  <p className="small">{a.detail}</p>
                  {a.note && <div className="inset small">{a.note}</div>}
                  <div className="row wrap">
                    <Btn size="sm" icon={Megaphone} disabled={a.status === 'resolved'} onClick={() => setDraft({ id: a.id, title: a.title, text: a.draft, to: ['Social', 'Discord'] })}>Draft response</Btn>
                    <Btn size="sm" icon={Users} disabled={a.status === 'resolved' || a.dispatched} onClick={() => { setAlert(a.id, { dispatched: true, status: 'handled', note: `Floor staff dispatched at ${now()}` }); toast('Floor staff dispatched', 'good'); }}>{a.dispatched ? 'Staff dispatched' : 'Dispatch staff'}</Btn>
                    <Btn size="sm" variant="ghost" icon={Check} disabled={a.status === 'resolved'} onClick={() => { setAlert(a.id, { status: 'resolved', note: `Resolved at ${now()}` }); toast('Alert resolved'); }}>Resolve</Btn>
                  </div>
                </Card>
              );
            })}
          </Async>
        </div>
      </div>

      {draft && (
        <Modal title={draft.title} onClose={() => { setDraft(null); setDraftErr(''); }}>
          <label className="field" htmlFor="draft-text">Public response
            <textarea id="draft-text" className="input" rows={4} maxLength={280} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
          </label>
          <span className="xs muted num">{draft.text.length} of 280 characters</span>
          <div className="row wrap">{PUBLISH_TO.map((c) => <button key={c} type="button" className="chip" aria-pressed={draft.to.includes(c)} onClick={() => setDraft({ ...draft, to: draft.to.includes(c) ? draft.to.filter((x) => x !== c) : [...draft.to, c] })}>{c}</button>)}</div>
          <InlineError>{draftErr}</InlineError>
          <div className="row wrap"><Btn variant="primary" icon={Send} onClick={publish}>Publish response</Btn><Btn variant="ghost" onClick={() => { setDraft(null); setDraftErr(''); }}>Cancel</Btn></div>
        </Modal>
      )}
    </div>
  );
}
