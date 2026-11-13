import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GOALS } from './fixtures.js';

/* Turns the demo control panel on. Set to false for a build without demo controls. */
export const DEMO_MODE = true;

/* localStorage can be missing or throw (private mode, sandboxed frames).
   Fall back to memory so the app still works. */
const mem = {};
export const safeStorage = {
  getItem: (k) => {
    try { return window.localStorage.getItem(k); } catch { return mem[k] ?? null; }
  },
  setItem: (k, v) => {
    try { window.localStorage.setItem(k, v); } catch { mem[k] = v; }
  },
  removeItem: (k) => {
    try { window.localStorage.removeItem(k); } catch { delete mem[k]; }
  },
};
const storage = createJSONStorage(() => safeStorage);

export const THEME_OPTIONS = [
  { value: 'anime', label: 'Anime/Manga' },
  { value: 'retro', label: 'Retro Arcade' },
];

export const STAGES = [
  { id: 0, name: 'Tadpole', fromDay: 0 },
  { id: 1, name: 'Froglet', fromDay: 3 },
  { id: 2, name: 'Frog', fromDay: 7 },
  { id: 3, name: 'Guardian', fromDay: 14 },
];
export const stageForDays = (d) => [...STAGES].reverse().find((s) => d >= s.fromDay) || STAGES[0];
export const nextStage = (d) => STAGES.find((s) => s.fromDay > d) || null;
export const hpState = (hp) =>
  hp >= 70 ? { key: 'thriving', label: 'Thriving' } :
  hp >= 40 ? { key: 'hungry', label: 'Hungry' } :
  hp > 0 ? { key: 'neglected', label: 'Neglected' } : { key: 'fainted', label: 'Fainted' };

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const stamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

const companionDefaults = {
  theme: 'anime', // 'anime' | 'retro'
  hp: 72,
  starDust: 120,
  detoxDays: 5,
  goalsDone: [],
  steps: 4380, // measured by the ring
  socialMin: 93, // minutes in social apps today
  socialLimit: 120,
  blockedOpens: 0, // times a blocked app was opened before 18:00
  ledger: [{ id: 1, label: 'Welcome bonus', amount: 120, at: '09:00' }],
};

/* Companion store. The selected theme persists across reloads. */
export const useCompanionStore = create(
  persist(
    (set, get) => ({
      ...companionDefaults,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'anime' ? 'retro' : 'anime' }),
      earn: (amount, label) =>
        set((s) => ({
          starDust: s.starDust + amount,
          ledger: [{ id: Date.now() + Math.random(), label, amount, at: stamp() }, ...s.ledger].slice(0, 30),
        })),
      spend: (amount, label) => {
        if (get().starDust < amount) return false;
        set((s) => ({
          starDust: s.starDust - amount,
          ledger: [{ id: Date.now() + Math.random(), label, amount: -amount, at: stamp() }, ...s.ledger].slice(0, 30),
        }));
        return true;
      },
      heal: (n) => set((s) => ({ hp: clamp(s.hp + n) })),
      completeGoal: (goal) => {
        if (get().goalsDone.includes(goal.id)) return;
        set((s) => ({ goalsDone: [...s.goalsDone, goal.id], hp: clamp(s.hp + goal.hp) }));
        get().earn(goal.reward, `Goal: ${goal.label}`);
      },
      /* Steps come from the ring. The step goal completes on its own when reached. */
      addSteps: (n) => {
        set((s) => ({ steps: s.steps + n }));
        const goal = GOALS.find((g) => g.id === 'g-steps');
        if (get().steps >= 6000 && !get().goalsDone.includes(goal.id)) { get().completeGoal(goal); return true; }
        return false;
      },
      /* End of day: if goals were met, the remaining measured goals pay out, then a new day starts. */
      advanceDay: (metGoals) => {
        if (metGoals) GOALS.forEach((g) => get().completeGoal(g));
        set((s) => ({
          detoxDays: metGoals ? s.detoxDays + 1 : s.detoxDays,
          hp: clamp(s.hp + (metGoals ? 6 : -22)),
          goalsDone: [],
          steps: 0,
          socialMin: 0,
          blockedOpens: 0,
        }));
      },
      resetCompanion: () => set({ ...companionDefaults, theme: get().theme }),
    }),
    { name: 'detox-companion', storage, version: 1 }
  )
);

const sessionDefaults = {
  user: null, // { name, email, provider }
  survey: null, // { faction, style, collectible }
  ticketId: null,
  gamesDone: [],
  streak: 0,
  checkins: [], // booth ids
  collectibles: ['c-starter'],
  squad: null,
};

export const useSessionStore = create(
  persist(
    (set, get) => ({
      ...sessionDefaults,
      signIn: (user) => set({ user }),
      completeSurvey: (survey) =>
        set({ survey, ticketId: 'DTX-' + Math.random().toString(36).slice(2, 8).toUpperCase() }),
      finishGame: (id, won) =>
        set((s) => ({
          gamesDone: won && !s.gamesDone.includes(id) ? [...s.gamesDone, id] : s.gamesDone,
          streak: won ? s.streak + 1 : 0,
        })),
      addCheckin: (boothId, collectibleId) =>
        set((s) => ({
          checkins: s.checkins.includes(boothId) ? s.checkins : [...s.checkins, boothId],
          collectibles: s.collectibles.includes(collectibleId) ? s.collectibles : [...s.collectibles, collectibleId],
        })),
      setSquad: (squad) => set({ squad }),
      resetSession: () => set({ ...sessionDefaults }),
    }),
    { name: 'detox-session', storage, version: 1 }
  )
);

/* Entry window gets earlier as fans finish pre-event trivia and mini-games. */
export const ENTRY_TIERS = [
  { tier: 0, window: '12:00 to 13:00', label: 'Standard entry' },
  { tier: 1, window: '11:00 to 12:00', label: 'Early entry' },
  { tier: 2, window: '10:00 to 11:00', label: 'First entry' },
];
export const entryTier = (gamesDone) =>
  ENTRY_TIERS[gamesDone.length >= 3 ? 2 : gamesDone.includes('trivia') ? 1 : 0];

/* State that should survive leaving a tab (form progress, chat, map position, edited fixture data).
   Kept in memory for the session and cleared on sign out. */
export const useKeepStore = create((set) => ({
  v: {},
  put: (k, updater) => set((s) => ({ v: { ...s.v, [k]: updater(s.v[k], k in s.v) } })),
  drop: (k) => set((s) => { const v = { ...s.v }; delete v[k]; return { v }; }),
  clear: () => set({ v: {} }),
}));

/* Safety alerts live at app level so the countdown shows on every screen. */
export const useSafetyStore = create((set) => ({
  pending: null, // { type, reason }
  alerts: [],
  hrLimit: 120,
  idleMin: 30,
  setLimit: (k, v) => set({ [k]: v }),
  trigger: (type) =>
    set((s) => ({
      pending: type === 'hr'
        ? { type, reason: `Heart rate 142 bpm, above your ${s.hrLimit} bpm limit` }
        : { type, reason: `No movement or check-in for ${s.idleMin} minutes` },
    })),
  cancel: () => set({ pending: null }),
  dispatch: (who) =>
    set((s) => ({
      pending: null,
      alerts: [{ id: Date.now(), at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }), reason: s.pending ? s.pending.reason : 'Alert', who }, ...s.alerts],
    })),
  reset: () => set({ pending: null, alerts: [], hrLimit: 120, idleMin: 30 }),
}));

/* Toasts and confetti are transient, so they are not persisted. */
export const useUiStore = create((set) => ({
  toasts: [],
  confetti: 0,
  toast: (text, kind = 'info') => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { id, text, kind }].slice(-3) }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200);
  },
  celebrate: () => set((s) => ({ confetti: s.confetti + 1 })),
}));
export const toast = (text, kind) => useUiStore.getState().toast(text, kind);
export const celebrate = () => useUiStore.getState().celebrate();
