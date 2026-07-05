# CrisisSignal AI

Fullstack crisis operating system for learning, portfolio, and product-design practice. CrisisSignal AI simulates how an AI-assisted command center monitors early crisis signals, scores risk, coordinates response work, reviews public statements, and exports incident reports.

> Portfolio note: this repository is a public education/self-learning project. Real production connectors, private API keys, internal datasets, and deployment secrets are intentionally not included.

## Concept

CrisisSignal AI is built around one operational idea: organizations should not wait until a crisis becomes viral before they act. The system turns scattered signals into an incident workspace with risk score, lifecycle status, SLA pressure, evidence review, team workflow, communication approval, and audit trail.

Core operating flow:

```text
Signal intake -> Risk scoring -> Incident lifecycle -> War room readiness -> Team workflow -> Statement approval -> Report export
```

## UI/UX Direction

- Minimal brutalism interface with strong borders, sharp hierarchy, dark/light theme, and compact command-center density.
- Interactive motion using Framer Motion: hero entry, risk orbit, cursor field, command palette, drawer transitions, map pin pulse, and scroll-driven frame animation.
- Operator-first UX: fast scan metrics, active incident cards, war room readiness, lifecycle/SLA card, command palette with Ctrl+K, and action-oriented panels.
- Multilingual interface: Indonesian and English as primary languages, with additional Melayu, Japanese, and Arabic interface options.
- Responsive dashboard layout for desktop and mobile command workflows.

## Repository

`crisis-signal-ai`

## GitHub Description

Fullstack AI crisis command center with real-time monitoring simulation, risk scoring, incident lifecycle, SLA pressure, approval workflow, live feed, PDF reports, Prisma SQLite, multilingual UI, and animated React dashboard.

## Stack Badges

### Programming Languages

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-111111?style=for-the-badge&logo=javascript&logoColor=F7DF1E)
![SQL](https://img.shields.io/badge/SQL-336791?style=for-the-badge&logo=sqlite&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)

### Frontend

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide_React-111111?style=for-the-badge&logo=lucide&logoColor=white)

### Backend & Database

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-111111?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![PDFKit](https://img.shields.io/badge/PDFKit-FF3B30?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)

## Core Features

- Real-time crisis monitoring simulation from news, RSS, X/Twitter, TikTok, weather, citizen reports, and community signals.
- AI-style risk engine for signal clustering, risk score, score breakdown, escalation level, recommendation, timeline, and audit reasoning.
- Incident lifecycle: `new`, `triaging`, `verified`, `responding`, `monitoring`, and `resolved` model support.
- SLA engine with deadline, elapsed time, remaining minutes, pressure, and healthy/watch/urgent/breached state.
- Crisis war room with readiness score, evidence health, team readiness, approval blockers, fresh events, and next operational move.
- Command palette with Ctrl+K for opening sections, running scenarios, exporting reports, resetting demo data, and jumping to incidents.
- Role-based demo session for Admin, Analyst, Comms, Field Verifier, and Viewer.
- Statement approval workflow: review, approved, published, rejected.
- Live command feed powered by backend events.
- Scenario simulator for flood surge, scam spike, and crowd risk.
- Exportable JSON and PDF incident reports.
- Prisma SQLite database with seed data and local bootstrap script.
- Multilingual UI, dark/light mode, cursor motion layer, and 320-frame scroll animation assets.
- API hardening with request size limit, simple rate limit, security headers, and payload validation.

## Project Structure

```text
crisis-signal-ai/
├─ prisma/
│  ├─ schema.prisma
│  ├─ bootstrap.js
│  └─ seed.js
├─ public/
│  ├─ brand/
│  └─ crisis-frames/
├─ server/
│  ├─ db.js
│  ├─ index.js
│  └─ lib/crisisEngine.js
├─ src/
│  ├─ lib/
│  ├─ App.tsx
│  └─ App.css
└─ package.json
```

## Commands

```bash
npm install
npm run db:seed
npm run dev
```

Useful checks:

```bash
npm run build
npm run lint
npm run start
```

`npm run dev` runs the Vite frontend and Express backend together.

## API Overview

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/live`
- `GET /api/users`
- `GET /api/signals`
- `GET /api/situations/:id`
- `GET /api/situations/:id/report`
- `GET /api/situations/:id/report.pdf`
- `POST /api/auth/login`
- `POST /api/ingest`
- `POST /api/simulate`
- `POST /api/reset-demo`
- `GET /api/approvals`
- `POST /api/approvals`
- `PATCH /api/approvals/:id`

## GitHub Safety

Do not push private or generated local files:

- `.env`, `.env.local`, `.env.production`
- real API keys, tokens, cookies, or OAuth secrets
- `prisma/dev.db`, SQLite files, local database journals
- `node_modules`, `dist`, coverage output
- private datasets, private reports, private connector credentials
- unreleased client/business strategy notes

Safe portfolio files:

- `src`, `server`, `prisma/schema.prisma`, `prisma/bootstrap.js`, `prisma/seed.js`
- public demo assets in `public`
- `README.md`, config files, `.gitignore`, and package files
- `server/data/crisis-db.json` only because it is demo seed data, not private data

Check before push:

```bash
git status --short
git ls-files .env prisma/dev.db dist node_modules
git diff --cached --name-only
```

Recommended push:

```bash
git add .gitignore README.md server/lib/crisisEngine.js server/index.js src/App.tsx src/App.css src/lib/types.ts
git commit -m "Upgrade crisis lifecycle and command operations"
git push
```

## GitHub Topics

`crisis-management`, `risk-intelligence`, `situational-awareness`, `disaster-response`, `brand-safety`, `social-listening`, `react`, `typescript`, `express`, `prisma`, `sqlite`, `framer-motion`, `portfolio-project`

## Next Roadmap

- Persist incidents as a dedicated Prisma model.
- Add source connector registry and connector health checks.
- Add notifications for email/webhook/Slack-style channels.
- Add saved report history.
- Add incident comments, assignments, and public status page.
