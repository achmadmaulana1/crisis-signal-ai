import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import { readDb, writeDb } from './db.js'
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
