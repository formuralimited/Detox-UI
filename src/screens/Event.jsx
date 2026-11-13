import React, { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Check, Clock, Footprints, Lock, Map as MapIcon, MapPin, Maximize2, Play, Sparkles, Bluetooth, Flame,
} from 'lucide-react';
import { useCompanionStore, useSessionStore, entryTier, ENTRY_TIERS, celebrate, toast } from '../store.js';
import { COLLECTIBLES, GAMES, MAP } from '../fixtures.js';
import { Async, Btn, Card, InlineError, Modal, PixelArt, cx, useFixture, useInterval, useKept } from '../ui.jsx';
import GameModal from './Games.jsx';

function EventPage({ title, intro, children }) {
  return (
    <div className="page">
      <div className="page-head"><div className="stack tight"><h1>{title}</h1><p className="muted">{intro}</p></div></div>
      {children}
    </div>
  );
}
export function PassPage({ go }) {
  return <EventPage title="Your pass" intro="Your digital ticket and how to unlock an earlier entry window."><TicketTab onPlay={() => go('games')} /></EventPage>;
}
export function GamesPage({ params }) {
  return <EventPage title="Mini-games" intro="Short games of 30 seconds to 2 minutes. Each one pays Star Dust once."><GamesTab autoPlay={params.play} /></EventPage>;
}
export function MapPage({ params }) {
  return <EventPage title="Hall map" intro="Live queue times. Check in at booths to unlock collectibles."><MapTab focus={params.booth} /></EventPage>;
}
export function RewardsPage({ go }) {
  return <EventPage title="Collectibles" intro="Pixel art you unlock by checking in at booths."><CollectiblesTab go={go} onMap={() => go('map')} /></EventPage>;
}

/* ---------------- Ticket ---------------- */
function TicketTab({ onPlay }) {
  const { user, ticketId, gamesDone, survey } = useSessionStore();
  const tier = entryTier(gamesDone);
  const [big, setBig] = useState(false);
  const qr = JSON.stringify({ pass: ticketId, tier: tier.tier, window: tier.window });

  return (
    <div className="grid two">
      <div className="stack">
        <div className="card ticket" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="stack">
            <div className="row between wrap"><h2>Digital pass</h2><span className={cx('chip', tier.tier ? 'good' : '')}>{tier.label}</span></div>
            <div className="stat"><span className="small muted">Entry window</span><b className="num">{tier.window}</b></div>
            <div className="row wrap" style={{ gap: 18 }}>
              <div className="stat"><span className="xs muted">Name</span><span className="strong">{user.name}</span></div>
              <div className="stat"><span className="xs muted">Pass</span><span className="strong num">{ticketId}</span></div>
              <div className="stat"><span className="xs muted">Gate</span><span className="strong">Hall 3, Gate C</span></div>
              <div className="stat"><span className="xs muted">Faction</span><span className="strong">{survey.faction}</span></div>
            </div>
            <div><Btn icon={Maximize2} onClick={() => setBig(true)}>Show at gate</Btn></div>
          </div>
          <div className="stub"><QRCodeSVG value={qr} size={132} /></div>
        </div>

      </div>

      <Card title="Unlock earlier entry">
        <p className="small muted">Earlier windows spread arrivals so the hall stays comfortable.</p>
        <div className="list">
          {ENTRY_TIERS.map((t) => {
            const reached = tier.tier >= t.tier;
            const need = t.tier === 0 ? 'Issued with your ticket' : t.tier === 1 ? 'Pass the pre-event trivia' : `Finish 3 mini-games (${Math.min(gamesDone.length, 3)} of 3)`;
            return (
              <div key={t.tier} className="row between">
                <div>
                  <div className="strong num">{t.window} <span className="muted small">{t.label}</span></div>
                  <div className="xs muted">{need}</div>
                </div>
                {reached ? <span className="chip good"><Check size={13} aria-hidden="true" />{tier.tier === t.tier ? 'Current' : 'Passed'}</span> : <span className="chip"><Lock size={12} aria-hidden="true" />Locked</span>}
              </div>
            );
          })}
        </div>
        {tier.tier < 2 && <Btn variant="primary" icon={Play} onClick={onPlay}>Play mini-games</Btn>}
      </Card>

      {big && (
        <Modal title="Show this at Gate C" onClose={() => setBig(false)}>
          <div className="row" style={{ justifyContent: 'center' }}><div className="inset" style={{ background: '#fff' }}><QRCodeSVG value={qr} size={240} /></div></div>
          <p className="strong num" style={{ textAlign: 'center' }}>{ticketId}, entry {tier.window}</p>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Games ---------------- */
function GamesTab({ autoPlay }) {
  const { gamesDone, streak } = useSessionStore();
  const [open, setOpen] = useState(() => GAMES.find((g) => g.id === autoPlay) || null);
  return (
    <>
      <div className="row wrap">
        <span className="chip sun"><Flame size={13} aria-hidden="true" />Streak: {streak}</span>
        <span className="chip">{gamesDone.length} of {GAMES.length} completed</span>
        <span className="small muted">Each game takes 30 seconds to 2 minutes.</span>
      </div>
      <div className="grid">
        {GAMES.map((g) => {
          const done = gamesDone.includes(g.id);
          return (
            <Card key={g.id} title={g.name} action={done ? <span className="chip good"><Check size={13} aria-hidden="true" />Done</span> : <span className="chip">{g.type}</span>}>
              <p className="small muted">{g.blurb}</p>
              <div className="row between wrap">
                <div className="row small">
                  <span className="row" style={{ gap: 4 }}><Clock size={14} aria-hidden="true" />{g.secs}s</span>
                  <span className="row" style={{ gap: 4 }}><Sparkles size={14} aria-hidden="true" />{g.reward}</span>
                </div>
                <Btn size="sm" icon={Play} onClick={() => setOpen(g)} aria-label={`${done ? 'Replay' : 'Play'} ${g.name}`}>{done ? 'Replay' : 'Play'}</Btn>
              </div>
            </Card>
          );
        })}
      </div>
      {open && <GameModal game={open} onClose={() => setOpen(null)} />}
    </>
  );
}

/* ---------------- Map and booth check-in ---------------- */
const queueLevel = (q) => (q < 10 ? { key: 'good', color: '#3ddc84', label: 'Short' } : q < 25 ? { key: 'warn', color: '#ffb020', label: 'Medium' } : { key: 'crit', color: '#ff5470', label: 'Long' });
const QUEST_BONUS = 30;
const CHECKIN_REWARD = 25;

/* Stand-in for POST /api/checkins/validate. Checks booth_id and distance on the "server". */
function validateCheckin(payload, booths, already) {
  return new Promise((resolve) =>
    setTimeout(() => {
      const booth = booths.find((b) => b.booth_id === payload.booth_id);
      if (!booth) return resolve({ status: 404, ok: false, code: 'UNKNOWN_BOOTH', message: 'This booth is not on the map.' });
      const meters = Math.round(Math.hypot(payload.position.x - booth.door.x, payload.position.y - booth.door.y) * MAP.metersPerCell);
      if (already.includes(booth.id)) return resolve({ status: 409, ok: false, code: 'DUPLICATE', message: 'You already checked in here.' });
      if (meters > MAP.checkinRadiusM) return resolve({ status: 422, ok: false, code: 'TOO_FAR', distance_m: meters, message: `You are ${meters} m away. Move within ${MAP.checkinRadiusM} m of the booth to check in.` });
      return resolve({ status: 200, ok: true, distance_m: meters, collectible_id: booth.collectible, star_dust: CHECKIN_REWARD });
    }, 600)
  );
}

function MapTab({ focus }) {
  const state = useFixture('booths');
  return (
    <Async state={state} rows={5}>
      {(booths) => <HallMap booths={booths} setBooths={state.setData} focus={focus} />}
    </Async>
  );
}

function HallMap({ booths, setBooths, focus }) {
  const { checkins, addCheckin, ticketId } = useSessionStore();
  const earn = useCompanionStore((s) => s.earn);
  const [pos, setPos] = useKept('map.pos', { x: MAP.entrance.x, y: MAP.entrance.y - 0.6 });
  const [keptSel, setKeptSel] = useKept('map.sel', 'C1');
  const [sel, setSelState] = useState(focus || keptSel);
  const [error, setError] = useState('');
  const setSel = (id) => { setSelState(id); setKeptSel(id); setError(''); };
  const [busy, setBusy] = useState(false);
  const [walking, setWalking] = useState(false);
  const [log, setLog] = useKept('map.log', null);
  const raf = useRef(0);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  useInterval(() => setBooths((bs) => bs.map((b) => ({ ...b, queue: Math.max(0, Math.min(45, b.queue + ((Math.random() * 7) | 0) - 3)) }))), 4000);

  const booth = booths.find((b) => b.id === sel) || booths[0];
  const quest = useMemo(() => {
    const open = booths.filter((b) => !checkins.includes(b.id));
    return open.length ? open.reduce((a, b) => (b.queue < a.queue ? b : a)) : null;
  }, [booths, checkins]);
  const meters = Math.round(Math.hypot(pos.x - booth.door.x, pos.y - booth.door.y) * MAP.metersPerCell);
  const done = checkins.includes(booth.id);
  const level = queueLevel(booth.queue);
  const item = COLLECTIBLES.find((c) => c.id === booth.collectible);

  const walk = () => {
    const from = { ...pos }, to = booth.door, t0 = performance.now();
    setWalking(true);
    const step = (now) => {
      const t = Math.min(1, (now - t0) / 900);
      setPos({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
      if (t < 1) raf.current = requestAnimationFrame(step);
      else setWalking(false);
    };
    raf.current = requestAnimationFrame(step);
  };

  const checkIn = async () => {
    const payload = { booth_id: booth.booth_id, user_id: ticketId, position: { x: +pos.x.toFixed(2), y: +pos.y.toFixed(2) }, client_ts: new Date().toISOString() };
    setBusy(true);
    const res = await validateCheckin(payload, booths, checkins);
    setBusy(false);
    setLog({ payload, res });
    if (!res.ok) return setError(res.message);
    setError('');
    const bonus = quest && quest.id === booth.id ? QUEST_BONUS : 0;
    addCheckin(booth.id, res.collectible_id);
    earn(res.star_dust + bonus, `Check-in: ${booth.name}`);
    celebrate();
    return toast(`Checked in. ${item.name} unlocked, +${res.star_dust + bonus} Star Dust.`, 'good');
  };

  return (
    <div className="stack">
      {quest ? (
        <div className="banner" role="status">
          <MapPin size={17} aria-hidden="true" />
          <span className="grow">Quest: go to {quest.name} ({quest.id}). {quest.queue === 0 ? 'No queue' : `${quest.queue} min queue`}, the shortest in the hall. Bonus {QUEST_BONUS} Star Dust.</span>
          <Btn size="sm" onClick={() => setSel(quest.id)}>Show booth</Btn>
        </div>
      ) : <div className="banner"><Check size={17} aria-hidden="true" />You checked in at every booth.</div>}

      <div className="grid two">
        <div className="stack tight">
          <div className="map-wrap">
            <svg viewBox={`0 0 ${MAP.cols} ${MAP.rows}`} role="group" aria-label="Hall map">
              <defs>
                <pattern id="floor" width="1" height="1" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="#1b1445" /><rect width="0.5" height="0.5" fill="#211a52" /><rect x="0.5" y="0.5" width="0.5" height="0.5" fill="#211a52" /></pattern>
              </defs>
              <rect width={MAP.cols} height={MAP.rows} fill="url(#floor)" />
              <rect x="0.15" y="0.15" width={MAP.cols - 0.3} height={MAP.rows - 0.3} fill="none" stroke="#6a5be0" strokeWidth="0.3" />
              <rect x={MAP.entrance.x - 1.5} y={MAP.rows - 0.45} width="3" height="0.45" fill="#ffd23f" />
              <text x={MAP.entrance.x} y={MAP.rows - 0.75} textAnchor="middle" fontSize="0.7" fill="#ffd23f" fontWeight="700">Entrance</text>
              <rect x="15" y="1" width="4" height="4" fill="#3a2f86" stroke="#9b6bff" strokeWidth="0.12" />
              <text x="17" y="2.8" textAnchor="middle" fontSize="0.7" fill="#f4f0ff" fontWeight="700">Main</text>
              <text x="17" y="3.7" textAnchor="middle" fontSize="0.7" fill="#f4f0ff" fontWeight="700">Stage</text>
              {booths.map((b) => {
                const lv = queueLevel(b.queue), isDone = checkins.includes(b.id), isSel = b.id === sel;
                return (
                  <g key={b.id} className="map-booth" tabIndex={0} role="button" aria-label={`${b.name}, booth ${b.id}, queue ${b.queue} minutes${isDone ? ', checked in' : ''}`}
                    onClick={() => setSel(b.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSel(b.id))}>
                    <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={lv.color} stroke={isSel ? '#ffffff' : '#0d0b1e'} strokeWidth={isSel ? 0.2 : 0.1} />
                    <text x={b.x + b.w / 2} y={b.y + b.h / 2 - 0.12} textAnchor="middle" fontSize="0.95" fontWeight="800" fill="#0d0b1e">{b.id}{isDone ? ' ✓' : ''}</text>
                    <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 0.78} textAnchor="middle" fontSize="0.72" fontWeight="800" fill="#0d0b1e">{b.queue} min</text>
                    <rect x={b.door.x - 0.2} y={b.door.y - 0.2} width="0.4" height="0.4" fill="#f4f0ff" />
                  </g>
                );
              })}
              <line x1={pos.x} y1={pos.y} x2={booth.door.x} y2={booth.door.y} stroke="#ffd23f" strokeWidth="0.1" strokeDasharray="0.3 0.25" />
              <rect x={pos.x - 0.35} y={pos.y - 0.35} width="0.7" height="0.7" fill="#ff3d7f" stroke="#fff" strokeWidth="0.12" />
            </svg>
          </div>
          <div className="row wrap xs">
            <span className="chip good">Under 10 min</span><span className="chip warn">10 to 24 min</span><span className="chip crit">25 min or more</span>
            <span className="muted">Pink square is you. Tap a booth to select it. Queues update live.</span>
          </div>
        </div>

        <Card title={`${booth.id}: ${booth.name}`} action={done ? <span className="chip good"><Check size={13} aria-hidden="true" />Checked in</span> : <span className={cx('chip', level.key)}>{level.label} queue, {booth.queue} min</span>}>
          <div className="row top">
            <div className={cx('led', !done && 'locked')} style={{ width: 84 }}><PixelArt art={item.art} title={item.name} /></div>
            <div className="stack tight grow">
              <span className="small muted">{booth.kind}</span>
              <span className="strong">Reward: {item.name}</span>
              <span className="row wrap"><span className="chip">{item.rarity}</span><span className="chip sun"><Sparkles size={12} aria-hidden="true" />{CHECKIN_REWARD}{quest && quest.id === booth.id ? ` + ${QUEST_BONUS} quest bonus` : ''}</span></span>
            </div>
          </div>
          <div className="inset row between"><span className="small">Distance to booth</span><span className="strong num">{meters} m {meters <= MAP.checkinRadiusM ? '(in range)' : `(need ${MAP.checkinRadiusM} m)`}</span></div>
          <div className="row wrap">
            <Btn icon={Footprints} disabled={walking || meters === 0} onClick={() => { setError(''); walk(); }}>{walking ? 'Walking' : 'Walk to booth'}</Btn>
            <Btn variant="primary" icon={MapPin} disabled={busy || done || walking} onClick={checkIn}>{busy ? 'Validating' : done ? 'Checked in' : 'Check in'}</Btn>
          </div>
          <InlineError>{error}</InlineError>
          {log && (
            <details className="inset" open>
              <summary className="small strong" style={{ cursor: 'pointer' }}>Validator request (for developers)</summary>
              <pre className="payload">{`POST /api/checkins/validate\n${JSON.stringify(log.payload, null, 2)}\n\n${log.res.status} response\n${JSON.stringify(log.res, null, 2)}`}</pre>
            </details>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Collectibles ---------------- */
function CollectiblesTab({ go, onMap }) {
  const owned = useSessionStore((s) => s.collectibles);
  const [open, setOpen] = useState(null);
  return (
    <>
      <div className="row between wrap">
        <span className="chip">{owned.length} of {COLLECTIBLES.length} unlocked</span>
        <Btn size="sm" icon={MapIcon} onClick={onMap}>Find more on the map</Btn>
      </div>
      <div className="grid tiles">
        {COLLECTIBLES.map((c) => {
          const has = owned.includes(c.id);
          return (
            <button key={c.id} type="button" className="card" style={{ padding: 10, textAlign: 'left', cursor: 'pointer' }} onClick={() => setOpen(c)} aria-label={`${c.name}, ${c.rarity}, ${has ? 'unlocked' : 'locked'}`}>
              <div className={cx('led', !has && 'locked')}><PixelArt art={c.art} title={c.name} /></div>
              <div className="strong small">{has ? c.name : 'Locked'}</div>
              <div className="row between xs"><span className="muted">{c.rarity}</span>{!has && <Lock size={12} aria-hidden="true" />}</div>
            </button>
          );
        })}
      </div>
      {open && (
        <Modal title={owned.includes(open.id) ? open.name : 'Locked collectible'} onClose={() => setOpen(null)}>
          <div className="row top">
            <div className={cx('led', !owned.includes(open.id) && 'locked')} style={{ width: 140 }}><PixelArt art={open.art} title={open.name} /></div>
            <div className="stack grow">
              <span className="chip" style={{ alignSelf: 'flex-start' }}>{open.rarity}</span>
              {owned.includes(open.id) ? (
                <>
                  <p className="small muted">Unlocked pixel art. Send it to your LED badge over Bluetooth or wear it as a ring charm.</p>
                  <Btn variant="primary" icon={Bluetooth} onClick={() => go('ring', { art: open.id })}>Push to LED badge</Btn>
                </>
              ) : (
                <>
                  <p className="small muted">Check in at the right booth to unlock this one.</p>
                  <Btn icon={MapIcon} onClick={() => { setOpen(null); onMap(); }}>Open map</Btn>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
