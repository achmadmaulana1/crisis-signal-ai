# CrisisSignal AI

Fullstack crisis operating system for learning, portfolio, and product-design practice. The app simulates how an AI-assisted command center monitors early crisis signals, scores risk, coordinates response work, reviews public statements, and exports incident reports.

> Portfolio note: this repository is a public education/self-learning project. Real production connectors, private API keys, internal datasets, and deployment secrets are intentionally not included.

## Repository

`crisis-signal-ai`

## GitHub Description

Fullstack AI crisis command center with risk scoring, incident workflow, approval review, live feed, PDF reports, Prisma SQLite, and animated React UI.

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

### Tools

![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-111111?style=for-the-badge&logo=github&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![21st.dev](https://img.shields.io/badge/21st.dev_Magic-6D28D9?style=for-the-badge&logo=sparkles&logoColor=white)

## Core Features

- Real-time crisis monitoring simulation from news, RSS, X/Twitter, TikTok, weather, citizen reports, and community signals.
- AI-style risk engine for signal clustering, risk score, score breakdown, escalation level, recommendation, timeline, and audit reasoning.
- Crisis map, alert rules, incident detail drawer, source verification, and risk history mini chart.
- Role-based demo session for Admin, Analyst, Comms, Field Verifier, and Viewer.
- Statement approval workflow: review, approved, published, rejected.
- Live command feed powered by backend events.
- Scenario simulator for flood surge, scam spike, and crowd risk.
- Exportable JSON and PDF incident reports.
- Prisma SQLite database with seed data and local bootstrap script.
- Minimal brutalism interface with dark/light mode, responsive layout, cursor motion layer, and Framer Motion transitions.
- Scroll animation using 320 frame assets in `public/crisis-frames`.

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

## Database Notes

This project uses Prisma Client with SQLite for a local portfolio/demo database.

```bash
npm run db:generate
npm run db:seed
```

`prisma/dev.db` is ignored because it is a generated local database. The database can be recreated from `prisma/bootstrap.js` and `prisma/seed.js`.

## API Overview

### System

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/live`
- `GET /api/users`

### Signals & Situations

- `GET /api/signals`
- `GET /api/situations/:id`
- `POST /api/ingest`
- `POST /api/simulate`
- `POST /api/reset-demo`

### Reports

- `GET /api/situations/:id/report`
- `GET /api/situations/:id/report.pdf`

### Workflow

- `POST /api/auth/login`
- `GET /api/approvals`
- `POST /api/approvals`
- `PATCH /api/approvals/:id`

## What Should Not Be Pushed

Do not push private or generated local files:

- `.env`
- real API keys or tokens
- `prisma/dev.db`
- `node_modules`
- `dist`
- private datasets
- production connector credentials
- personal notes that reveal unreleased business strategy

Safe portfolio files:

- source code in `src`
- backend code in `server`
- Prisma schema and seed/bootstrap scripts
- public demo images/icons/frames
- README and config files
- `.env.example`

## GitHub Topics

`crisis-management`, `risk-intelligence`, `situational-awareness`, `disaster-response`, `brand-safety`, `social-listening`, `react`, `typescript`, `express`, `prisma`, `sqlite`, `framer-motion`, `portfolio-project`

## License / Use

Public learning and portfolio project. You may review the architecture and UI patterns, but production deployment should replace demo data, mock connectors, and local secrets handling with real security controls.
