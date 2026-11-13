import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X, Send, RefreshCw, TriangleAlert } from 'lucide-react';
import { useCompanionStore, useUiStore, useKeepStore, toast } from './store.js';
import { fetchFixture, PIXEL_PALETTE } from './fixtures.js';

export const cx = (...a) => a.filter(Boolean).join(' ');

/* ---------- hooks ---------- */
export function useInterval(fn, ms) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (ms == null) return undefined;
    const id = setInterval(() => ref.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}

export function useCountdown(seconds, running, onExpire) {
  const [left, setLeft] = useState(seconds);
  const cb = useRef(onExpire);
  cb.current = onExpire;
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => {
    if (running && left === 0) cb.current && cb.current();
  }, [left, running]);
  return [left, setLeft];
}

export function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setW(el.clientWidth);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/* useState that survives leaving a tab. Cleared on sign out. */
export function useKept(key, initial) {
  const init = useRef(undefined);
  if (init.current === undefined) init.current = typeof initial === 'function' ? initial() : initial;
  const has = useKeepStore((st) => key in st.v);
  const val = useKeepStore((st) => st.v[key]);
  const put = useKeepStore((st) => st.put);
  const set = useCallback(
    (next) => put(key, (cur, had) => (typeof next === 'function' ? next(had ? cur : init.current) : next)),
    [key, put]
  );
  return [has ? val : init.current, set];
}

/* Simulated API call with loading, error and retry. Loaded data is cached for the session,
   so edits (invites, contacts, clubs, limits) survive leaving a tab. */
export function useFixture(key) {
  const ck = 'fx:' + key;
  const cached = useKeepStore((st) => st.v[ck]);
  const put = useKeepStore((st) => st.put);
  const [st, setSt] = useState(() => ({ loading: cached === undefined, error: null }));
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n === 0 && useKeepStore.getState().v[ck] !== undefined) return undefined;
    let live = true;
    setSt({ loading: true, error: null });
    fetchFixture(key)
      .then((d) => { put(ck, () => d); if (live) setSt({ loading: false, error: null }); })
      .catch((error) => live && setSt({ loading: false, error }));
    return () => { live = false; };
  }, [key, n, ck, put]);
  const setData = useCallback((fn) => put(ck, (cur) => (typeof fn === 'function' ? fn(cur) : fn)), [ck, put]);
  return { data: st.loading ? null : cached ?? null, loading: st.loading, error: st.error, setData, reload: () => setN((x) => x + 1) };
}

/* Read or seed cached fixture data from outside a screen (the demo panel). */
export async function fixtureData(key) {
  const ck = 'fx:' + key;
  const st = useKeepStore.getState();
  if (st.v[ck] !== undefined) return st.v[ck];
  const d = await fetchFixture(key, 0);
  useKeepStore.getState().put(ck, () => d);
  return d;
}
export const patchFixture = (key, fn) => useKeepStore.getState().put('fx:' + key, (cur) => fn(cur));

/* Returns false when the browser blocks copying, so the caller can show an inline message. */
export async function copyText(text, okMsg = 'Copied') {
  try {
    await navigator.clipboard.writeText(text);
    toast(okMsg, 'good');
    return true;
  } catch {
    return false;
  }
}

/* 24-hour time picker in 30 minute steps, so times read the same everywhere. */
const SLOTS = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);
export function TimeSelect({ id, value, onChange, disabled, label, style }) {
  return (
    <select id={id} className="input num" aria-label={label} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} style={{ width: 110, ...style }}>
      {SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
    </select>
  );
}

export function InlineError({ children }) {
  if (!children) return null;
  return <span className="xs inline-error" role="alert">{children}</span>;
}

/* ---------- primitives ---------- */
export function Btn({ variant, size, block, icon: Icon, children, className, ...props }) {
  return (
    <button type="button" className={cx('btn', variant, size, block && 'block', !children && 'iconbtn', className)} {...props}>
      {Icon && <Icon size={size === 'sm' ? 15 : 17} aria-hidden="true" />}
      {children}
    </button>
  );
}

export function Card({ title, action, children, className, as: Tag = 'section', ...props }) {
  return (
    <Tag className={cx('card', className)} {...props}>
      {(title || action) && (
        <div className="card-head">
          {title && <h3>{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </Tag>
  );
}

export function Switch({ checked, onChange, label }) {
  return <button type="button" role="switch" aria-checked={!!checked} aria-label={label} className="switch" onClick={() => onChange(!checked)} />;
}

export function Seg({ value, onChange, options, scroll, label }) {
  return (
    <div className={cx('seg', scroll && 'scroll')} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.icon && <o.icon size={15} aria-hidden="true" />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Meter({ value, max = 100, tone, label }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cx('meter', tone)} role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={max}>
      <i style={{ width: pct + '%' }} />
    </div>
  );
}

export function Avatar({ name }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return <span className="avatar" aria-hidden="true">{initials}</span>;
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
export function Modal({ title, onClose, children, wide }) {
  const box = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  /* Focus moves into the dialog, Tab stays inside it, and focus returns to the opener on close. */
  useEffect(() => {
    const opener = document.activeElement;
    const items = () => [...box.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    const first = items()[0];
    if (first) first.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { close.current(); return; }
      if (e.key !== 'Tab' || !box.current) return;
      const list = items();
      if (!list.length) return;
      const a = list[0], z = list[list.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      else if (!box.current.contains(document.activeElement)) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (opener && opener.focus && document.contains(opener)) opener.focus();
    };
  }, []);
  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} className={cx('modal', wide && 'wide')} role="dialog" aria-modal="true" aria-label={title}>
        <div className="row between">
          <h2>{title}</h2>
          <Btn icon={X} size="sm" aria-label="Close" onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toasts() {
  const toasts = useUiStore((s) => s.toasts);
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => <div key={t.id} className={cx('toast', t.kind)}>{t.text}</div>)}
    </div>
  );
}

/* Confetti runs on requestAnimationFrame in a canvas, so it never blocks input. */
export function Confetti() {
  const n = useUiStore((s) => s.confetti);
  const ref = useRef(null);
  useEffect(() => {
    if (!n) return undefined;
    const canvas = ref.current;
    if (!canvas || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return undefined;
    const ctx = canvas.getContext('2d');
    const W = (canvas.width = canvas.clientWidth);
    const H = (canvas.height = canvas.clientHeight);
    const colors = ['#ff3d7f', '#ffd23f', '#3de0ff', '#3ddc84', '#9b6bff'];
    const parts = Array.from({ length: 110 }, () => ({
      x: W / 2 + (Math.random() - 0.5) * 80, y: H * 0.42, vx: (Math.random() - 0.5) * 13, vy: -Math.random() * 13 - 4,
      s: 5 + Math.random() * 6, c: colors[(Math.random() * colors.length) | 0], r: Math.random() * 6,
    }));
    let raf;
    const start = performance.now();
    const tick = (now) => {
      ctx.clearRect(0, 0, W, H);
      parts.forEach((p) => {
        p.vy += 0.42; p.x += p.vx; p.y += p.vy; p.r += 0.2;
        ctx.fillStyle = p.c;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s * (0.6 + 0.4 * Math.sin(p.r)));
      });
      if (now - start < 1900) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ctx.clearRect(0, 0, W, H); };
  }, [n]);
  return <canvas ref={ref} className="confetti" aria-hidden="true" />;
}

/* ---------- async states ---------- */
export function Skeleton({ h = 16, w = '100%' }) {
  return <div className="skeleton" style={{ height: h, width: w }} />;
}
export function Async({ state, rows = 3, children }) {
  if (state.loading) {
    return (
      <div className="stack" aria-busy="true" aria-label="Loading">
        {Array.from({ length: rows }, (_, i) => <Skeleton key={i} h={i === 0 ? 22 : 16} w={`${92 - i * 14}%`} />)}
      </div>
    );
  }
  if (state.error) {
    return (
      <div className="inset stack">
        <div className="row"><TriangleAlert size={18} aria-hidden="true" /><span className="strong">This data did not load.</span></div>
        <p className="small muted">{state.error.message}</p>
        <div><Btn size="sm" icon={RefreshCw} onClick={state.reload}>Try again</Btn></div>
      </div>
    );
  }
  return children(state.data);
}

export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidUpdate(prev) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page">
        <Card title="This screen hit an error">
          <p className="small muted wrap-any">{String(this.state.error.message || this.state.error)}</p>
          <div><Btn icon={RefreshCw} onClick={() => this.setState({ error: null })}>Reload this screen</Btn></div>
        </Card>
      </div>
    );
  }
}

/* ---------- sprites ---------- */
const PET = { k: '#0d0b1e', g: '#3ddc84', d: '#23a862', l: '#d8ffe9', w: '#ffffff', p: '#ff8fc7', y: '#ffd23f' };
const FROG = [
  '.kkkk....kkkk.', 'kwwwwk..kwwwwk', 'kwkkwkkkkwkkwk', 'kwkkwggggwkkwk', 'kggggggggggggk', 'kgpggkkkkggpgk',
  'kgggllllllgggk', '.kgllllllllgk.', 'kkggllllllggkk', 'kggk.kkkk.kggk', 'kkkk......kkkk',
];
const PIXEL_SPRITES = {
  0: ['..............', '..............', '...kkkkk......', '..kgggggk.....', '.kgwkgwkgk..k.', '.kgkkgkkggkkgk', '.kgggggggggggk', '.kgpgggpggkkgk', '..kgggggk...k.', '...kkkkk......', '..............'],
  1: ['..............', '..kkk...kkk...', '.kwwwk.kwwwk..', '.kwkwkkkwkwk..', '.kgggggggggk..', 'kggggggggggkk.', 'kgpgkkkkkgpgdk', 'kggggggggggkk.', '.kgggggggggk..', '.kgk.....kgk..', 'kkkk.....kkkk.'],
  2: FROG,
  3: ['...y..yy..y...', '...yyyyyyyy...', ...FROG],
};

function PixelGrid({ rows, palette, title }) {
  const w = Math.max(...rows.map((r) => r.length));
  return (
    <svg viewBox={`0 0 ${w} ${rows.length}`} shapeRendering="crispEdges" role="img" aria-label={title}>
      {rows.flatMap((row, y) =>
        [...row].map((ch, x) => (palette[ch] ? <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={palette[ch]} /> : null))
      )}
    </svg>
  );
}

function AnimeSprite({ stage, sad, title }) {
  const ink = '#0e0e16', body = '#5fdc97', dark = '#35b873', belly = '#eafff2';
  const s = { stroke: ink, strokeWidth: 4, strokeLinejoin: 'round', strokeLinecap: 'round' };
  const eye = (cx, cy, r) => (
    <g key={cx}>
      <circle cx={cx} cy={cy} r={r} fill="#fff" {...s} />
      {sad ? (
        <path d={`M${cx - r * 0.55} ${cy + 1} Q${cx} ${cy + r * 0.6} ${cx + r * 0.55} ${cy + 1}`} fill="none" {...s} />
      ) : (
        <>
          <circle cx={cx + 1} cy={cy + 1} r={r * 0.52} fill={ink} />
          <circle cx={cx + 3} cy={cy - 2} r={r * 0.2} fill="#fff" />
        </>
      )}
    </g>
  );
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label={title}>
      {stage === 0 ? (
        <>
          <path d="M76 62 Q104 40 114 64 Q104 90 76 72 Z" fill={dark} {...s} />
          <circle cx="52" cy="66" r="31" fill={body} {...s} />
          {eye(41, 60, 9)}{eye(63, 60, 9)}
          <circle cx="30" cy="74" r="4.5" fill="#ff8fc7" /><circle cx="74" cy="74" r="4.5" fill="#ff8fc7" />
          <path d={sad ? 'M46 80 Q52 75 58 80' : 'M46 76 Q52 82 58 76'} fill="none" {...s} />
        </>
      ) : (
        <>
          <ellipse cx="30" cy="101" rx="15" ry="8" fill={dark} {...s} />
          <ellipse cx="90" cy="101" rx="15" ry="8" fill={dark} {...s} />
          {stage === 1 && <path d="M94 80 Q116 76 113 93 Q102 97 92 90 Z" fill={dark} {...s} />}
          <ellipse cx="60" cy="72" rx="39" ry="31" fill={body} {...s} />
          <circle cx="40" cy="45" r="16" fill={body} {...s} />
          <circle cx="80" cy="45" r="16" fill={body} {...s} />
          {stage >= 2 && <ellipse cx="60" cy="84" rx="22" ry="14" fill={belly} />}
          {eye(40, 45, 10)}{eye(80, 45, 10)}
          <circle cx="32" cy="74" r="5" fill="#ff8fc7" /><circle cx="88" cy="74" r="5" fill="#ff8fc7" />
          <path d={sad ? 'M50 76 Q60 69 70 76' : 'M50 70 Q60 79 70 70'} fill="none" {...s} />
          {stage === 3 && <path d="M44 12 L52 24 L60 8 L68 24 L76 12 L74 30 L46 30 Z" fill="#ffd84d" {...s} />}
        </>
      )}
    </svg>
  );
}

function FallbackSprite() {
  return (
    <svg viewBox="0 0 12 12" role="img" aria-label="Companion sprite missing">
      <rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1" />
      <text x="6" y="8.4" textAnchor="middle" fontSize="6" fill="currentColor">?</text>
    </svg>
  );
}

/* Resolves the sprite for the active theme and stage. Missing assets fall back to a placeholder. */
export function Sprite({ stage = 0, mood = 'thriving', size, bob = true }) {
  const theme = useCompanionStore((s) => s.theme);
  const sad = mood === 'neglected' || mood === 'fainted';
  const title = `Companion, stage ${stage + 1}`;
  let art = null;
  if (theme === 'retro') {
    const rows = PIXEL_SPRITES[stage];
    if (rows) art = <PixelGrid rows={sad ? rows.map((r) => r.replace(/w/g, 'k')) : rows} palette={PET} title={title} />;
  } else if (stage >= 0 && stage <= 3) {
    art = <AnimeSprite stage={stage} sad={sad} title={title} />;
  }
  return (
    <div className={cx('sprite-stage', size === 'sm' && 'sm')}>
      <div className={cx('sprite', bob && !sad && 'bob')} style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', opacity: mood === 'fainted' ? 0.5 : 1 }}>
        {art || <FallbackSprite />}
      </div>
    </div>
  );
}

export function PixelArt({ art, title }) {
  return <PixelGrid rows={art} palette={PIXEL_PALETTE} title={title} />;
}

/* ---------- chat ---------- */
export function Chat({ messages, onSend, typing, placeholder = 'Type a message', emptyText, inputId, height }) {
  const [text, setText] = useState('');
  const [hint, setHint] = useState(false);
  const log = useRef(null);
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight; }, [messages, typing]);
  const submit = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) { setHint(true); setText(''); return; }
    setHint(false);
    onSend(t.slice(0, 600));
    setText('');
  };
  return (
    <div className="chat">
      <div className="chat-log" ref={log} style={height ? { height } : undefined}>
        {messages.length === 0 && <p className="chat-empty small">{emptyText}</p>}
        {messages.map((m) => (
          <div key={m.id} className={cx('msg', m.from === 'me' && 'me')}>
            {m.text}
            {m.meta && <span className="meta">{m.meta}</span>}
          </div>
        ))}
        {typing && <div className="msg" aria-label="Typing"><span className="dots"><i /><i /><i /></span></div>}
      </div>
      <form onSubmit={submit}>
        <input id={inputId} className={cx('input', hint && 'shake')} value={text} maxLength={600} placeholder={placeholder}
          aria-label={placeholder} onChange={(e) => { setText(e.target.value); if (hint) setHint(false); }} />
        <Btn variant="primary" icon={Send} type="submit" aria-label="Send message" />
      </form>
      {hint && <div className="hint" role="alert">Type a message first.</div>}
    </div>
  );
}

/* ---------- charts (single series, hover tooltip) ---------- */
/* Rounds an axis maximum up to a readable value (2,000, 2,500, 5,000 and so on). */
function niceStep(max, ticks = 4) {
  const raw = max / ticks, mag = 10 ** Math.floor(Math.log10(raw || 1));
  return [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
}
export function BarChart({ data, xKey, yKey, unit = '', height = 190, markIndex, markLabel, label, goal, goalLabel }) {
  const [ref, w] = useWidth();
  const [hover, setHover] = useState(null);
  const pad = { l: 44, r: 8, t: 18, b: 34 };
  const max = Math.max(...data.map((d) => d[yKey]), goal || 0);
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step || step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const iw = Math.max(0, w - pad.l - pad.r), ih = height - pad.t - pad.b;
  const band = iw / data.length;
  const bw = Math.min(28, band * 0.6);
  const y = (v) => pad.t + ih - (v / top) * ih;
  return (
    <div className="chart" ref={ref}>
      {w > 0 && (
        <svg height={height} role="img" aria-label={label}>
          {ticks.map((v) => (
            <g key={v}>
              <line x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} stroke="var(--soft-line)" strokeWidth="1" />
              <text x={pad.l - 6} y={y(v) + 4} textAnchor="end">{v.toLocaleString()}</text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = pad.l + band * i + (band - bw) / 2, h = (d[yKey] / top) * ih;
            const isMax = d[yKey] === max;
            return (
              <g key={d[xKey]} tabIndex={0} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                aria-label={`${d[xKey]}: ${d[yKey]} ${unit}`} style={{ outline: 'none' }}>
                <rect x={pad.l + band * i} y={pad.t} width={band} height={ih} fill="transparent" />
                <path d={`M${x} ${y(0)} V${y(0) - h + 4} Q${x} ${y(0) - h} ${x + 4} ${y(0) - h} H${x + bw - 4} Q${x + bw} ${y(0) - h} ${x + bw} ${y(0) - h + 4} V${y(0)} Z`}
                  fill="var(--chart)" opacity={hover == null || hover === i ? 1 : 0.55} />
                {(isMax || i === markIndex) && <text className="val" x={x + bw / 2} y={y(0) - h - 5} textAnchor="middle">{d[yKey].toLocaleString()}</text>}
                <text x={x + bw / 2} y={height - pad.b + 14} textAnchor="middle">{d[xKey]}</text>
                {i === markIndex && <text className="val" x={x + bw / 2} y={height - pad.b + 28} textAnchor="middle">{markLabel}</text>}
              </g>
            );
          })}
          {goal != null && (
            <g pointerEvents="none">
              <line x1={pad.l} x2={w - pad.r} y1={y(goal)} y2={y(goal)} stroke="var(--ink)" strokeWidth="1.5" strokeDasharray="5 4" />
              {goalLabel !== '' && <text className="val" x={w - pad.r} y={y(goal) - 5} textAnchor="end">{goalLabel || `Goal ${goal.toLocaleString()}`}</text>}
            </g>
          )}
        </svg>
      )}
      {hover != null && w > 0 && (
        <div className="tip" style={{ left: pad.l + band * hover + band / 2, top: y(data[hover][yKey]) }}>
          {data[hover][xKey]}: {data[hover][yKey].toLocaleString()} {unit}
        </div>
      )}
    </div>
  );
}

export function LineChart({ data, xKey, yKey, unit = '', height = 190, min = 0, max = 100, label }) {
  const [ref, w] = useWidth();
  const [hover, setHover] = useState(null);
  const pad = { l: 34, r: 30, t: 14, b: 24 };
  const iw = Math.max(0, w - pad.l - pad.r), ih = height - pad.t - pad.b;
  const x = (i) => pad.l + (data.length === 1 ? 0 : (iw * i) / (data.length - 1));
  const y = (v) => pad.t + ih - ((v - min) / (max - min)) * ih;
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i)} ${y(d[yKey])}`).join(' ');
  const last = data.length - 1;
  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - rect.left - pad.l) / (iw || 1)) * (data.length - 1));
    setHover(Math.max(0, Math.min(last, i)));
  };
  return (
    <div className="chart" ref={ref}>
      {w > 0 && (
        <svg height={height} role="img" aria-label={label} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
          {[min, (min + max) / 2, max].map((v) => (
            <g key={v}>
              <line x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} stroke="var(--soft-line)" strokeWidth="1" />
              <text x={pad.l - 6} y={y(v) + 4} textAnchor="end">{v}</text>
            </g>
          ))}
          <path d={`${line} L${x(last)} ${y(min)} L${x(0)} ${y(min)} Z`} fill="var(--chart)" opacity="0.14" />
          <path d={line} fill="none" stroke="var(--chart)" strokeWidth="2" strokeLinejoin="round" />
          {data.map((d, i) => (i === 0 || i === last || i === Math.floor(last / 2)) && (
            <text key={d[xKey]} x={x(i)} y={height - 6} textAnchor={i === 0 ? 'start' : i === last ? 'end' : 'middle'}>{d[xKey]}</text>
          ))}
          {hover != null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={y(min)} stroke="var(--muted)" strokeWidth="1" strokeDasharray="3 3" />}
          <circle cx={x(hover ?? last)} cy={y(data[hover ?? last][yKey])} r="5" fill="var(--chart)" stroke="var(--surface)" strokeWidth="2" />
          {hover == null && <text className="val" x={x(last) + 8} y={y(data[last][yKey]) + 4}>{data[last][yKey]}</text>}
        </svg>
      )}
      {hover != null && w > 0 && (
        <div className="tip" style={{ left: x(hover), top: y(data[hover][yKey]) }}>{data[hover][xKey]}: {data[hover][yKey]}{unit}</div>
      )}
    </div>
  );
}
