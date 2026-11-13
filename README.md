# Detox App UI prototype

React 18 + Vite. All data is mock data from `src/fixtures.js`. No backend.

## Run

```
npm install
npm run dev      # local dev server
npm run build    # one self-contained dist/index.html
```

## Structure

- `src/App.jsx`: `AppLayout`, `BottomNav`, workspace switcher (Fan app, Marketing ops)
- `src/store.js`: `useCompanionStore` (theme, HP, Star Dust, persisted to local storage), `useSessionStore`
- `src/fixtures.js`: JSON fixtures and `fetchFixture()` (simulated API with delay)
- `src/ui.jsx`: buttons, cards, modal, chat, charts, sprites, confetti, skeletons, error boundary
- `src/screens/`: one file per area
- `src/screens/Demo.jsx`: demo controls (time passing, sensors, gate). Turn off with `DEMO_MODE = false` in `src/store.js`

## Where each document item lives

| Document item | Screen |
| --- | --- |
| Companion HUD, Anime/Manga and Retro Arcade toggle | Home, top bar |
| Google / Facebook sign-in, QR onboarding, 3-question pulse check | Onboarding |
| Digital ticket, dynamic entry windows | Event > Ticket |
| Mini-game suite, timers, streaks | Event > Games |
| 2D retro map, booth check-in, queue steering | Event > Map |
| Collectibles, LED badge push, smart ring, charm slots, store | Event > Collectibles, Ring and badge, Store |
| WhatsApp, WeChat, Discord chatbot with CRM log | Messaging |
| Age gate, discovery, pairing, groups | Match |
| Pet growth, HP, Star Dust, AI chat, app blocking, health coach, circle | Companion |
| Check-ins, wearable alerts, referral directory | Safety |
| Sentiment, crisis alerts, public responses | Marketing ops |

The Exhibitor Portal is not part of this project. It is built separately.
