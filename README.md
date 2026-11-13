# Detox App UI prototype

React 18 + Vite. All data is mock data from `src/fixtures.js`. No backend.

## Run

```
npm install
npm run dev      # local dev server
npm run build    # one self-contained dist/index.html
```

## Routes

Hash routes, each with its own navigation:

| Route | Address | Sections |
| --- | --- | --- |
| Detox app | `#home` (default), `#health`, `#community` | Home, Health (companion, chat, blocking, coach, safety), Community (discover, pairing, groups, circle) |
| Event Mode | `#event`, `#event-pass`, `#event-games`, `#event-map`, `#event-rewards`, `#event-messaging`, `#event-ring`, `#event-store` | Event home, pass, mini-games, hall map, collectibles, messaging, ring and badge, store |
| Marketing ops | `#ops` | Social listening |

The Detox app asks for sign-in, then a detox setup: purpose, habit check, measured baseline, a gradual plan and permission to limit apps. Event Mode asks the 3-question pulse check and issues the ticket.

## Detox objectives and where they live

| Objective | Where |
| --- | --- |
| Improve focus | Focus sessions (Home, Health > Focus), focus bar on every screen, pause screen for blocked apps |
| Reduce screen time | Screen time vs weekly target (Home), reduction plan chart, app limits, block schedule |
| Meaningful engagement | Instead of scrolling activities (Home), Community meetups, circle, Talk it through (Health > Coach) |
| Purpose | Detox setup purpose step, Home heading, Why you are doing this card |
| Accountability and acknowledgment | Habit check and measured baseline with acceptance tick, permission to limit apps, log of apps opened anyway shared with the circle |

## Structure

- `src/App.jsx`: routes, `AppLayout`, `BottomNav`, safety alert bar, menu
- `src/store.js`: `useCompanionStore` (theme, health points, Star Dust, persisted to local storage), `useSessionStore`, kept state, safety alerts
- `src/fixtures.js`: JSON fixtures and `fetchFixture()` (simulated API with delay)
- `src/ui.jsx`: buttons, cards, modal, chat, charts, sprites, confetti, skeletons, error boundary
- `src/screens/Home.jsx`: Detox home and Event Mode home
- `src/screens/Companion.jsx`: Health section
- `src/screens/Match.jsx`: Community section
- `src/screens/Event.jsx`, `Games.jsx`, `More.jsx`: Event Mode pages
- `src/screens/Safety.jsx`: Safety tab inside Health
- `src/screens/Ops.jsx`: social listening
- `src/screens/DetoxSetup.jsx`: detox setup flow
- `src/screens/Detox.jsx`: screen time, focus sessions, plan, activities, why card, pause screen, insights, reflection
- `src/screens/Demo.jsx`: demo controls (time passing, sensors, gate). Turn off with `DEMO_MODE = false` in `src/store.js`

The Exhibitor Portal is not part of this project. It is built separately.

## Detox assistant (AI chatbot on Home)

`src/assistant.js` picks how the assistant answers:

1. **Published artifact:** asks Claude through the page's `sample` capability. Real AI replies.
2. **Your build:** set `VITE_ASSISTANT_URL` in `.env` to your backend endpoint. It receives `{ system, messages }` and must return `{ text }`. Call OpenAI (or any model) from that server so the API key never reaches the browser.
3. **Neither:** short offline replies, labeled "Offline demo replies".

The system prompt includes the user's screen time, target, pickups, focus minutes, goals and the habits they named in setup. The assistant can start a focus session through the `start_focus_session` tool.
