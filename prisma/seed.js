import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const adapter = new PrismaBetterSqlite3(
  { url: path.join(__dirname, 'dev.db') },
  { timestampFormat: 'iso8601' },
)
const prisma = new PrismaClient({ adapter })
const seedPath = path.join(__dirname, '..', 'server', 'data', 'crisis-db.json')

const users = [
  {
    id: 'user-admin',
    name: 'Nadia Command',
    email: 'admin@crisissignal.ai',
    role: 'admin',
    avatar: 'NC',
  },
  {
    id: 'user-analyst',
    name: 'Raka Analyst',
    email: 'analyst@crisissignal.ai',
    role: 'analyst',
    avatar: 'RA',
  },
  {
    id: 'user-comms',
    name: 'Maya Comms',
    email: 'comms@crisissignal.ai',
    role: 'comms',
    avatar: 'MC',
  },
  {
    id: 'user-field',
    name: 'Dito Field',
    email: 'field@crisissignal.ai',
    role: 'field_verifier',
    avatar: 'DF',
  },
  {
    id: 'user-viewer',
    name: 'Vina Viewer',
    email: 'viewer@crisissignal.ai',
    role: 'viewer',
    avatar: 'VV',
  },
]

async function main() {
  const raw = await readFile(seedPath, 'utf8')
  const db = JSON.parse(raw)

  await prisma.liveEvent.deleteMany()
  await prisma.playbookTask.deleteMany()
  await prisma.approvalRequest.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.team.deleteMany()
  await prisma.signal.deleteMany()
  await prisma.user.deleteMany()

  await prisma.user.createMany({ data: users })
  await prisma.signal.createMany({
    data: db.signals.map((signal) => ({
      ...signal,
      timestamp: new Date(signal.timestamp),
    })),
  })
  await prisma.team.createMany({ data: db.teams })
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
