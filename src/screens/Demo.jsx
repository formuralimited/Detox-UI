import React, { useState } from 'react';
import { Clock, Footprints, Moon, Nfc, RotateCcw, ScanLine, Smartphone, Sun, Timer, UserCheck, Zap } from 'lucide-react';
import {
  useCompanionStore, useSessionStore, useKeepStore, useSafetyStore, useInterceptStore, stageForDays, entryTier, celebrate, toast,
} from '../store.js';
import { Btn, Modal, Seg, cx, fixtureData, patchFixture } from '../ui.jsx';

const SCAN_TIMES = ['10:15', '11:15', '12:15'];

/* One place for every prototype-only control, so user screens stay clean.
   Hidden when DEMO_MODE is false. */
export default function DemoPanel({ onClose, go }) {
  const { steps, addSteps, advanceDay, detoxDays } = useCompanionStore();
  const { user, gamesDone } = useSessionStore();
  const tier = entryTier(gamesDone);
  const { pending, trigger } = useSafetyStore();
  const ringOn = useKeepStore((s) => s.v['ring.state'] === 'on');
  const ringAccess = useKeepStore((s) => (s.v['ring.opts'] ? s.v['ring.opts'].access : true));
  const [scanAt, setScanAt] = useState('11:15');
  const [scan, setScan] = useState(null);
  const [tap, setTap] = useState(null);
  const [circleMsg, setCircleMsg] = useState('');

  const endDay = (met) => {
    const before = stageForDays(detoxDays).id;
    advanceDay(met);
    const after = stageForDays(useCompanionStore.getState().detoxDays);
    if (after.id > before) { celebrate(); toast(`Your companion evolved into a ${after.name}.`, 'good'); }
    else toast(met ? 'Day complete. Goals paid out, +1 detox day, +6 health points.' : 'Goals missed. Your companion lost 22 health points.', met ? 'good' : 'bad');
  };
  const walk = () => {
    const completed = addSteps(2000);
    toast(completed ? 'Step goal reached. +25 Star Dust.' : '+2,000 steps synced from the ring', 'good');
  };
  const runScan = () => {
    const opens = tier.window.slice(0, 5);
    const ok = scanAt >= opens;
    setScan({ ok, text: ok ? `Valid pass. ${user.name} may enter. Window opened at ${opens}.` : `Too early. This pass opens at ${opens}.` });
  };
  const tapRing = () => {
    if (!ringOn) return setTap({ ok: false, text: 'No ring paired. Pair it in Event Mode under Ring and badge first.' });
    return setTap(ringAccess ? { ok: true, text: `Gate accepted the ring. Entry ${tier.window}.` } : { ok: false, text: 'Gate refused the ring. NFC event access is off.' });
  };
  const acceptInvites = async () => {
    const list = await fixtureData('circle');
    const pendingOnes = list.filter((m) => m.status === 'pending');
    if (!pendingOnes.length) return setCircleMsg('No invites are pending.');
    patchFixture('circle', (l) => l.map((m) => (m.status === 'pending' ? { ...m, status: 'active' } : m)));
    return setCircleMsg(`${pendingOnes.map((m) => m.name).join(', ')} joined your circle.`);
  };
  const safety = (type) => { trigger(type); onClose(); };

  return (
    <Modal title="Demo controls" onClose={onClose} wide>
      <p className="small muted">These controls stand in for time passing, sensors and gate hardware. They are not part of the app users see.</p>

      <div className="stack demo-section">
        <h3>Companion and goals</h3>
        <p className="small muted">Steps today: <b className="num">{steps.toLocaleString()}</b>. Day {detoxDays}.</p>
        <div className="row wrap">
          <Btn icon={Footprints} onClick={walk}>Sync 2,000 steps</Btn>
          <Btn icon={Sun} onClick={() => endDay(true)}>End day, goals met</Btn>
          <Btn icon={Moon} onClick={() => endDay(false)}>End day, goals missed</Btn>
        </div>
      </div>

      <div className="stack demo-section">
        <h3>Phone use</h3>
        <p className="small muted">Shows what happens when the user opens a limited app.</p>
        <div className="row wrap">
          <Btn icon={Smartphone} onClick={() => { onClose(); useInterceptStore.getState().open('Instagram'); }}>Try to open Instagram</Btn>
          <Btn icon={Clock} onClick={() => { useCompanionStore.setState((s) => ({ screenMin: s.screenMin + 30, pickups: s.pickups + 6 })); toast('+30 min screen time recorded'); }}>Add 30 min screen time</Btn>
          <Btn icon={Timer} disabled={!useCompanionStore.getState().focusEndsAt} onClick={() => { useCompanionStore.setState({ focusEndsAt: Date.now() + 3000 }); onClose(); }}>Finish focus session now</Btn>
        </div>
      </div>

      <div className="stack demo-section">
        <h3>Event gate</h3>
        <div className="row wrap">
          <span className="small strong">Scan time</span>
          <Seg label="Scan time" value={scanAt} onChange={(v) => { setScanAt(v); setScan(null); }} options={SCAN_TIMES.map((t) => ({ value: t, label: t }))} />
          <Btn icon={ScanLine} onClick={runScan}>Scan pass</Btn>
          <Btn icon={Nfc} onClick={tapRing}>Tap ring at gate</Btn>
        </div>
        {scan && <div className={cx('banner', !scan.ok && 'crit')} role="status">{scan.text}</div>}
        {tap && <div className={cx('banner', !tap.ok && 'crit')} role="status">{tap.text}</div>}
      </div>

      <div className="stack demo-section">
        <h3>Safety sensors</h3>
        <p className="small muted">Starts the 10 second countdown shown at the top of every screen.</p>
        <div className="row wrap">
          <Btn icon={Zap} disabled={!!pending} onClick={() => safety('hr')}>Simulate high heart rate</Btn>
          <Btn icon={Zap} disabled={!!pending} onClick={() => safety('idle')}>Simulate inactivity</Btn>
        </div>
      </div>

      <div className="stack demo-section">
        <h3>Other people</h3>
        <div className="row wrap">
          <Btn icon={UserCheck} onClick={acceptInvites}>Accept pending circle invites</Btn>
          <Btn icon={RotateCcw} onClick={() => { const k = useKeepStore.getState(); k.drop('match.me'); k.drop('match.blocked'); toast('Community age check reset'); onClose(); go('community', { tab: 'discover' }); }}>Reset Community age check</Btn>
        </div>
        {circleMsg && <p className="small strong" role="status">{circleMsg}</p>}
      </div>
    </Modal>
  );
}
