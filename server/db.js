import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db')
const adapter = new PrismaBetterSqlite3({ url: dbPath }, { timestampFormat: 'iso8601' })

export const prisma = new PrismaClient({ adapter })

export async function readDb() {
  const [signals, teams, auditTrail, users, approvals, playbookTasks, liveEvents] = await Promise.all([
    prisma.signal.findMany({ orderBy: { timestamp: 'desc' } }),
    prisma.team.findMany(),
    prisma.auditLog.findMany({ orderBy: { time: 'desc' } }),
    prisma.user.findMany({ orderBy: { name: 'asc' } }),
    prisma.approvalRequest.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.playbookTask.findMany({ orderBy: { updatedAt: 'desc' } }),
    prisma.liveEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
  ])

  return {
    signals,
    teams,
    auditTrail,
    users,
    approvals,
    playbookTasks,
    liveEvents,
  }
}

export async function writeDb(db) {
  await prisma.$transaction([
    prisma.signal.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.signal.createMany({
      data: db.signals.map((signal) => ({
        ...signal,
        timestamp: new Date(signal.timestamp),
      })),
    }),
    prisma.auditLog.createMany({
      data: db.auditTrail.map((audit) => ({
        ...audit,
        time: new Date(audit.time),
      })),
    }),
  ])
}
