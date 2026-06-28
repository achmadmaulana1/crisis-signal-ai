import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Activity,
  ArrowUpRight,
  BadgeCheck,
  BellRing,
  Brain,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Database,
  Download,
  Eye,
  Filter,
  FileText,
  Flame,
  Gauge,
  Globe2,
  Handshake,
  History,
  Layers3,
  ListChecks,
  MapPin,
  Maximize2,
  Megaphone,
  Minimize2,
  Moon,
  Play,
  RadioTower,
  Search,
  RefreshCcw,
  Server,
  ShieldAlert,
  Siren,
  Sun,
  UsersRound,
  X,
} from 'lucide-react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'
import { getDashboard, getSituationReport, ingestSignal, resetDemo, simulateScenario } from './lib/api'
import type { Category, Dashboard, RiskLevel, Signal, Situation, Source } from './lib/types'
import './App.css'

type Theme = 'dark' | 'light'

const repoName = 'crisis-signal-ai'
const repoDescription =
  'Fullstack AI crisis agent for real-time signals, risk scoring, crisis maps, auto timelines, action recommendations, generated statements, collaboration, and audit trails.'
const totalFrames = 320

const sourceLabels: Record<Source, string> = {
  news: 'News',
  rss: 'RSS',
  x: 'X/Twitter',
  tiktok: 'TikTok',
  reddit: 'Reddit',
  youtube: 'YouTube',
  weather: 'Weather API',
  citizen_report: 'Citizen report',
}

const categoryLabels: Record<Category, string> = {
  weather_extreme: 'Weather extreme',
  scam: 'Scam',
  event_safety: 'Event safety',
  hoax: 'Hoax',
  supply_disruption: 'Supply disruption',
  brand_issue: 'Brand issue',
  social_conflict: 'Social conflict',
}

const levelLabels = {
  low: 'Rendah',
  medium: 'Sedang',
  high: 'Tinggi',
  critical: 'Kritis',
}

const filterLevels: Array<'all' | RiskLevel> = ['all', 'critical', 'high', 'medium', 'low']
const scenarioOptions: Array<{ id: 'flood' | 'scam' | 'crowd'; label: string }> = [
  { id: 'flood', label: 'Flood surge' },
  { id: 'scam', label: 'Scam spike' },
  { id: 'crowd', label: 'Crowd risk' },
]

const seedForm = {
  source: 'citizen_report' as Source,
  title: 'Crowd rumor spreading near venue entrance',
  location: 'Jakarta Selatan',
  lat: -6.24,
  lng: 106.81,
  category: 'event_safety' as Category,
  severity: 72,
  velocity: 78,
  credibility: 66,
  sentiment: -54,
  reach: 180000,
  summary: 'Community volunteers report confusion at a side entrance while short videos begin spreading.',
}

function framePath(frame: number) {
  return `/crisis-frames/frame-${String(frame).padStart(3, '0')}.svg`
}

function formatReach(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact' }).format(value)
}

function App() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [activeId, setActiveId] = useState<Category>('weather_extreme')
  const [frame, setFrame] = useState(0)
  const [form, setForm] = useState(seedForm)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<'all' | RiskLevel>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | Category>('all')
  const [detailOpen, setDetailOpen] = useState(false)
  const [commandMode, setCommandMode] = useState(false)
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({})
  const [busyAction, setBusyAction] = useState('')
  const flowRef = useRef<HTMLDivElement>(null)
  const preloadedFrames = useRef<HTMLImageElement[]>([])
  const frameProgressValue = useMotionValue(0)
  const smoothFrameProgress = useSpring(frameProgressValue, { stiffness: 170, damping: 28, mass: 0.25 })
  const frameDrift = useTransform(smoothFrameProgress, [0, 1], [-18, 18])
  const frameScale = useTransform(smoothFrameProgress, [0, 1], [0.97, 1.03])
  const frameGlow = useTransform(smoothFrameProgress, [0, 1], [0.18, 0.42])
  const cursorX = useMotionValue(-120)
  const cursorY = useMotionValue(-120)
  const smoothCursorX = useSpring(cursorX, { stiffness: 220, damping: 34, mass: 0.32 })
  const smoothCursorY = useSpring(cursorY, { stiffness: 220, damping: 34, mass: 0.32 })

  useEffect(() => {
    let animationId = 0

    function updateFrame() {
      const section = flowRef.current

      if (!section) {
        return
      }

      const rect = section.getBoundingClientRect()
      const scrollDistance = Math.max(1, rect.height - window.innerHeight)
      const progress = Math.max(0, Math.min(1, -rect.top / scrollDistance))
      const nextFrame = Math.round(progress * (totalFrames - 1))

      frameProgressValue.set(progress)
      setFrame((current) => (current === nextFrame ? current : nextFrame))
    }

    function requestUpdate() {
      cancelAnimationFrame(animationId)
      animationId = requestAnimationFrame(updateFrame)
    }

    requestUpdate()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
    }
  }, [frameProgressValue])

  useEffect(() => {
    preloadedFrames.current = Array.from({ length: totalFrames }, (_, index) => {
      const image = new Image()
      image.decoding = 'sync'
      image.src = framePath(index)
      return image
    })
  }, [])

  useEffect(() => {
    function updateCursor(event: PointerEvent) {
      cursorX.set(event.clientX)
      cursorY.set(event.clientY)
    }

    window.addEventListener('pointermove', updateCursor, { passive: true })

    return () => {
      window.removeEventListener('pointermove', updateCursor)
    }
  }, [cursorX, cursorY])

  useEffect(() => {
    getDashboard()
      .then((data) => {
        setDashboard(data)
        setActiveId(data.situations[0]?.id ?? 'weather_extreme')
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false))
  }, [])

  const activeSituation = useMemo<Situation | undefined>(
    () => dashboard?.situations.find((item) => item.id === activeId) ?? dashboard?.situations[0],
    [activeId, dashboard],
  )
  const filteredSituations = useMemo(() => {
    const needle = query.trim().toLowerCase()

    return (dashboard?.situations ?? []).filter((situation) => {
      const matchesLevel = levelFilter === 'all' || situation.level === levelFilter
      const matchesCategory = categoryFilter === 'all' || situation.category === categoryFilter
      const matchesQuery =
        !needle ||
        [situation.title, situation.location, situation.summary, situation.category]
          .join(' ')
          .toLowerCase()
          .includes(needle)

      return matchesLevel && matchesCategory && matchesQuery
    })
  }, [categoryFilter, dashboard?.situations, levelFilter, query])
  const activeCompletion = useMemo(() => {
    if (!activeSituation?.playbook.length) return 0
    const done = activeSituation.playbook.filter((item) => completedActions[`${activeSituation.id}-${item.id}`]).length
    return Math.round((done / activeSituation.playbook.length) * 100)
  }, [activeSituation, completedActions])

  async function submitSignal() {
    const result = await ingestSignal(form as Partial<Signal>)
    setDashboard(result.dashboard)
    setActiveId(result.signal.category)
    setDetailOpen(true)
  }

  async function restoreDemo() {
    const next = await resetDemo()
    setDashboard(next)
    setActiveId(next.situations[0]?.id ?? 'weather_extreme')
  }

  async function runScenario(scenario: 'flood' | 'scam' | 'crowd') {
    setBusyAction(scenario)
    try {
      const result = await simulateScenario(scenario)
      setDashboard(result.dashboard)
      setActiveId(result.signal.category)
      setDetailOpen(true)
    } finally {
      setBusyAction('')
    }
  }

  async function exportReport() {
    if (!activeSituation) return
    setBusyAction('export')
    try {
      const report = await getSituationReport(activeSituation.id)
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `crisis-report-${activeSituation.id}.json`
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setBusyAction('')
    }
  }

  function selectSituation(id: Category, openDrawer = true) {
    setActiveId(id)
    setDetailOpen(openDrawer)
  }

  if (loading) {
    return (
      <main className="app status-shell" data-theme={theme}>
        <div className="loading-panel">Loading CrisisSignal AI...</div>
      </main>
    )
  }

  if (error || !dashboard) {
    return (
      <main className="app status-shell" data-theme={theme}>
        <div className="loading-panel">API belum aktif: {error || 'dashboard kosong'}</div>
      </main>
    )
  }

  return (
    <main className={`app ${commandMode ? 'command-mode' : ''}`} data-theme={theme}>
      <motion.div
        className="cursor-field"
        style={{
          x: smoothCursorX,
          y: smoothCursorY,
        }}
        aria-hidden="true"
      />
      <section className="hero" id="top">
        <nav className="nav">
          <a className="brand" href="#top" aria-label="CrisisSignal AI">
            <img src="/brand/crisis-signal-logo.png" alt="" />
            <span>
              <strong>CrisisSignal AI</strong>
              <small>{repoName}</small>
            </span>
          </a>
          <div className="nav-actions">
            <button
              type="button"
              className="nav-command"
              onClick={() => setCommandMode((value) => !value)}
              title="Command center"
            >
              {commandMode ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              Command
            </button>
            <a href="#monitor">Monitor</a>
            <a href="#response">Response</a>
            <button
              type="button"
              className="icon-button"
              aria-label="Ganti tema"
              title="Ganti tema"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </nav>

        <div className="hero-grid">
          <motion.div
            className="hero-copy"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <h1>Jangan tunggu krisis viral dulu.</h1>
            <p>{repoDescription}</p>
            <div className="hero-actions">
              <a className="primary-action" href="#monitor">
                Buka signal room <RadioTower size={18} />
              </a>
              <a className="secondary-action" href="#response">
                Lihat rekomendasi <ArrowUpRight size={18} />
              </a>
            </div>
          </motion.div>

          <motion.div
            className="command-card panel"
            initial={{ opacity: 0, scale: 0.96, y: 26 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.75, ease: 'easeOut', delay: 0.1 }}
          >
            <div className="command-head">
              <div>
                <span>AI situation summary</span>
                <strong>{activeSituation?.title}</strong>
              </div>
              <Siren />
            </div>
            <div className="risk-orb">
              <motion.div
                className="orb-sweep"
                animate={{ rotate: 360 }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              />
              <strong>{activeSituation?.score}</strong>
              <span>{activeSituation ? levelLabels[activeSituation.level] : 'Rendah'}</span>
            </div>
            <div className="command-metrics">
              <span>
                <Gauge size={17} /> Avg {dashboard.stats.avgRisk}
              </span>
              <span>
                <Flame size={17} /> {dashboard.stats.critical} critical
              </span>
              <span>
                <Globe2 size={17} /> {formatReach(dashboard.stats.monitoredReach)}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {dashboard.alerts.length > 0 && (
        <section className="alert-strip" aria-label="Crisis alert rules">
          {dashboard.alerts.slice(0, 3).map((alert) => (
            <button
              key={alert.id}
              type="button"
              className={`alert-rule ${alert.level}`}
              onClick={() => selectSituation(alert.situationId)}
            >
              <Siren size={18} />
              <span>
                <strong>{alert.title}</strong>
                <small>{alert.message}</small>
              </span>
              <ArrowUpRight size={17} />
            </button>
          ))}
        </section>
      )}

      <section className="metrics-strip">
        <div>
          <strong>{dashboard.stats.totalSignals}</strong>
          <span>signals monitored</span>
        </div>
        <div>
          <strong>{dashboard.stats.activeSituations}</strong>
          <span>active situations</span>
        </div>
        <div>
          <strong>{dashboard.stats.high}</strong>
          <span>high risk</span>
        </div>
        <div>
          <strong>{formatReach(dashboard.stats.monitoredReach)}</strong>
          <span>public reach</span>
        </div>
      </section>

      {activeSituation && (
        <section className="ops-deck">
          <div className="ops-card panel">
            <span className="kicker">
              <Play size={16} /> Scenario simulator
            </span>
            <div className="scenario-row">
              {scenarioOptions.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => runScenario(scenario.id)}
                  disabled={busyAction === scenario.id}
                >
                  {busyAction === scenario.id ? 'Running...' : scenario.label}
                </button>
              ))}
            </div>
          </div>
          <div className="ops-card panel">
            <span className="kicker">
              <ListChecks size={16} /> Playbook progress
            </span>
            <strong>{activeCompletion}% complete</strong>
            <div className="mini-progress" aria-hidden="true">
              <span style={{ width: `${activeCompletion}%` }} />
            </div>
          </div>
          <div className="ops-card panel">
            <span className="kicker">
              <Download size={16} /> Crisis report
            </span>
            <button type="button" className="secondary-action report-action" onClick={exportReport}>
              {busyAction === 'export' ? 'Preparing...' : 'Export JSON'} <ArrowUpRight size={17} />
            </button>
          </div>
        </section>
      )}

      <section className="scroll-lab" ref={flowRef}>
        <div className="frame-stage panel">
          <div className="frame-hud" aria-hidden="true">
            <span>
              <Server size={15} /> Live pipeline
            </span>
            <strong>Frame {String(frame + 1).padStart(3, '0')} / {totalFrames}</strong>
          </div>
          <motion.div
            className="frame-glow"
            style={{
              opacity: frameGlow,
              x: frameDrift,
            }}
            aria-hidden="true"
          />
          <motion.img
            src={framePath(frame)}
            alt={`CrisisSignal AI animation frame ${frame + 1}`}
            style={{ scale: frameScale }}
            loading="eager"
            decoding="sync"
            draggable={false}
          />
          <div className="frame-progress" aria-hidden="true">
            <span style={{ width: `${((frame + 1) / totalFrames) * 100}%` }} />
          </div>
        </div>
      </section>

      <section className="monitor" id="monitor">
        <div className="section-title">
          <span className="kicker">
            <Brain size={16} /> Real-time monitoring
          </span>
          <h2>Signal intake, risk engine, dan peta krisis dalam satu sistem.</h2>
        </div>

        <div className="monitor-grid">
          <div className="ingest panel">
            <div className="panel-title">
              <BellRing />
              <div>
                <strong>Signal intake</strong>
                <small>Berita, RSS, social media, weather API, dan laporan warga.</small>
              </div>
            </div>
            <label>
              Judul sinyal
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </label>
            <div className="form-row">
              <label>
                Source
                <select value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value as Source })}>
                  {Object.entries(sourceLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Category
                <select
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value as Category })}
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-row">
              <label>
                Location
                <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
              </label>
              <label>
                Reach
                <input
                  type="number"
                  value={form.reach}
                  onChange={(event) => setForm({ ...form, reach: Number(event.target.value) })}
                />
              </label>
            </div>
            <div className="slider-grid">
              <label>
                Severity {form.severity}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={form.severity}
                  onChange={(event) => setForm({ ...form, severity: Number(event.target.value) })}
                />
              </label>
              <label>
                Velocity {form.velocity}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={form.velocity}
                  onChange={(event) => setForm({ ...form, velocity: Number(event.target.value) })}
                />
              </label>
              <label>
                Credibility {form.credibility}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={form.credibility}
                  onChange={(event) => setForm({ ...form, credibility: Number(event.target.value) })}
                />
              </label>
              <label>
                Sentiment {form.sentiment}
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={form.sentiment}
                  onChange={(event) => setForm({ ...form, sentiment: Number(event.target.value) })}
                />
              </label>
            </div>
            <label>
              Summary
              <textarea value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
            </label>
            <button type="button" className="primary-action submit" onClick={submitSignal}>
              Ingest signal <ChevronRight size={18} />
            </button>
          </div>

          <div className="situation-column">
            <div className="filter-panel panel">
              <label className="search-box">
                <Search size={17} />
                <input
                  value={query}
                  placeholder="Search issue, lokasi, source..."
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <div className="filter-row" aria-label="Risk level filter">
                <Filter size={16} />
                {filterLevels.map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={levelFilter === level ? 'active' : ''}
                    onClick={() => setLevelFilter(level)}
                  >
                    {level === 'all' ? 'All' : levelLabels[level]}
                  </button>
                ))}
              </div>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as 'all' | Category)}>
                <option value="all">All categories</option>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="situation-list">
              <AnimatePresence initial={false}>
                {filteredSituations.map((situation) => (
                  <motion.button
                    layout
                    key={situation.id}
                    type="button"
                    className={`situation-card panel ${activeSituation?.id === situation.id ? 'active' : ''}`}
                    onClick={() => selectSituation(situation.id)}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                  >
                    <span className={`risk-dot ${situation.level}`} />
                    <span>
                      <strong>{situation.title}</strong>
                      <small>
                        {situation.signalCount} signals - {formatReach(situation.reach)} reach
                      </small>
                    </span>
                    <b>{situation.score}</b>
                  </motion.button>
                ))}
              </AnimatePresence>
              {filteredSituations.length === 0 && (
                <div className="empty-state panel">
                  <Eye size={20} />
                  <strong>No matching crisis signal</strong>
                  <span>Ubah filter atau jalankan scenario simulator.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {activeSituation && (
        <section className="response-grid" id="response">
          <div className="breakdown-panel panel">
            <div className="panel-title">
              <Activity />
              <div>
                <strong>Risk score breakdown</strong>
                <small>Kontribusi severity, velocity, credibility, reach, dan sentiment.</small>
              </div>
            </div>
            {Object.entries(activeSituation.scoreBreakdown).map(([label, value]) => (
              <div className="score-line" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <div aria-hidden="true">
                  <i style={{ width: `${Math.min(100, value * 3)}%` }} />
                </div>
              </div>
            ))}
            <div className="score-history" aria-label="Score history">
              {activeSituation.scoreHistory.map((item) => (
                <span key={item.time} style={{ height: `${Math.max(18, item.score)}%` }} title={`${item.score}`} />
              ))}
            </div>
          </div>

          <div className="map-panel panel">
            <div className="panel-title">
              <MapPin />
              <div>
                <strong>Crisis map</strong>
                <small>Lokasi sinyal aktif dan radius eskalasi.</small>
              </div>
            </div>
            <div className="map-canvas">
              {dashboard.situations.map((situation) => (
                <motion.button
                  type="button"
                  key={situation.id}
                  className={`map-pin ${situation.level}`}
                  style={{
                    left: `${Math.min(86, Math.max(12, ((situation.lng - 106) / 8) * 74 + 16))}%`,
                    top: `${Math.min(84, Math.max(12, (Math.abs(situation.lat) / 9) * 68 + 8))}%`,
                  }}
                  onClick={() => selectSituation(situation.id)}
                  animate={{ scale: situation.level === 'critical' ? [1, 1.12, 1] : 1 }}
                  transition={{ duration: 2.4, repeat: situation.level === 'critical' ? Infinity : 0 }}
                >
                  <i aria-hidden="true" />
                  <AlertTriangle size={18} />
                  <span>{situation.score}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="action-panel panel">
            <div className="panel-title">
              <ClipboardList />
              <div>
                <strong>What should we do next?</strong>
                <small>{activeSituation.summary}</small>
              </div>
            </div>
            <div className="primary-next">
              <ShieldAlert />
              <strong>{activeSituation.nextAction.primary}</strong>
            </div>
            {activeSituation.playbook.map((step, index) => (
              <button
                type="button"
                className={`step-line checklist-line ${completedActions[`${activeSituation.id}-${step.id}`] ? 'done' : ''}`}
                key={step.id}
                onClick={() =>
                  setCompletedActions((current) => ({
                    ...current,
                    [`${activeSituation.id}-${step.id}`]: !current[`${activeSituation.id}-${step.id}`],
                  }))
                }
              >
                <b>{completedActions[`${activeSituation.id}-${step.id}`] ? <CheckCircle2 size={16} /> : index + 1}</b>
                <span>
                  <strong>{step.label}</strong>
                  <small>
                    {step.owner} - ETA {step.eta} - {step.priority}
                  </small>
                </span>
              </button>
            ))}
          </div>

          <div className="evidence-panel panel">
            <div className="panel-title">
              <Layers3 />
              <div>
                <strong>Source verification</strong>
                <small>Evidence status dari sinyal yang membentuk incident.</small>
              </div>
            </div>
            {activeSituation.evidence.map((item) => (
              <div className={`evidence-item ${item.verification}`} key={item.id}>
                <span>{item.verification.replace('_', ' ')}</span>
                <strong>{item.title}</strong>
                <small>
                  {sourceLabels[item.source]} - credibility {item.credibility} - score {item.score}
                </small>
              </div>
            ))}
          </div>

          <div className="statement-panel panel">
            <div className="panel-title">
              <Megaphone />
              <div>
                <strong>Auto-generated statement</strong>
                <small>Holding statement untuk brand, komunitas, atau pemerintah daerah.</small>
              </div>
            </div>
            <blockquote>{activeSituation.statement}</blockquote>
          </div>

          <div className="timeline-panel panel">
            <div className="panel-title">
              <History />
              <div>
                <strong>Auto timeline</strong>
                <small>Urutan kejadian dari sinyal multi-source.</small>
              </div>
            </div>
            {activeSituation.timeline.map((item) => (
              <div className="timeline-item" key={item.id}>
                <span>{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <strong>{item.title}</strong>
                <p>{item.note}</p>
              </div>
            ))}
          </div>

          <div className="team-panel panel">
            <div className="panel-title">
              <UsersRound />
              <div>
                <strong>Collaboration room</strong>
                <small>PR team, creator, NGO, relawan, dan pemerintah daerah.</small>
              </div>
            </div>
            {dashboard.teams.map((team) => (
              <span className="team-line" key={team.id}>
                <Handshake size={16} /> <strong>{team.name}</strong> {team.role} - {team.status}
              </span>
            ))}
          </div>

          <div className="audit-panel panel">
            <div className="panel-title">
              <FileText />
              <div>
                <strong>Audit trail</strong>
                <small>Kenapa AI memberi rekomendasi itu.</small>
              </div>
            </div>
            {dashboard.latestAudit.map((audit) => (
              <div className="audit-item" key={audit.id}>
                <BadgeCheck size={16} />
                <p>
                  <strong>{audit.reason}</strong>
                  <span>{audit.recommendation}</span>
                </p>
              </div>
            ))}
            <button type="button" className="reset-button" onClick={restoreDemo}>
              <RefreshCcw size={16} /> Reset demo data
            </button>
          </div>
        </section>
      )}

      <AnimatePresence>
        {detailOpen && activeSituation && (
          <motion.aside
            className="detail-drawer"
            initial={{ x: '110%' }}
            animate={{ x: 0 }}
            exit={{ x: '110%' }}
            transition={{ type: 'spring', stiffness: 210, damping: 28 }}
          >
            <div className="drawer-head">
              <span className={`risk-dot ${activeSituation.level}`} />
              <div>
                <strong>{activeSituation.title}</strong>
                <small>
                  {activeSituation.location} - {levelLabels[activeSituation.level]} - score {activeSituation.score}
                </small>
              </div>
              <button type="button" className="icon-button" onClick={() => setDetailOpen(false)} aria-label="Close detail">
                <X size={18} />
              </button>
            </div>
            <p>{activeSituation.summary}</p>
            <div className="drawer-actions">
              <button type="button" className="primary-action" onClick={exportReport}>
                <Download size={17} /> Export
              </button>
              <a className="secondary-action" href="#response" onClick={() => setDetailOpen(false)}>
                Open response <ArrowUpRight size={17} />
              </a>
            </div>
            <div className="drawer-grid">
              <span>
                <Gauge size={16} /> {activeSituation.score} risk
              </span>
              <span>
                <RadioTower size={16} /> {activeSituation.signalCount} signals
              </span>
              <span>
                <Globe2 size={16} /> {formatReach(activeSituation.reach)} reach
              </span>
            </div>
            <div className="drawer-section">
              <strong>Generated statement</strong>
              <blockquote>{activeSituation.statement}</blockquote>
            </div>
            <div className="drawer-section">
              <strong>Evidence</strong>
              {activeSituation.evidence.map((item) => (
                <span className="drawer-line" key={item.id}>
                  <BadgeCheck size={15} /> {item.title} - {item.verification.replace('_', ' ')}
                </span>
              ))}
            </div>
            <div className="drawer-section">
              <strong>Audit trail</strong>
              {activeSituation.audit.length > 0 ? (
                activeSituation.audit.map((item) => (
                  <span className="drawer-line" key={item.id}>
                    <FileText size={15} /> {item.reason}
                  </span>
                ))
              ) : (
                <span className="drawer-line">
                  <FileText size={15} /> No audit event yet for this incident.
                </span>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <footer className="site-footer">
        <div className="footer-identity panel">
          <img src="/brand/crisis-signal-logo.png" alt="" />
          <div>
            <span className="footer-kicker">Crisis command layer</span>
            <strong>CrisisSignal AI</strong>
            <p>Monitoring real-time, scoring risiko, rekomendasi respons, dan audit trail dalam satu ruang operasi.</p>
          </div>
        </div>

        <div className="footer-ops">
          <div className="footer-status">
            <span>
              <RadioTower size={16} /> {dashboard.stats.totalSignals} signals
            </span>
            <span>
              <ShieldAlert size={16} /> {dashboard.stats.high + dashboard.stats.critical} escalated
            </span>
            <span>
              <Globe2 size={16} /> {formatReach(dashboard.stats.monitoredReach)} reach
            </span>
          </div>

          <div className="footer-stack">
            <span>
              <Database size={16} /> JSON DB
            </span>
            <span>
              <Server size={16} /> API
            </span>
            <span>
              <Brain size={16} /> Risk engine
            </span>
            <span>
              <FileText size={16} /> Audit log
            </span>
          </div>

          <div className="footer-links">
            <a href="#top">Overview</a>
            <a href="#monitor">Monitor</a>
            <a href="#response">Response</a>
          </div>
        </div>
      </footer>
    </main>
  )
}

export default App
