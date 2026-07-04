import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import PDFDocument from 'pdfkit'
import { nanoid } from 'nanoid'
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

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

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
    response.json(await prisma.user.findMany({ orderBy: { name: 'asc' } }))
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/login', async (request, response, next) => {
  try {
    const user =
      (await prisma.user.findFirst({
        where: request.body.email ? { email: request.body.email } : { role: request.body.role || 'admin' },
      })) || (await prisma.user.findFirst())

    await addLiveEvent('auth', 'Role session switched', `${user.name} joined as ${user.role}.`, null)
    response.json({ user })
  } catch (error) {
    next(error)
  }
})

app.get('/api/signals', async (_request, response, next) => {
  try {
    const db = await readDb()
    response.json(db.signals.map((signal) => ({ ...signal, score: scoreSignal(signal) })))
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
    doc.fontSize(22).text('CrisisSignal AI Report')
    doc.moveDown(0.5)
    doc.fontSize(14).text(report.report.headline)
    doc.moveDown()
    doc.fontSize(11).text(`Exported: ${report.exportedAt}`)
    doc.moveDown()
    doc.fontSize(13).text('Executive Summary', { underline: true })
    doc.fontSize(11).text(report.report.summary)
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
    doc.fontSize(13).text('Audit Trail', { underline: true })
    ;(report.report.auditReasons.length ? report.report.auditReasons : ['No audit event yet.']).forEach((item) => {
      doc.fontSize(10).text(`- ${item}`)
    })
    doc.end()
  } catch (error) {
    next(error)
  }
})

app.get('/api/live', async (_request, response, next) => {
  try {
    response.json(await prisma.liveEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 25 }))
  } catch (error) {
    next(error)
  }
})

app.get('/api/approvals', async (_request, response, next) => {
  try {
    response.json(await prisma.approvalRequest.findMany({ orderBy: { updatedAt: 'desc' } }))
  } catch (error) {
    next(error)
  }
})

app.post('/api/approvals', async (request, response, next) => {
  try {
    const db = await readDb()
    const report = buildReport(db, request.body.situationId)
    if (!report) {
      response.status(404).json({ error: 'Situation not found' })
      return
    }

    const approval = await prisma.approvalRequest.create({
      data: {
        id: `approval-${nanoid(8)}`,
        situationId: request.body.situationId,
        statement: request.body.statement || report.situation.statement,
        status: 'review',
        requestedBy: request.body.requestedBy || 'admin',
        reviewer: request.body.reviewer || 'comms',
        note: request.body.note || 'Review generated statement before public release.',
      },
    })
    await addLiveEvent('approval', 'Statement sent to review', `${approval.situationId} statement is waiting for approval.`, approval.situationId)
    response.status(201).json(approval)
  } catch (error) {
    next(error)
  }
})

app.patch('/api/approvals/:id', async (request, response, next) => {
  try {
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

app.post('/api/ingest', async (request, response, next) => {
  try {
    const db = await readDb()
    const signal = ingestSignal(db, request.body)
    await writeDb(db)
    await addLiveEvent('signal', 'New signal ingested', signal.title, signal.category)
    response.status(201).json({ signal, dashboard: dashboardSummary(db) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/simulate', async (request, response, next) => {
  try {
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

app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(500).json({ error: 'Internal server error', detail: error.message })
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
