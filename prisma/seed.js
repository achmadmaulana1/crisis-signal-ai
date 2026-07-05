import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const adapter = new PrismaBetterSqlite3(
  { url: path.join(__dirname, 'dev.db') },
  { timestampFormat: 'iso8601' },
)
const prisma = new PrismaClient({ adapter })
const seedPath = path.join(__dirname, '..', 'server', 'data', 'crisis-db.json')
const demoPassword = 'CrisisSignal2026!'

const users = [
  {
    id: 'user-admin',
    organizationId: 'org-demo',
    name: 'Nadia Command',
    email: 'admin@crisissignal.ai',
    role: 'admin',
    avatar: 'NC',
  },
  {
    id: 'user-analyst',
    organizationId: 'org-demo',
    name: 'Raka Analyst',
    email: 'analyst@crisissignal.ai',
    role: 'analyst',
    avatar: 'RA',
  },
  {
    id: 'user-comms',
    organizationId: 'org-demo',
    name: 'Maya Comms',
    email: 'comms@crisissignal.ai',
    role: 'comms',
    avatar: 'MC',
  },
  {
    id: 'user-field',
    organizationId: 'org-demo',
    name: 'Dito Field',
    email: 'field@crisissignal.ai',
    role: 'field_verifier',
    avatar: 'DF',
  },
  {
    id: 'user-viewer',
    organizationId: 'org-demo',
    name: 'Vina Viewer',
    email: 'viewer@crisissignal.ai',
    role: 'viewer',
    avatar: 'VV',
  },
]

async function main() {
  const raw = await readFile(seedPath, 'utf8')
  const db = JSON.parse(raw)
  const passwordHash = await bcrypt.hash(demoPassword, 10)

  await prisma.savedReport.deleteMany()
  await prisma.attachment.deleteMany()
  await prisma.incidentComment.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.sourceConnector.deleteMany()
  await prisma.incidentSignal.deleteMany()
  await prisma.incident.deleteMany()
  await prisma.organization.deleteMany()
  await prisma.liveEvent.deleteMany()
  await prisma.playbookTask.deleteMany()
  await prisma.approvalRequest.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.team.deleteMany()
  await prisma.signal.deleteMany()
  await prisma.user.deleteMany()

  await prisma.organization.create({
    data: {
      id: 'org-demo',
      name: 'CrisisSignal Demo Command',
      plan: 'portfolio-lab',
      region: 'Indonesia',
    },
  })
  await prisma.user.createMany({ data: users.map((user) => ({ ...user, passwordHash })) })
  await prisma.signal.createMany({
    data: db.signals.map((signal) => ({
      ...signal,
      timestamp: new Date(signal.timestamp),
    })),
  })
  await prisma.team.createMany({ data: db.teams })
  await prisma.incident.createMany({
    data: [
      {
        id: 'incident-weather',
        organizationId: 'org-demo',
        category: 'weather_extreme',
        title: 'Weather and logistics crisis',
        status: 'responding',
        owner: 'Ops lead',
        severity: 'high',
        publicStatus: 'holding_statement_ready',
        dueAt: new Date(Date.now() + 15 * 60 * 1000),
      },
      {
        id: 'incident-scam',
        organizationId: 'org-demo',
        category: 'scam',
        title: 'Scam and brand abuse spike',
        status: 'triaging',
        owner: 'Trust and safety',
        severity: 'high',
        publicStatus: 'internal_only',
        dueAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    ],
  })
  await prisma.sourceConnector.createMany({
    data: [
      { id: 'connector-rss', type: 'rss', name: 'News and RSS Watch', status: 'online', config: '{"interval":"15m","feeds":3}' },
      { id: 'connector-weather', type: 'weather', name: 'Weather API Guard', status: 'online', config: '{"provider":"mock-weather","region":"ID"}' },
      { id: 'connector-webhook', type: 'webhook', name: 'Citizen Report Webhook', status: 'online', config: '{"path":"/api/connectors/webhook/report"}' },
      { id: 'connector-social', type: 'social_mock', name: 'Mock Social Listening', status: 'degraded', config: '{"sources":["x","tiktok","reddit"]}' },
      { id: 'connector-csv', type: 'csv', name: 'CSV Bulk Import', status: 'offline', config: '{"accepted":"text/csv"}' },
    ],
  })
  await prisma.notification.createMany({
    data: [
      {
        id: 'notif-seed-email',
        channel: 'email_mock',
        title: 'High-risk situation briefing',
        message: 'Email mock queued for response leadership.',
        status: 'queued',
        situationId: 'weather_extreme',
      },
      {
        id: 'notif-seed-webhook',
        channel: 'webhook_mock',
        title: 'Webhook dispatch ready',
        message: 'Webhook mock payload prepared for operations room.',
        status: 'ready',
        situationId: 'scam',
      },
    ],
  })
  await prisma.incidentComment.createMany({
    data: [
      {
        id: 'comment-seed-1',
        situationId: 'weather_extreme',
        author: 'Nadia Command',
        body: 'Keep public guidance short and verify transport routes before next update.',
        internal: true,
      },
      {
        id: 'comment-seed-2',
        situationId: 'scam',
        author: 'Maya Comms',
        body: 'Prepare customer support macro and official channel notice.',
        internal: true,
      },
    ],
  })
  await prisma.attachment.createMany({
    data: [
      {
        id: 'attachment-map-weather',
        situationId: 'weather_extreme',
        name: 'Route risk map snapshot',
        kind: 'map',
        url: '/brand/crisis-signal-logo.png',
      },
    ],
  })
  await prisma.auditLog.createMany({
    data: db.auditTrail.map((audit) => ({
      id: audit.id,
      situationId: audit.situationId,
      time: new Date(audit.time),
      reason: audit.reason,
      recommendation: audit.recommendation,
    })),
  })
  await prisma.liveEvent.createMany({
    data: [
      {
        id: 'live-seed-001',
        type: 'system',
        title: 'Command center online',
        message: 'Prisma SQLite database seeded and monitoring loop started.',
        situationId: null,
      },
    ],
  })

  await prisma.savedReport.create({
    data: {
      id: 'report-seed-1',
      situationId: 'weather_extreme',
      title: 'Initial weather crisis report',
      format: 'json',
      content: JSON.stringify({ summary: 'Seed report generated for demo workspace.' }),
      createdBy: 'admin',
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
