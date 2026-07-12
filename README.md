# CrisisSignal AI

Fullstack crisis operating system for learning, portfolio, and product-design practice. CrisisSignal AI simulates how an AI-assisted command center monitors early crisis signals, scores risk, coordinates response work, reviews public statements, saves reports, and publishes public incident updates.

> Portfolio note: this repository is a public education/self-learning project. Real production connectors, private API keys, internal datasets, and deployment secrets are intentionally not included.

## Concept

Organizations often discover a crisis after it has already spread. CrisisSignal AI turns scattered early signals into an operating workspace with risk score, lifecycle status, SLA pressure, evidence review, connector health, team workflow, notification queue, communication approval, saved reports, public status page, and audit trail.

```text
Signal intake -> Risk scoring -> Incident lifecycle -> War room readiness -> Team workflow -> Statement approval -> Saved report -> Public status update
```

## UI/UX Direction

- Minimal brutalism command-center UI with strong borders, compact density, sharp hierarchy, and dark/light theme.
- Interactive motion using Framer Motion: hero entry, risk orbit, cursor field, command palette, drawer tabs, map pin pulse, and scroll-driven frame animation.
- Operator-first UX: fast scan metrics, active incident cards, lifecycle/SLA card, war room readiness, connector center, notification center, and Ctrl+K command palette.
- Multilingual interface: Indonesian and English as primary languages, with Melayu, Japanese, and Arabic interface options.
- Mobile operator mode: sticky bottom action bar, compact navigation, and responsive panels.
- Guided product UX: first-run operator onboarding, workspace settings panel, scenario selector, toast feedback, and report preview before export.

## GitHub Description

Fullstack AI crisis command center with auth session, risk scoring, incident lifecycle, SLA engine, data connectors, notifications, approval workflow, saved reports, public status page, Prisma SQLite, and animated React UI.

## Stack Badges

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-111111?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![PDFKit](https://img.shields.io/badge/PDFKit-FF3B30?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)

## Completion Checklist

- Real Auth + Session: email/password demo login, bcrypt hashes, JWT cookie session, logout, session endpoint, role-protected API routes.
- Data Source Connector: connector registry for RSS/news, weather API, citizen webhook report, mock social listening, and CSV import.
- Incident Lifecycle: `new`, `triaging`, `verified`, `responding`, `monitoring`, `resolved` support with computed lifecycle and Prisma Incident model.
- Notification System: in-app notification, email mock, webhook mock, and Slack-style mock queue.
- Better Database Design: Organization, Incident, IncidentSignal, SourceConnector, Notification, IncidentComment, Attachment, SavedReport.
- Incident Detail Page: tabbed incident drawer for Overview, Evidence, Timeline, Playbook, Approvals, Report, and Audit.
- AI Explanation Panel: confidence, leading factors, influential signals, missing evidence, and verification recommendation.
- Command Palette: Ctrl+K search for incidents, sections, scenarios, report export, reset, and actions.
- Empty/Loading/Error States: API-down panel, no-match state, auth prompts for protected actions, report loading state.
- Interactive Map Upgrade: layer toggle for risk, reach, source, and verification confidence.
- Responsive Mobile Command Mode: sticky bottom action bar and compact mobile controls.
- API Validation: Zod validation for auth, ingest, approvals, connector run, and scenario input.
- Pagination + Filters: signals, live feed, approvals, and audit endpoints support pagination/filter style responses.
- Rate Limit + Security Headers: Helmet, CORS credentials, request size limit, basic rate limit, and Morgan request logging.
- Premium PDF Report: cover, executive summary, risk breakdown, AI explanation, timeline, approval log, evidence appendix, and audit trail.
- Saved Reports: report history stored in Prisma.
- Crisis Simulation Lab: scenario simulator plus connector-run simulations for staged signal intake.
- Team Collaboration: comment, attachment, owner, and task data model support.
- SLA Engine: critical 15m, high 30m, medium 2h, low monitor window, pressure and countdown UI.
- Public Status Page: `/status/:incidentId`.
- Scenario Selector: flood surge, scam spike, crowd risk, brand crisis, and supply disruption demo flows.
- Report Preview: executive summary, risk, lifecycle, reach, recommendation, and public statement preview before JSON/PDF export.
- Workspace Settings: local organization, webhook, notification mode, language, connector health, and SLA policy controls.

## Core Features

- Real-time crisis monitoring simulation from news, RSS, X/Twitter, TikTok, weather, citizen reports, and community signals.
- AI-style risk engine for signal clustering, risk score, score breakdown, escalation level, recommendation, timeline, and audit reasoning.
- Crisis war room with readiness score, evidence health, team readiness, approval blockers, fresh events, and next operational move.
- Role-based secure demo session for Admin, Analyst, Comms, Field Verifier, and Viewer.
- Statement approval workflow: review, approved, published, rejected.
- Live command feed powered by backend events.
- Exportable JSON and PDF incident reports.
- Prisma SQLite database with seed data and local bootstrap script.
- Multilingual UI, dark/light mode, cursor motion layer, and 320-frame scroll animation assets.
- First-run onboarding, local settings panel, toast notifications, and richer scenario selector for faster demo walkthroughs.

## Demo Scenarios

| Scenario | Category | What it tests |
| --- | --- | --- |
| Flood surge | Weather extreme | Weather API signal, citizen reports, SLA pressure, logistics response |
| Scam spike | Scam | Lookalike links, social propagation, public warning workflow |
| Crowd risk | Event safety | Short-video escalation, venue response, field verification |
| Brand crisis | Brand issue | Audience backlash, cultural context, statement approval |
| Supply disruption | Supply disruption | RSS/logistics signals, inventory risk, operational recommendation |

## Portfolio Screenshots To Add

Capture these after running `npm run dev`:

- Dashboard hero and AI situation summary.
- Scenario selector plus war room readiness.
- Incident detail drawer with Evidence or Report tab.
- Command palette and report preview modal.

Recommended folder: `public/screenshots/`. Add the best images to this README after capture.

## Project Structure

```text
crisis-signal-ai/
|-- prisma/
|   |-- schema.prisma
|   |-- bootstrap.js
|   `-- seed.js
|-- public/
|   |-- brand/
|   `-- crisis-frames/
|-- server/
|   |-- db.js
|   |-- index.js
|   `-- lib/crisisEngine.js
|-- src/
|   |-- lib/
|   |-- App.tsx
|   `-- App.css
`-- package.json
```

## Run Local

First run:

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Daily run after setup:

```bash
npm run dev
```

Local URLs:

- Frontend: `http://127.0.0.1:5177`
- API: `http://127.0.0.1:4177`
- Public status page example: `http://127.0.0.1:4177/status/weather_extreme`

Demo login:

```text
admin@crisissignal.ai
CrisisSignal2026!
```

Other demo accounts use the same password:

- `analyst@crisissignal.ai`
- `comms@crisissignal.ai`
- `field@crisissignal.ai`
- `viewer@crisissignal.ai`

Useful checks:

```bash
npm run build
npm run lint
npm run start
```

## Safe GitHub Push Checklist

Before pushing a public portfolio update:

```bash
git status --short
git diff -- .gitignore
git ls-files .env server/data prisma/*.db dist node_modules
```

Do not commit local secrets, generated databases, build output, dependency folders, API keys, access tokens, private datasets, real customer reports, or unreleased production logic. Keep `.env.example`, schema files, seed/demo data, README docs, screenshots, and source code that is safe for portfolio review.

## API Overview

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/users`
- `GET /api/auth/session`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/signals`
- `GET /api/live`
- `GET /api/audit`
- `GET /api/situations/:id`
- `GET /api/situations/:id/report`
- `GET /api/situations/:id/report.pdf`
- `POST /api/situations/:id/report/save`
- `POST /api/ingest`
- `POST /api/simulate`
- `POST /api/reset-demo`
- `GET /api/approvals`
- `POST /api/approvals`
- `PATCH /api/approvals/:id`
- `GET /api/connectors`
- `POST /api/connectors/run`
- `POST /api/connectors/webhook/report`
- `POST /api/connectors/csv`
- `GET /api/notifications`
- `POST /api/notifications`
- `GET /api/reports`
- `GET /status/:incidentId`

## GitHub Safety

Do not push private or generated local files:

- `.env`, `.env.local`, `.env.production`
- real API keys, tokens, cookies, OAuth secrets
- `prisma/dev.db`, SQLite files, local database journals
- `node_modules`, `dist`, coverage output
- private datasets, private reports, private connector credentials
- unreleased client/business strategy notes

Safe portfolio files:

- `src`, `server`, `prisma/schema.prisma`, `prisma/bootstrap.js`, `prisma/seed.js`
- public demo assets in `public`
- `README.md`, config files, `.gitignore`, and package files
- `server/data/crisis-db.json` only because it is demo seed data

Check before push:

```bash
git status --short
git ls-files .env prisma/dev.db dist node_modules "*.db" "*.sqlite"
git diff --cached --name-only
```

Recommended push:

```bash
git add .gitignore README.md package.json package-lock.json prisma/schema.prisma prisma/bootstrap.js prisma/seed.js server/db.js server/index.js server/lib/crisisEngine.js src/lib/api.ts src/lib/types.ts src/App.tsx src/App.css
git commit -m "Upgrade CrisisSignal AI operating system"
git push
```

## GitHub Topics

`crisis-management`, `risk-intelligence`, `situational-awareness`, `disaster-response`, `brand-safety`, `social-listening`, `react`, `typescript`, `express`, `prisma`, `sqlite`, `framer-motion`, `portfolio-project`
