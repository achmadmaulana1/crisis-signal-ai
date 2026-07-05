import cors from 'cors'
import bcrypt from 'bcryptjs'
import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import jwt from 'jsonwebtoken'
import morgan from 'morgan'
import PDFDocument from 'pdfkit'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { prisma, readDb, writeDb } from './db.js'
import {
  buildReport,
  clusterSituations,
  dashboardSummary,
  ingestSignal,
  scenarioSignal,
  scoreSignal,
} from './lib/crisisEngine.js'

const app = express()
const port = Number(process.env.PORT || 4177)
const sessionSecret = process.env.SESSION_SECRET || 'crisis-signal-local-dev-secret-change-before-deploy'
const requestWindow = new Map()
const categories = new Set(['weather_extreme', 'scam', 'event_safety', 'hoax', 'supply_disruption', 'brand_issue', 'social_conflict'])
const sources = new Set(['news', 'rss', 'x', 'tiktok', 'reddit', 'youtube', 'weather', 'citizen_report'])
const approvalStatuses = new Set(['draft', 'review', 'approved', 'published', 'rejected'])
const roles = ['admin', 'analyst', 'comms', 'field_verifier', 'viewer']
const loginSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(roles).optional(),
})
const signalSchema = z.object({
  source: z.enum([...sources]).optional(),
  title: z.string().min(3).max(180).optional(),
  location: z.string().min(2).max(120).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  category: z.enum([...categories]).optional(),
  severity: z.coerce.number().min(0).max(100).optional(),
  velocity: z.coerce.number().min(0).max(100).optional(),
  credibility: z.coerce.number().min(0).max(100).optional(),
  sentiment: z.coerce.number().min(-100).max(100).optional(),
  reach: z.coerce.number().min(0).max(100000000).optional(),
  summary: z.string().max(1200).optional(),
})
const approvalSchema = z.object({
  situationId: z.enum([...categories]),
  statement: z.string().max(1400).optional(),
  requestedBy: z.string().max(80).optional(),
  reviewer: z.string().max(80).optional(),
  note: z.string().max(600).optional(),
})
const connectorRunSchema = z.object({ type: z.enum(['rss', 'news', 'weather', 'webhook', 'social_mock', 'csv']) })

app.use(helmet())
app.use(cors({ origin: true, credentials: true }))
app.use(cookieParser())
app.use(express.json({ limit: '180kb' }))
app.use(morgan('dev'))
app.use(securityHeaders)
app.use(rateLimit)
app.use(attachUser)

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, service: 'crisis-signal-ai', time: new Date().toISOString() })
})

app.get('/api/dashboard', async (_request, response, next) => {
  try {
    const db = await readDb()
    response.json(dashboardSummary(db))
  } catch (error) {
    next(error)
  }
})

app.get('/api/users', async (_request, response, next) => {
  try {
    response.json((await prisma.user.findMany({ orderBy: { name: 'asc' } })).map(publicUser))
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/login', async (request, response, next) => {
  try {
    const input = parseBody(loginSchema, request.body)

    const user =
      (await prisma.user.findFirst({
        where: input.email ? { email: input.email } : { role: input.role || 'admin' },
      })) || (await prisma.user.findFirst())

    if (!user) {
      response.status(401).json({ error: 'User not found' })
      return
    }

    if (input.password || input.email) {
      const ok = await bcrypt.compare(input.password || '', user.passwordHash)
      if (!ok) {
        response.status(401).json({ error: 'Invalid credentials' })
        return
      }
    }

    const token = signSession(user)
    response.cookie('crisis_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 8,
    })
    await addLiveEvent('auth', 'Role session switched', `${user.name} joined as ${user.role}.`, null)
    response.json({ user: publicUser(user) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/auth/session', async (request, response) => {
  response.json({ user: request.user ? publicUser(request.user) : null })
})

app.post('/api/auth/logout', async (_request, response) => {
  response.clearCookie('crisis_session')
  response.json({ ok: true })
})

app.get('/api/audit', async (request, response, next) => {
  try {
    const { skip, take } = pagination(request)
    const where = request.query.situationId ? { situationId: String(request.query.situationId) } : {}
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({ where, orderBy: { time: 'desc' }, skip, take }),
      prisma.auditLog.count({ where }),
    ])
    response.json({ items, total, skip, take })
  } catch (error) {
    next(error)
  }
})

app.get('/api/signals', async (request, response, next) => {
  try {
    const { skip, take } = pagination(request)
    const where = {
      ...(request.query.category ? { category: String(request.query.category) } : {}),
      ...(request.query.source ? { source: String(request.query.source) } : {}),
    }
    const [items, total] = await Promise.all([
      prisma.signal.findMany({ where, orderBy: { timestamp: 'desc' }, skip, take }),
      prisma.signal.count({ where }),
    ])
    response.json({ items: items.map((signal) => ({ ...signal, score: scoreSignal(signal) })), total, skip, take })
  } catch (error) {
    next(error)
  }
})

app.get('/api/situations/:id', async (request, response, next) => {
  try {
    const db = await readDb()
    const situation = clusterSituations(db.signals, db.auditTrail).find(
      (item) => item.id === request.params.id,
    )
    if (!situation) {
      response.status(404).json({ error: 'Situation not found' })
      return
    }
    response.json(situation)
  } catch (error) {
    next(error)
  }
})

app.get('/api/situations/:id/report', async (request, response, next) => {
  try {
    const db = await readDb()
    const report = buildReport(db, request.params.id)
    if (!report) {
      response.status(404).json({ error: 'Situation not found' })
      return
    }
    response.json(report)
  } catch (error) {
    next(error)
  }
})

app.get('/api/situations/:id/report.pdf', async (request, response, next) => {
  try {
    const db = await readDb()
    const report = buildReport(db, request.params.id)
    if (!report) {
      response.status(404).json({ error: 'Situation not found' })
      return
    }

    response.setHeader('Content-Type', 'application/pdf')
    response.setHeader('Content-Disposition', `attachment; filename="crisis-report-${request.params.id}.pdf"`)

    const doc = new PDFDocument({ margin: 48, size: 'A4' })
    doc.pipe(response)
    doc.rect(0, 0, doc.page.width, 120).fill('#111317')
    doc.fillColor('#ffbd2e').fontSize(26).text('CrisisSignal AI', 48, 42)
    doc.fillColor('#f8f2e8').fontSize(13).text('Incident Intelligence Report', 48, 78)
    doc.moveDown(4)
    doc.fillColor('#111317').fontSize(18).text(report.report.headline)
    doc.moveDown()
    doc.fontSize(11).text(`Exported: ${report.exportedAt}`)
    doc.text(`Lifecycle: ${report.situation.lifecycle} | SLA: ${report.situation.sla.state} (${report.situation.sla.pressure}%)`)
    doc.moveDown()
    doc.fontSize(13).text('Executive Summary', { underline: true })
    doc.fontSize(11).text(report.report.summary)
    doc.moveDown()
    doc.fontSize(13).text('Risk Breakdown', { underline: true })
    Object.entries(report.situation.scoreBreakdown).forEach(([key, value]) => {
      doc.fontSize(10).text(`${key}: ${value}`)
    })
    doc.moveDown()
    doc.fontSize(13).text('AI Risk Explanation', { underline: true })
    doc.fontSize(10).text(`Confidence: ${report.report.riskExplanation.confidence}%`)
    report.report.riskExplanation.leadingFactors.forEach((factor) => {
      doc.fontSize(10).text(`- ${factor.name}: ${factor.value}`)
    })
    doc.fontSize(10).text(`Verification: ${report.report.riskExplanation.verificationRecommendation}`)
    doc.moveDown()
    doc.fontSize(13).text('Recommended Action', { underline: true })
    doc.fontSize(11).text(report.report.recommendation)
    doc.moveDown()
    doc.fontSize(13).text('Public Statement', { underline: true })
    doc.fontSize(11).text(report.report.statement)
    doc.moveDown()
    doc.fontSize(13).text('Evidence Appendix', { underline: true })
    report.situation.evidence.forEach((item) => {
      doc.fontSize(10).text(`- ${item.title} | ${item.source} | ${item.verification} | score ${item.score}`)
    })
    doc.moveDown()
    doc.fontSize(13).text('Timeline', { underline: true })
    report.situation.timeline.forEach((item) => {
      doc.fontSize(10).text(`- ${new Date(item.time).toLocaleString()} | ${item.title}`)
    })
    doc.moveDown()
    doc.fontSize(13).text('Approval Log', { underline: true })
    ;(db.approvals || [])
      .filter((item) => item.situationId === request.params.id)
      .forEach((item) => {
        doc.fontSize(10).text(`- ${item.status}: ${item.requestedBy} -> ${item.reviewer} | ${item.note}`)
      })
    doc.moveDown()
    doc.fontSize(13).text('Audit Trail', { underline: true })
    ;(report.report.auditReasons.length ? report.report.auditReasons : ['No audit event yet.']).forEach((item) => {
      doc.fontSize(10).text(`- ${item}`)
    })
    doc.end()
  } catch (error) {
    next(error)
  }
})

app.get('/api/live', async (request, response, next) => {
  try {
    const { skip, take } = pagination(request, 25)
    const [items, total] = await Promise.all([
      prisma.liveEvent.findMany({ orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.liveEvent.count(),
    ])
    response.json({ items, total, skip, take })
  } catch (error) {
    next(error)
  }
})

app.get('/api/approvals', async (request, response, next) => {
  try {
    const { skip, take } = pagination(request)
    const where = request.query.situationId ? { situationId: String(request.query.situationId) } : {}
    const [items, total] = await Promise.all([
      prisma.approvalRequest.findMany({ where, orderBy: { updatedAt: 'desc' }, skip, take }),
      prisma.approvalRequest.count({ where }),
    ])
    response.json({ items, total, skip, take })
  } catch (error) {
    next(error)
  }
})

app.post('/api/approvals', requireAuth(['admin', 'analyst', 'comms']), async (request, response, next) => {
  try {
    const input = parseBody(approvalSchema, request.body)

    const db = await readDb()
    const report = buildReport(db, input.situationId)
    if (!report) {
      response.status(404).json({ error: 'Situation not found' })
      return
    }

    const approval = await prisma.approvalRequest.create({
      data: {
        id: `approval-${nanoid(8)}`,
        situationId: input.situationId,
        statement: input.statement || report.situation.statement,
        status: 'review',
        requestedBy: input.requestedBy || request.user.role,
        reviewer: input.reviewer || 'comms',
        note: input.note || 'Review generated statement before public release.',
      },
    })
    await addLiveEvent('approval', 'Statement sent to review', `${approval.situationId} statement is waiting for approval.`, approval.situationId)
    response.status(201).json(approval)
  } catch (error) {
    next(error)
  }
})

app.patch('/api/approvals/:id', requireAuth(['admin', 'comms']), async (request, response, next) => {
  try {
    if (!approvalStatuses.has(request.body.status)) {
      response.status(400).json({ error: 'Invalid approval status' })
      return
    }

    const approval = await prisma.approvalRequest.update({
      where: { id: request.params.id },
      data: {
        status: request.body.status,
        note: request.body.note || '',
      },
    })
    await addLiveEvent('approval', `Statement ${approval.status}`, `${approval.situationId} approval moved to ${approval.status}.`, approval.situationId)
    response.json(approval)
  } catch (error) {
    next(error)
  }
})

app.get('/api/alerts', async (_request, response, next) => {
  try {
    const db = await readDb()
    response.json(dashboardSummary(db).alerts)
  } catch (error) {
    next(error)
  }
})

app.get('/api/playbooks', async (_request, response, next) => {
  try {
    const db = await readDb()
    response.json(dashboardSummary(db).playbooks)
  } catch (error) {
    next(error)
  }
})

app.post('/api/ingest', requireAuth(['admin', 'analyst', 'field_verifier']), async (request, response, next) => {
  try {
    const input = parseBody(signalSchema, request.body)

    const db = await readDb()
    const signal = ingestSignal(db, input)
    await writeDb(db)
    await addLiveEvent('signal', 'New signal ingested', signal.title, signal.category)
    response.status(201).json({ signal, dashboard: dashboardSummary(db) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/simulate', requireAuth(['admin', 'analyst']), async (request, response, next) => {
  try {
    if (request.body.scenario && !['flood', 'scam', 'crowd'].includes(request.body.scenario)) {
      response.status(400).json({ error: 'Invalid scenario' })
      return
    }

    const db = await readDb()
    const signal = ingestSignal(db, scenarioSignal(request.body))
    await writeDb(db)
    await addLiveEvent('scenario', 'Scenario injected', signal.title, signal.category)
    response.status(201).json({ signal, dashboard: dashboardSummary(db) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/reset-demo', async (_request, response, next) => {
  try {
    const db = await readDb()
    db.signals = db.signals.slice(-5)
    db.auditTrail = db.auditTrail.slice(-1)
    await writeDb(db)
    response.json(dashboardSummary(db))
  } catch (error) {
    next(error)
  }
})

app.get('/api/connectors', async (_request, response, next) => {
  try {
    response.json(await prisma.sourceConnector.findMany({ orderBy: { createdAt: 'desc' } }))
  } catch (error) {
    next(error)
  }
})

app.post('/api/connectors/run', requireAuth(['admin', 'analyst']), async (request, response, next) => {
  try {
    const input = parseBody(connectorRunSchema, request.body)
    const connector = await prisma.sourceConnector.findFirst({ where: { type: input.type } })
    const scenario = input.type === 'weather' ? 'flood' : input.type === 'social_mock' ? 'scam' : 'crowd'
    const db = await readDb()
    const signal = ingestSignal(db, scenarioSignal({ scenario }))
    await writeDb(db)
    if (connector) {
      await prisma.sourceConnector.update({
        where: { id: connector.id },
        data: { status: 'online', lastRunAt: new Date() },
      })
    }
    await addLiveEvent('connector', `${input.type} connector run`, signal.title, signal.category)
    response.status(201).json({ signal, dashboard: dashboardSummary(await readDb()) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/connectors/webhook/report', async (request, response, next) => {
  try {
    const input = parseBody(signalSchema, { ...request.body, source: 'citizen_report' })
    const db = await readDb()
    const signal = ingestSignal(db, input)
    await writeDb(db)
    await addLiveEvent('webhook', 'Citizen webhook report received', signal.title, signal.category)
    response.status(201).json({ signal })
  } catch (error) {
    next(error)
  }
})

app.post('/api/connectors/csv', requireAuth(['admin', 'analyst']), async (request, response, next) => {
  try {
    const rows = String(request.body.csv || '')
      .split(/\r?\n/)
      .map((line) => line.split(',').map((cell) => cell.trim()))
      .filter((row) => row.length >= 4)
    const db = await readDb()
    const signals = rows.slice(1, 21).map((row) =>
      ingestSignal(db, {
        title: row[0],
        category: categories.has(row[1]) ? row[1] : 'brand_issue',
        location: row[2],
        summary: row[3],
        source: 'citizen_report',
      }),
    )
    await writeDb(db)
    await addLiveEvent('csv', 'CSV signals imported', `${signals.length} signal(s) imported.`, null)
    response.status(201).json({ count: signals.length, dashboard: dashboardSummary(db) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/notifications', async (_request, response, next) => {
  try {
    response.json(await prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 40 }))
  } catch (error) {
    next(error)
  }
})

app.post('/api/notifications', requireAuth(['admin', 'comms']), async (request, response, next) => {
  try {
    const channel = String(request.body.channel || 'in_app')
    const notification = await prisma.notification.create({
      data: {
        id: `notif-${nanoid(8)}`,
        channel,
        title: String(request.body.title || `${channel} notification`),
        message: String(request.body.message || 'CrisisSignal notification generated.'),
        status: channel === 'in_app' ? 'delivered' : 'queued',
        situationId: request.body.situationId || null,
      },
    })
    await addLiveEvent('notification', notification.title, notification.message, notification.situationId)
    response.status(201).json(notification)
  } catch (error) {
    next(error)
  }
})

app.get('/api/reports', async (_request, response, next) => {
  try {
    response.json(await prisma.savedReport.findMany({ orderBy: { createdAt: 'desc' }, take: 30 }))
  } catch (error) {
    next(error)
  }
})

app.post('/api/situations/:id/report/save', requireAuth(['admin', 'analyst', 'comms']), async (request, response, next) => {
  try {
    const db = await readDb()
    const report = buildReport(db, request.params.id)
    if (!report) {
      response.status(404).json({ error: 'Situation not found' })
      return
    }
    const saved = await prisma.savedReport.create({
      data: {
        id: `report-${nanoid(8)}`,
        situationId: request.params.id,
        title: report.report.headline,
        format: 'json',
        content: JSON.stringify(report),
        createdBy: request.user.role,
      },
    })
    response.status(201).json(saved)
  } catch (error) {
    next(error)
  }
})

app.get('/status/:id', async (request, response, next) => {
  try {
    const db = await readDb()
    const report = buildReport(db, request.params.id)
    if (!report) {
      response.status(404).send('Status page not found')
      return
    }
    response.type('html').send(`<!doctype html><html><head><title>${report.situation.title}</title><style>body{font-family:Arial,sans-serif;background:#0b0c0f;color:#f8f2e8;padding:40px;line-height:1.6}main{max-width:880px;margin:auto}section{border:2px solid #f8f2e8;padding:22px;margin:18px 0;background:#15171c}strong{color:#ffbd2e}</style></head><body><main><h1>${report.situation.title}</h1><section><strong>Status:</strong> ${report.situation.lifecycle} | ${report.situation.level} | score ${report.situation.score}</section><section><h2>Official update</h2><p>${report.situation.statement}</p></section><section><h2>Recommended action</h2><p>${report.situation.nextAction.primary}</p></section><section><small>Generated by CrisisSignal AI public status page.</small></section></main></body></html>`)
  } catch (error) {
    next(error)
  }
})

app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(error.statusCode || 500).json({
    error: error.statusCode ? error.message : 'Internal server error',
    detail: error.statusCode ? undefined : error.message,
  })
})

app.listen(port, () => {
  console.log(`CrisisSignal AI API running on http://127.0.0.1:${port}`)
})

async function addLiveEvent(type, title, message, situationId) {
  await prisma.liveEvent.create({
    data: {
      id: `live-${nanoid(8)}`,
      type,
      title,
      message,
      situationId,
    },
  })
}

function securityHeaders(_request, response, next) {
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('X-Frame-Options', 'SAMEORIGIN')
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  next()
}

function signSession(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    sessionSecret,
    { expiresIn: '8h' },
  )
}

async function attachUser(request, _response, next) {
  try {
    const token = request.cookies?.crisis_session
    if (!token) {
      next()
      return
    }
    const payload = jwt.verify(token, sessionSecret)
    request.user = await prisma.user.findUnique({ where: { id: payload.sub } })
  } catch {
    request.user = null
  }
  next()
}

function requireAuth(allowedRoles = roles) {
  return (request, response, next) => {
    if (!request.user) {
      response.status(401).json({ error: 'Authentication required' })
      return
    }
    if (!allowedRoles.includes(request.user.role)) {
      response.status(403).json({ error: 'Permission denied' })
      return
    }
    next()
  }
}

function publicUser(user) {
  if (!user) return null
  const { passwordHash: _passwordHash, ...safe } = user
  return safe
}

function parseBody(schema, body) {
  const result = schema.safeParse(body)
  if (!result.success) {
    const issue = result.error.issues[0]
    const error = new Error(issue?.message || 'Invalid request body')
    error.statusCode = 400
    throw error
  }
  return result.data
}

function pagination(request, defaultTake = 20) {
  const take = Math.min(100, Math.max(1, Number(request.query.take || defaultTake)))
  const skip = Math.max(0, Number(request.query.skip || 0))
  return { skip, take }
}

function rateLimit(request, response, next) {
  const key = request.ip || request.socket.remoteAddress || 'local'
  const now = Date.now()
  const windowMs = 60_000
  const limit = 160
  const current = requestWindow.get(key) || { count: 0, resetAt: now + windowMs }

  if (now > current.resetAt) {
    current.count = 0
    current.resetAt = now + windowMs
  }

  current.count += 1
  requestWindow.set(key, current)

  if (current.count > limit) {
    response.status(429).json({ error: 'Too many requests' })
    return
  }

  next()
}
