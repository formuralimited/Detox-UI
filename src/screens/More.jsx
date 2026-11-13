import React, { useState } from 'react';
import { Bluetooth, Check, Link2, Minus, Nfc, Plus, ShoppingCart, Trash2, Unlink } from 'lucide-react';
import { useSessionStore, entryTier, celebrate, toast } from '../store.js';
import { COLLECTIBLES, botAnswer } from '../fixtures.js';
import { Async, Btn, Card, Chat, Meter, Modal, PixelArt, Seg, Switch, cx, useFixture, useKept } from '../ui.jsx';

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

/* ---------------- Messaging channels and chatbot ---------------- */
const CHANNELS = [
  { id: 'whatsapp', name: 'WhatsApp', handle: '+00 5550 0142' },
  { id: 'wechat', name: 'WeChat', handle: 'alexchen_88' },
  { id: 'discord', name: 'Discord', handle: 'alexchen#2041' },
];
export function Channels() {
  const [linked, setLinked] = useKept('msg.linked', { whatsapp: true, wechat: false, discord: false });
  const [updates, setUpdates] = useKept('msg.updates', { whatsapp: true, wechat: true, discord: true });
  const [busy, setBusy] = useState(null);
  const [channel, setChannel] = useKept('msg.channel', 'whatsapp');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useKept('msg.messages', []);
  const [crm, setCrm] = useKept('msg.crm', []);
  const name = (id) => CHANNELS.find((c) => c.id === id).name;

  const link = (id) => {
    if (linked[id]) { setLinked({ ...linked, [id]: false }); return toast(`${name(id)} disconnected`); }
    setBusy(id);
    return setTimeout(() => { setLinked((l) => ({ ...l, [id]: true })); setBusy(null); setChannel(id); toast(`${name(id)} connected`, 'good'); }, 900);
  };
  const send = (text) => {
    setMessages((m) => [...m, { id: Date.now(), from: 'me', text, meta: `You on ${name(channel)}` }]);
    setTyping(true);
    setTimeout(() => {
      const reply = botAnswer(text);
      setTyping(false);
      setMessages((m) => [...m, { id: Date.now() + 1, from: 'bot', text: reply, meta: `Chatbot on ${name(channel)}. Logged to CRM.` }]);
      setCrm((c) => [{ id: Date.now(), at: now(), channel: name(channel), text, answered: !reply.startsWith('I do not have') }, ...c].slice(0, 8));
    }, 700);
  };
  const live = CHANNELS.filter((c) => linked[c.id]);
  const active = linked[channel] ? channel : live[0]?.id;

  return (
    <div className="page">
      <div className="page-head"><div className="stack tight"><h1>Messaging</h1><p className="muted">Get ticket answers and event updates on the messaging app you already use.</p></div></div>
      <div className="grid">
        {CHANNELS.map((c) => (
          <Card key={c.id} title={c.name} action={<span className={cx('chip', linked[c.id] ? 'good' : '')}>{linked[c.id] ? 'Connected' : 'Not connected'}</span>}>
            <p className="small muted">{linked[c.id] ? `Linked as ${c.handle}` : `Link ${c.name} to chat with the event assistant there.`}</p>
            {linked[c.id]
              ? <div className="row between small"><span>Ticket and queue updates</span><Switch checked={updates[c.id]} label={`${c.name} updates`} onChange={(v) => setUpdates({ ...updates, [c.id]: v })} /></div>
              : <p className="xs muted">Connect to turn on ticket and queue updates.</p>}
            <Btn icon={linked[c.id] ? Unlink : Link2} disabled={busy === c.id} onClick={() => link(c.id)}>
              {busy === c.id ? 'Connecting' : linked[c.id] ? 'Disconnect' : `Connect ${c.name}`}
            </Btn>
          </Card>
        ))}
      </div>
      <div className="grid two">
        <Card title="Try the chatbot" action={live.length > 0 && <Seg label="Channel" value={active} onChange={setChannel} options={live.map((c) => ({ value: c.id, label: c.name }))} />}>
          {live.length === 0 ? <p className="small muted">Connect a channel above to chat with the assistant.</p> : (
            <>
              <Chat inputId="channel-chat" messages={messages} typing={typing} onSend={send} placeholder="Ask about tickets, queues or hours" emptyText="Ask a question, for example: When do doors open?" />
              <div className="row wrap">{['When do doors open?', 'Where is my ticket?', 'Can I get a refund?'].map((q) => <button key={q} type="button" className="chip" onClick={() => send(q)}>{q}</button>)}</div>
            </>
          )}
        </Card>
        <Card title="CRM log" action={<span className="chip">{crm.length} entries</span>}>
          <p className="small muted">Every question is logged against the fan profile.</p>
          <div className="list">
            {crm.length === 0 && <p className="small muted">Nothing logged yet. Send a message to see an entry.</p>}
            {crm.map((e) => (
              <div key={e.id} className="stack tight small">
                <div className="row between"><span className="strong">{e.channel}</span><span className="muted num">{e.at}</span></div>
                <span className="wrap-any">{e.text}</span>
                <span><span className={cx('chip', e.answered ? 'good' : 'warn')}>{e.answered ? 'Answered by chatbot' : 'Passed to staff'}</span></span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Smart ring, charms and LED badge ---------------- */
export function Ring({ params }) {
  const { collectibles: owned, gamesDone, ticketId } = useSessionStore();
  const tier = entryTier(gamesDone);
  const mine = COLLECTIBLES.filter((c) => owned.includes(c.id));
  const [ringKept, setRingKept] = useKept('ring.state', 'off'); // off | on
  const [pairing, setPairing] = useState(false);
  const ring = pairing ? 'pairing' : ringKept;
  const [opts, setOpts] = useKept('ring.opts', { access: true, safety: true, partner: false });
  const [slots, setSlots] = useKept('ring.slots', ['c-starter', '', '']);
  const [badgeKept, setBadgeKept] = useKept('badge.state', 'off');
  const [linking, setLinking] = useState(false);
  const badge = linking ? 'linking' : badgeKept;
  const [keptPick, setKeptPick] = useKept('badge.pick', mine[0]?.id);
  const [pickState, setPickState] = useState(params.art && owned.includes(params.art) ? params.art : keptPick);
  const pick = pickState;
  const setPick = (id) => { setPickState(id); setKeptPick(id); };
  const [shown, setShown] = useKept('badge.shown', null);
  const [progress, setProgress] = useState(null);

  const pair = () => { setPairing(true); setTimeout(() => { setPairing(false); setRingKept('on'); toast('Ring paired', 'good'); }, 1200); };
  const push = () => {
    let p = 0;
    setProgress(0);
    const id = setInterval(() => {
      p += 10;
      setProgress(p);
      if (p >= 100) {
        clearInterval(id);
        setShown(pick);
        celebrate();
        toast('Pixel art sent to your badge', 'good');
        setTimeout(() => setProgress(null), 300);
      }
    }, 140);
  };
  const art = (id) => COLLECTIBLES.find((c) => c.id === id);

  return (
    <div className="page">
      <div className="page-head"><div className="stack tight"><h1>Ring and badge</h1><p className="muted">Your smart ring opens the gate and tracks your health. Your LED badge shows the pixel art you unlock.</p></div></div>
      <div className="grid two">
        <div className="stack">
          <Card title="Smart ring" action={<span className={cx('chip', ring === 'on' ? 'good' : '')}>{ring === 'on' ? 'Paired, battery 82%' : ring === 'pairing' ? 'Pairing' : 'Not paired'}</span>}>
            {ring !== 'on' ? (
              <>
                <p className="small muted">{ring === 'pairing' ? 'Hold the ring against the back of your phone.' : 'Pair your ring to use it as your event pass and health sensor.'}</p>
                <div><Btn icon={Nfc} disabled={ring === 'pairing'} onClick={pair}>{ring === 'pairing' ? 'Looking for ring' : 'Pair ring'}</Btn></div>
              </>
            ) : (
              <>
                <div className="list">
                  {[['access', 'NFC event access', `Pass ${ticketId} is stored on the ring.`], ['safety', 'Safety tracking', 'Shares heart rate and location with Safety.'], ['partner', 'Partner overrides', 'Lets an approved partner change ring settings.']].map(([k, label, hint]) => (
                    <div key={k} className="row between"><div className="grow"><div className="strong">{label}</div><div className="xs muted">{hint}</div></div><Switch checked={opts[k]} label={label} onChange={(v) => setOpts({ ...opts, [k]: v })} /></div>
                  ))}
                </div>
                <p className="small muted">{opts.access ? `Tap your ring on the gate reader to enter. Your window is ${tier.window}.` : 'Turn on NFC event access to enter with your ring.'}</p>
                <div><Btn variant="ghost" onClick={() => { setRingKept('off'); toast('Ring unpaired'); }}>Unpair</Btn></div>
              </>
            )}
          </Card>

          <Card title="Charm slots">
            <p className="small muted">Fit unlocked collectibles into the three slots on your ring.</p>
            <div className="row top" style={{ gap: 10 }}>
              {slots.map((s, i) => (
                <div key={i} className="stack tight grow">
                  <div className={cx('led', !s && 'locked')}><PixelArt art={(art(s) || COLLECTIBLES[0]).art} title={s ? art(s).name : 'Empty slot'} /></div>
                  <select className="input" aria-label={`Charm slot ${i + 1}`} value={s} onChange={(e) => setSlots(slots.map((x, j) => (j === i ? e.target.value : x)))}>
                    <option value="">Empty</option>
                    {mine.map((c) => <option key={c.id} value={c.id} disabled={slots.includes(c.id) && s !== c.id}>{c.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card title="LED display badge" action={<span className={cx('chip', badge === 'on' ? 'good' : '')}>{badge === 'on' ? 'Connected over Bluetooth' : badge === 'linking' ? 'Connecting' : 'Not connected'}</span>}>
          <div className="row top wrap" style={{ gap: 16 }}>
            <div className="stack tight" style={{ width: 150 }}>
              <div className={cx('led', !shown && 'locked')} style={{ padding: 14 }}><PixelArt art={(art(shown) || COLLECTIBLES[0]).art} title={shown ? art(shown).name : 'Badge is blank'} /></div>
              <span className="xs muted" style={{ textAlign: 'center' }}>{shown ? `Showing ${art(shown).name}` : 'Badge is blank'}</span>
            </div>
            <div className="stack grow" style={{ minWidth: 200 }}>
              <span className="small strong">Choose unlocked pixel art</span>
              <div className="row wrap">
                {mine.map((c) => (
                  <button key={c.id} type="button" className={cx('tile', pick === c.id && 'sel')} style={{ width: 56, background: '#0d0b1e', padding: 5 }} aria-pressed={pick === c.id} aria-label={c.name} onClick={() => setPick(c.id)}><PixelArt art={c.art} title={c.name} /></button>
                ))}
              </div>
              <span className="xs muted">{mine.length} of {COLLECTIBLES.length} unlocked. Check in at booths to unlock more.</span>
            </div>
          </div>
          {progress != null && <><Meter value={progress} tone="blue" label="Transfer progress" /><span className="xs muted num">Sending over Bluetooth LE, {progress}%</span></>}
          <div className="row wrap">
            {badge !== 'on' ? (
              <Btn icon={Bluetooth} disabled={badge === 'linking'} onClick={() => { setLinking(true); setTimeout(() => { setLinking(false); setBadgeKept('on'); toast('Badge connected', 'good'); }, 1000); }}>{badge === 'linking' ? 'Searching' : 'Connect badge'}</Btn>
            ) : (
              <>
                <Btn variant="primary" icon={Bluetooth} disabled={progress != null || !pick} onClick={push}>Push {art(pick)?.name} to badge</Btn>
                <Btn variant="ghost" onClick={() => { setBadgeKept('off'); toast('Badge disconnected'); }}>Disconnect</Btn>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Store ---------------- */
export function Shop() {
  const state = useFixture('products');
  const [cart, setCart] = useKept('store.cart', {});
  const [confirm, setConfirm] = useState(false);
  const [order, setOrder] = useKept('store.order', null);
  const change = (id, d) => setCart((c) => { const n = Math.max(0, (c[id] || 0) + d); const next = { ...c, [id]: n }; if (!n) delete next[id]; return next; });
  const items = (state.data || []).filter((p) => cart[p.id]);
  const total = items.reduce((a, p) => a + p.price * cart[p.id], 0);
  const count = items.reduce((a, p) => a + cart[p.id], 0);
  return (
    <div className="page">
      <div className="page-head"><div className="stack tight"><h1>Store</h1><p className="muted">Hardware and charms for your companion. Demo store, no payment is taken.</p></div></div>
      <div className="grid two">
        <Async state={state} rows={6}>
          {(products) => (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))' }}>
              {products.map((p) => (
                <Card key={p.id} title={p.name}>
                  <p className="small muted">{p.note}</p>
                  <div className="row between"><span className="stat"><b className="num">${p.price}</b></span><Btn size="sm" icon={Plus} aria-label={`Add ${p.name} to cart`} onClick={() => { change(p.id, 1); toast(`${p.name} added to cart`, 'good'); }}>Add</Btn></div>
                </Card>
              ))}
            </div>
          )}
        </Async>
        <Card title="Cart" action={<span className="chip"><ShoppingCart size={13} aria-hidden="true" />{count} items</span>}>
          <div className="list">
            {items.length === 0 && <p className="small muted">{order ? `Order ${order} placed. Your cart is empty.` : 'Your cart is empty. Add a product to start.'}</p>}
            {items.map((p) => (
              <div key={p.id} className="row between">
                <div className="grow"><div className="strong">{p.name}</div><div className="xs muted num">${p.price} each</div></div>
                <Btn size="sm" icon={cart[p.id] === 1 ? Trash2 : Minus} aria-label={`Remove one ${p.name}`} onClick={() => change(p.id, -1)} />
                <span className="num strong" style={{ minWidth: 20, textAlign: 'center' }}>{cart[p.id]}</span>
                <Btn size="sm" icon={Plus} aria-label={`Add one ${p.name}`} onClick={() => change(p.id, 1)} />
              </div>
            ))}
          </div>
          <div className="row between"><span className="strong">Total</span><span className="stat"><b className="num">${total}</b></span></div>
          <Btn variant="primary" block disabled={!items.length} onClick={() => setConfirm(true)}>Check out</Btn>
        </Card>
      </div>
      {confirm && (
        <Modal title="Confirm demo order" onClose={() => setConfirm(false)}>
          <div className="list">{items.map((p) => <div key={p.id} className="row between small"><span>{cart[p.id]} x {p.name}</span><span className="num strong">${p.price * cart[p.id]}</span></div>)}</div>
          <div className="row between"><span className="strong">Total</span><span className="num strong">${total}</span></div>
          <p className="xs muted">This is a prototype. No payment details are collected and nothing ships.</p>
          <div className="row wrap">
            <Btn variant="primary" icon={Check} onClick={() => { const id = 'ORD-' + Math.floor(1000 + Math.random() * 9000); setOrder(id); setCart({}); setConfirm(false); celebrate(); toast(`Demo order ${id} placed`, 'good'); }}>Place demo order</Btn>
            <Btn variant="ghost" onClick={() => setConfirm(false)}>Back to cart</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
