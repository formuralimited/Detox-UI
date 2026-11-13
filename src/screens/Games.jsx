import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Clock, Play, RotateCcw, Sparkles, Users, X } from 'lucide-react';
import { useCompanionStore, useSessionStore, celebrate } from '../store.js';
import { TRIVIA, POLL } from '../fixtures.js';
import { Btn, Meter, Modal, cx, useCountdown, useInterval } from '../ui.jsx';

/* ---------- Trivia ---------- */
function Trivia({ onEnd }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const q = TRIVIA[i];
  const pick = (idx) => {
    if (picked != null) return;
    setPicked(idx);
    const s = score + (idx === q.answer ? 1 : 0);
    setScore(s);
    setTimeout(() => {
      if (i + 1 < TRIVIA.length) { setI(i + 1); setPicked(null); }
      else onEnd(s >= 2, `${s} of ${TRIVIA.length} correct`);
    }, 750);
  };
  return (
    <div className="stack">
      <p className="small muted">Question {i + 1} of {TRIVIA.length}</p>
      <h3>{q.q}</h3>
      <div className="stack tight">
        {q.options.map((o, idx) => (
          <Btn key={o} block className="option" variant={picked != null && idx === q.answer ? 'primary' : picked === idx ? 'danger' : undefined}
            icon={picked != null && idx === q.answer ? Check : picked === idx ? X : undefined} onClick={() => pick(idx)}>{o}</Btn>
        ))}
      </div>
    </div>
  );
}

/* ---------- Spot the difference ---------- */
const SHAPES = ['circle', 'square', 'triangle', 'diamond'];
const COLORS = ['#ff3d7f', '#2f7bff', '#ffd23f', '#3ddc84', '#9b6bff'];
function Shape({ kind, color }) {
  return (
    <svg className="shape" viewBox="0 0 10 10" aria-hidden="true">
      {kind === 'circle' && <circle cx="5" cy="5" r="4.5" fill={color} />}
      {kind === 'square' && <rect x="1" y="1" width="8" height="8" fill={color} />}
      {kind === 'triangle' && <path d="M5 0.5 L9.5 9.5 H0.5 Z" fill={color} />}
      {kind === 'diamond' && <path d="M5 0 L10 5 L5 10 L0 5 Z" fill={color} />}
    </svg>
  );
}
function SpotDiff({ onEnd, penalize }) {
  const { base, changed, diffs } = useMemo(() => {
    const b = Array.from({ length: 16 }, () => ({ kind: SHAPES[(Math.random() * 4) | 0], color: COLORS[(Math.random() * 5) | 0] }));
    const idx = [...b.keys()].sort(() => Math.random() - 0.5).slice(0, 3);
    const c = b.map((cell, i) => {
      if (!idx.includes(i)) return cell;
      return i % 2
        ? { ...cell, color: COLORS[(COLORS.indexOf(cell.color) + 2) % 5] }
        : { ...cell, kind: SHAPES[(SHAPES.indexOf(cell.kind) + 1) % 4] };
    });
    return { base: b, changed: c, diffs: idx };
  }, []);
  const [found, setFound] = useState([]);
  const [miss, setMiss] = useState(null);
  const tap = (i) => {
    if (found.includes(i)) return;
    if (diffs.includes(i)) {
      const f = [...found, i];
      setFound(f);
      setMiss(null);
      if (f.length === diffs.length) setTimeout(() => onEnd(true, 'All three found'), 350);
    } else { setMiss(i); penalize(3); }
  };
  const grid = (cells, interactive) => (
    <div className="game-grid grow" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
      {cells.map((c, i) =>
        interactive ? (
          <button key={i} type="button" className={cx('tile', found.includes(i) && 'found', miss === i && 'shake')} aria-label={`Cell ${i + 1}: ${c.kind}`} onClick={() => tap(i)}><Shape {...c} /></button>
        ) : (
          <div key={i} className="tile"><Shape {...c} /></div>
        )
      )}
    </div>
  );
  return (
    <div className="stack">
      <p className="small"><b>{found.length} of 3 found.</b> Tap the changed cells in the right panel. {miss != null && <span style={{ color: 'var(--crit)' }}>Not that one. 3 seconds lost.</span>}</p>
      <div className="row top" style={{ gap: 14 }}>{grid(base, false)}{grid(changed, true)}</div>
      <div className="row small muted" style={{ gap: 14 }}><span className="grow">Original</span><span className="grow">Find the changes here</span></div>
    </div>
  );
}

/* ---------- Jigsaw tiles ---------- */
const PICTURE = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 90 90'><rect width='90' height='90' fill='#2f7bff'/><rect y='0' width='90' height='22' fill='#9b6bff'/><rect y='22' width='90' height='16' fill='#ff8fc7'/><circle cx='64' cy='30' r='15' fill='#ffd23f'/><path d='M0 70 L24 36 L44 62 L60 44 L90 76 V90 H0 Z' fill='#130d30'/><path d='M0 78 L18 60 L36 78 L56 64 L90 84 V90 H0 Z' fill='#3ddc84'/><rect x='8' y='8' width='10' height='4' fill='#fff'/><rect x='30' y='14' width='14' height='4' fill='#fff'/></svg>`
)}")`;
function Jigsaw({ onEnd }) {
  const [order, setOrder] = useState(() => {
    let o;
    do { o = [...Array(9).keys()].sort(() => Math.random() - 0.5); } while (o.every((v, i) => v === i));
    return o;
  });
  const [sel, setSel] = useState(null);
  const tap = (i) => {
    if (sel == null) return setSel(i);
    if (sel === i) return setSel(null);
    const o = [...order];
    [o[sel], o[i]] = [o[i], o[sel]];
    setOrder(o);
    setSel(null);
    if (o.every((v, idx) => v === idx)) setTimeout(() => onEnd(true, 'Picture rebuilt'), 350);
    return undefined;
  };
  const style = (piece) => ({ backgroundImage: PICTURE, backgroundSize: '300% 300%', backgroundPosition: `${(piece % 3) * 50}% ${Math.floor(piece / 3) * 50}%` });
  const placed = order.filter((v, i) => v === i).length;
  return (
    <div className="stack">
      <p className="small"><b>{placed} of 9 in place.</b> Tap one tile, then another, to swap them.</p>
      <div className="row top wrap" style={{ gap: 14 }}>
        <div className="game-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', width: 'min(100%, 300px)' }}>
          {order.map((piece, i) => (
            <button key={i} type="button" className={cx('tile', sel === i && 'sel')} style={style(piece)} aria-label={`Position ${i + 1}, piece ${piece + 1}`} onClick={() => tap(i)} />
          ))}
        </div>
        <div className="stack tight">
          <span className="small muted">Target picture</span>
          <div className="tile" style={{ width: 96, backgroundImage: PICTURE, backgroundSize: 'cover' }} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Squad rally ---------- */
const MATES = ['Hana', 'Marcus', 'Sofia'];
const SQUAD_GOAL = 150;
function Squad({ onEnd }) {
  const faction = useSessionStore((s) => s.survey?.faction) || 'Heroes';
  const [mine, setMine] = useState(0);
  const [mates, setMates] = useState([0, 0, 0]);
  const total = mine + mates.reduce((a, b) => a + b, 0);
  const [done, setDone] = useState(false);
  useInterval(() => setMates((m) => m.map((v) => v + ((Math.random() * 3) | 0))), done ? null : 450);
  useEffect(() => {
    if (!done && total >= SQUAD_GOAL) { setDone(true); onEnd(true, `Squad reached ${SQUAD_GOAL}. You added ${mine}.`); }
  }, [total, done, mine, onEnd]);
  return (
    <div className="stack">
      <p className="small"><Users size={14} aria-hidden="true" /> <b>{faction} squad.</b> Reach {SQUAD_GOAL} taps together before time runs out.</p>
      <Meter value={total} max={SQUAD_GOAL} tone="accent" label="Squad progress" />
      <div className="row between small"><span className="num strong">{Math.min(total, SQUAD_GOAL)} / {SQUAD_GOAL}</span><span className="muted">You: {mine}</span></div>
      <Btn block variant="primary" style={{ minHeight: 84, fontSize: 'var(--fs-lg)' }} onClick={() => setMine((v) => v + 1)}>Tap to rally</Btn>
      <div className="row wrap small">{MATES.map((n, i) => <span key={n} className="chip">{n}: {mates[i]}</span>)}</div>
    </div>
  );
}

/* ---------- Sponsor poll ---------- */
function Poll({ onEnd }) {
  const [vote, setVote] = useState(null);
  const options = POLL.options.map((o) => ({ ...o, votes: o.votes + (o.id === vote ? 1 : 0) }));
  const total = options.reduce((a, o) => a + o.votes, 0);
  return (
    <div className="stack">
      <p className="small muted">Asked by {POLL.sponsor}</p>
      <h3>{POLL.q}</h3>
      {vote == null ? (
        <div className="stack tight">{options.map((o) => <Btn key={o.id} block className="option" onClick={() => setVote(o.id)}>{o.label}</Btn>)}</div>
      ) : (
        <div className="stack">
          {options.map((o) => (
            <div key={o.id} className="stack tight">
              <div className="row between small"><span className="strong">{o.label}{o.id === vote ? ' (your vote)' : ''}</span><span className="num">{Math.round((o.votes / total) * 100)}%, {o.votes} votes</span></div>
              <Meter value={o.votes} max={total} tone={o.id === vote ? 'accent' : 'blue'} label={o.label} />
            </div>
          ))}
          <Btn variant="primary" onClick={() => onEnd(true, 'Vote counted')}>Collect reward</Btn>
        </div>
      )}
    </div>
  );
}

/* ---------- Creative prompt ---------- */
function Prompt({ onEnd }) {
  const [text, setText] = useState('');
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const ok = words >= 2 && words <= 12;
  return (
    <div className="stack">
      <h3>Write a tagline for the event mascot in 12 words or fewer</h3>
      <label className="field" htmlFor="tagline">Your tagline
        <textarea id="tagline" className="input" value={text} maxLength={140} onChange={(e) => setText(e.target.value)} placeholder="Small frog, big adventure" />
      </label>
      <div className="row between small">
        <span className={words > 12 ? '' : 'muted'} style={words > 12 ? { color: 'var(--crit)' } : undefined}>{words} of 12 words{words > 12 ? '. Cut a few.' : ''}</span>
        <Btn variant="primary" disabled={!ok} onClick={() => onEnd(true, 'Sent to the sponsor wall')}>Submit tagline</Btn>
      </div>
    </div>
  );
}

const PLAYERS = { trivia: Trivia, spot: SpotDiff, jigsaw: Jigsaw, squad: Squad, poll: Poll, prompt: Prompt };

export default function GameModal({ game, onClose }) {
  const earn = useCompanionStore((s) => s.earn);
  const { gamesDone, finishGame } = useSessionStore();
  const [phase, setPhase] = useState('intro'); // intro | play | result
  const [result, setResult] = useState(null);
  const [round, setRound] = useState(0);
  const first = !gamesDone.includes(game.id);

  const ended = useRef(false);
  const end = (won, detail) => {
    if (ended.current) return;
    ended.current = true;
    const paid = won && !useSessionStore.getState().gamesDone.includes(game.id);
    finishGame(game.id, won);
    if (paid) earn(game.reward, `Mini-game: ${game.name}`);
    if (won) celebrate();
    setResult({ won, detail, paid });
    setPhase('result');
  };
  const [left, setLeft] = useCountdown(game.secs, phase === 'play', () => end(false, 'Time ran out'));
  const start = () => { ended.current = false; setLeft(game.secs); setRound((r) => r + 1); setResult(null); setPhase('play'); };
  const Player = PLAYERS[game.id];

  return (
    <Modal title={game.name} onClose={onClose} wide={game.id === 'spot'}>
      {phase === 'intro' && (
        <div className="stack">
          <p>{game.blurb}</p>
          <div className="row wrap">
            <span className="chip"><Clock size={13} aria-hidden="true" />{game.secs} seconds</span>
            <span className="chip sun"><Sparkles size={13} aria-hidden="true" />{game.reward} Star Dust</span>
            {!first && <span className="chip good">Already completed</span>}
          </div>
          {!first && <p className="small muted">Replays are for fun. The reward pays once.</p>}
          <Btn variant="primary" icon={Play} onClick={start}>Start</Btn>
        </div>
      )}
      {phase === 'play' && (
        <div className="stack">
          <div className="row between">
            <span className="chip">{game.type}</span>
            <span className={cx('timer num', left <= 10 && 'shake')} style={left <= 10 ? { color: 'var(--crit)' } : undefined} aria-label={`${left} seconds left`}>0:{String(left).padStart(2, '0')}</span>
          </div>
          <Meter value={left} max={game.secs} tone={left <= 10 ? 'crit' : 'blue'} label="Time left" />
          <Player key={round} onEnd={end} penalize={(s) => setLeft((l) => Math.max(0, l - s))} />
        </div>
      )}
      {phase === 'result' && result && (
        <div className="stack">
          <h3>{result.won ? 'Nice work' : 'Not this time'}</h3>
          <p>{result.detail}.</p>
          {result.won && result.paid && <div className="banner"><Sparkles size={16} aria-hidden="true" />+{game.reward} Star Dust added.{game.id === 'trivia' && ' Your entry window moved earlier.'}</div>}
          {result.won && !result.paid && <p className="small muted">You already collected this reward.</p>}
          <div className="row wrap">
            <Btn icon={RotateCcw} onClick={start}>Play again</Btn>
            <Btn variant="primary" onClick={onClose}>Done</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}
