# CrisisSignal AI

Fullstack AI crisis agent for real-time signals, risk scoring, crisis maps, auto timelines, action recommendations, generated statements, collaboration, and audit trails.

## Nama Repo

`crisis-signal-ai`

## Deskripsi GitHub

Fullstack AI crisis agent for real-time signals, risk scoring, crisis maps, auto timelines, action recommendations, generated statements, collaboration, and audit trails.

## Fitur

- Real-time monitoring simulation dari berita, RSS, X/Twitter, TikTok, weather API, laporan warga, dan komunitas.
- Backend Express API dengan JSON database lokal di `server/data/crisis-db.json`.
- AI-style crisis engine untuk clustering sinyal, risk scoring, risk level, recommendation, statement generator, timeline, dan audit trail.
- Crisis map interaktif, signal intake form, team collaboration room, dan reset demo.
- Ringkasan situasi untuk siklus update 15 menit.
- Minimal + brutalism clean UI, dark/light theme, responsive layout, dan Framer Motion.
- Scroll animation frame-by-frame dengan 320 image individual di `public/crisis-frames`.
- Logo generated di `public/brand/crisis-signal-logo.png`.
- `@21st-dev/magic` dari 21st.dev sudah terpasang.

## Stack

- React + TypeScript + Vite
- Express + JSON database
- Framer Motion
- Lucide React
- 21st.dev Magic MCP package

## Command

```bash
npm install
npm run dev
npm run build
npm run lint
npm run start
```

`npm run dev` menjalankan frontend Vite dan backend Express bersamaan.

## API

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/signals`
- `GET /api/situations/:id`
- `POST /api/ingest`
- `POST /api/reset-demo`

## GitHub Topics

`crisis-management`, `risk-intelligence`, `situational-awareness`, `disaster-response`, `brand-safety`, `social-listening`, `express`, `react`, `typescript`, `framer-motion`
