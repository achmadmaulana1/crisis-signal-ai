import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  BellRing,
  Brain,
  ChevronRight,
  ClipboardList,
  FileText,
  Flame,
  Gauge,
  Globe2,
  Handshake,
  History,
  MapPin,
  Megaphone,
  Moon,
  RadioTower,
  RefreshCcw,
  Route,
  ShieldAlert,
  Siren,
  Sun,
  UsersRound,
} from 'lucide-react'
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from 'framer-motion'
import { getDashboard, ingestSignal, resetDemo } from './lib/api'
import type { Category, Dashboard, Signal, Situation, Source } from './lib/types'
import './App.css'

type Theme = 'dark' | 'light'

const repoName = 'crisis-signal-ai'
const repoDescription =
  'Fullstack AI crisis agent for real-time signals, risk scoring, crisis maps, auto timelines, action recommendations, generated statements, collaboration, and audit trails.'

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
  const flowRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: flowRef, offset: ['start end', 'end start'] })
  const animatedFrame = useTransform(scrollYProgress, [0, 1], [0, 319])

  useMotionValueEvent(animatedFrame, 'change', (latest) => {
    setFrame(Math.max(0, Math.min(319, Math.round(latest))))
  })

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

  async function submitSignal() {
    const result = await ingestSignal(form as Partial<Signal>)
    setDashboard(result.dashboard)
    setActiveId(result.signal.category)
  }

  async function restoreDemo() {
    const next = await resetDemo()
    setDashboard(next)
    setActiveId(next.situations[0]?.id ?? 'weather_extreme')
  }

  if (loading) {
    return (
      <main className="app" data-theme={theme}>
        <div className="loading-panel">Loading CrisisSignal AI...</div>
      </main>
    )
  }

  if (error || !dashboard) {
    return (
      <main className="app" data-theme={theme}>
        <div className="loading-panel">API belum aktif: {error || 'dashboard kosong'}</div>
      </main>
    )
  }

  return (
    <main className="app" data-theme={theme}>
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

      <section className="scroll-lab" ref={flowRef}>
        <div className="scroll-copy">
          <span className="kicker">
            <Route size={16} /> Crisis flow 30fps
          </span>
          <h2>320 frame individual dari sinyal awal ke keputusan tim.</h2>
          <p>
            Scroll animation menggambarkan sinyal tersebar, clustering AI, scoring risiko, peta
            krisis, rekomendasi tindakan, statement publik, dan audit trail.
          </p>
        </div>
        <div className="frame-stage panel">
          <img src={framePath(frame)} alt={`CrisisSignal AI animation frame ${frame + 1}`} />
          <div className="frame-badge">
            <span>Frame</span>
            <strong>{String(frame + 1).padStart(3, '0')} / 320</strong>
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
            <div className="situation-list">
              <AnimatePresence initial={false}>
                {dashboard.situations.map((situation) => (
                  <motion.button
                    layout
                    key={situation.id}
                    type="button"
                    className={`situation-card panel ${activeSituation?.id === situation.id ? 'active' : ''}`}
                    onClick={() => setActiveId(situation.id)}
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
            </div>
          </div>
        </div>
      </section>

      {activeSituation && (
        <section className="response-grid" id="response">
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
                  onClick={() => setActiveId(situation.id)}
                  animate={{ scale: situation.level === 'critical' ? [1, 1.12, 1] : 1 }}
                  transition={{ duration: 2.4, repeat: situation.level === 'critical' ? Infinity : 0 }}
                >
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
            {activeSituation.nextAction.steps.map((step, index) => (
              <span className="step-line" key={step}>
                <b>{index + 1}</b> {step}
              </span>
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
    </main>
  )
}

export default App
