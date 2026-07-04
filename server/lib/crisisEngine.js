import { nanoid } from 'nanoid'

export const levelFromScore = (score) => {
  if (score >= 82) return 'critical'
  if (score >= 64) return 'high'
  if (score >= 42) return 'medium'
  return 'low'
}

export function scoreSignal(signal) {
  return Math.round(Object.values(scoreBreakdown(signal)).reduce((sum, value) => sum + value, 0))
}

export function scoreBreakdown(signal) {
  const reachScore = Math.min(100, Math.log10(Math.max(signal.reach, 10)) * 13)
  const negativeSentiment = Math.abs(Math.min(0, signal.sentiment))
  return {
    severity: Math.round(signal.severity * 0.3),
    velocity: Math.round(signal.velocity * 0.24),
    credibility: Math.round(signal.credibility * 0.22),
    reach: Math.round(reachScore * 0.12),
    sentiment: Math.round(negativeSentiment * 0.12),
  }
}

export function clusterSituations(signals, auditTrail = [], playbookTasks = []) {
  const grouped = signals.reduce((acc, signal) => {
    acc[signal.category] ||= []
    acc[signal.category].push(signal)
    return acc
  }, {})

  return Object.entries(grouped)
    .map(([category, items]) => {
      const scores = items.map(scoreSignal)
      const score = Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
      const peak = items.reduce((top, item) => (scoreSignal(item) > scoreSignal(top) ? item : top), items[0])
      const timeline = items
        .slice()
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map((item) => ({
          id: item.id,
          time: item.timestamp,
          title: item.title,
          source: item.source,
          note: item.summary,
        }))

      return {
        id: category,
        category,
        title: titleForCategory(category),
        score,
        scoreBreakdown: aggregateBreakdown(items),
        scoreHistory: buildScoreHistory(items),
        level: levelFromScore(score),
        location: peak.location,
        lat: peak.lat,
        lng: peak.lng,
        reach: items.reduce((sum, item) => sum + item.reach, 0),
        signalCount: items.length,
        summary: summarizeSituation(category, items, score),
        nextAction: recommendAction(category, score, items),
        statement: generateStatement(category, score, peak.location),
        playbook: buildPlaybook(category, score, playbookTasks.filter((task) => task.situationId === category)),
        timeline,
        audit: auditTrail.filter((entry) => entry.situationId === category),
        evidence: items.map((item) => ({
          id: item.id,
          source: item.source,
          title: item.title,
          credibility: item.credibility,
          score: scoreSignal(item),
          verification: verificationStatus(item),
          summary: item.summary,
        })),
      }
    })
    .sort((a, b) => b.score - a.score)
}

export function ingestSignal(db, input) {
  const signal = {
    id: `sig-${nanoid(8)}`,
    source: input.source || 'citizen_report',
    title: input.title || 'Untitled signal',
    location: input.location || 'Unknown',
    lat: Number(input.lat ?? -6.2),
    lng: Number(input.lng ?? 106.816),
    category: input.category || 'brand_issue',
    severity: Number(input.severity ?? 50),
    velocity: Number(input.velocity ?? 50),
    credibility: Number(input.credibility ?? 50),
    sentiment: Number(input.sentiment ?? -20),
    reach: Number(input.reach ?? 50000),
    timestamp: new Date().toISOString(),
    summary: input.summary || 'New signal submitted from monitoring intake.',
  }

  const score = scoreSignal(signal)
  db.signals.unshift(signal)
  db.auditTrail.unshift({
    id: `audit-${nanoid(8)}`,
    situationId: signal.category,
    time: new Date().toISOString(),
    reason: `New ${signal.source} signal ingested with score ${score}, severity ${signal.severity}, velocity ${signal.velocity}, credibility ${signal.credibility}.`,
    recommendation: recommendAction(signal.category, score, [signal]).primary,
  })
  return signal
}

export function dashboardSummary(db) {
  const situations = clusterSituations(db.signals, db.auditTrail, db.playbookTasks)
  const critical = situations.filter((item) => item.level === 'critical').length
  const high = situations.filter((item) => item.level === 'high').length
  const avgRisk = Math.round(
    situations.reduce((sum, item) => sum + item.score, 0) / Math.max(1, situations.length),
  )

  return {
    repoName: 'crisis-signal-ai',
    description:
      'Fullstack AI crisis agent for real-time signals, risk scoring, crisis maps, auto timelines, action recommendations, generated statements, collaboration, and audit trails.',
    stats: {
      totalSignals: db.signals.length,
      activeSituations: situations.length,
      critical,
      high,
      avgRisk,
      monitoredReach: db.signals.reduce((sum, item) => sum + item.reach, 0),
    },
    situations,
    alerts: buildAlerts(situations),
    playbooks: buildPlaybookCatalog(),
    users: db.users || [],
    approvals: db.approvals || [],
    liveEvents: db.liveEvents || [],
    teams: db.teams,
    latestAudit: db.auditTrail.slice(0, 8),
  }
}

export function buildReport(db, situationId) {
  const situation = clusterSituations(db.signals, db.auditTrail, db.playbookTasks).find((item) => item.id === situationId)
  if (!situation) return null

  return {
    exportedAt: new Date().toISOString(),
    service: 'CrisisSignal AI',
    situation,
    report: {
      headline: `${situation.title} - ${situation.level.toUpperCase()} (${situation.score})`,
      summary: situation.summary,
      recommendation: situation.nextAction.primary,
      statement: situation.statement,
      auditReasons: situation.audit.map((item) => item.reason),
    },
  }
}

export function scenarioSignal(input = {}) {
  const scenarios = {
    flood: {
      source: 'weather',
      title: 'Rain cell intensifies near commuter corridor',
      location: 'Tangerang Selatan',
      lat: -6.288,
      lng: 106.717,
      category: 'weather_extreme',
      severity: 86,
      velocity: 81,
      credibility: 88,
      sentiment: -64,
      reach: 920000,
      summary: 'Weather API and commuter reports indicate fast-moving flood risk near the evening rush route.',
    },
    scam: {
      source: 'x',
      title: 'Fake giveaway link copied across creator comments',
      location: 'Jakarta',
      lat: -6.2,
      lng: 106.816,
      category: 'scam',
      severity: 81,
      velocity: 92,
      credibility: 73,
      sentiment: -77,
      reach: 1800000,
      summary: 'Multiple accounts are reposting a lookalike URL under official brand and creator posts.',
    },
    crowd: {
      source: 'tiktok',
      title: 'Crowd compression clip gains traction before gates open',
      location: 'Bandung',
      lat: -6.917,
      lng: 107.619,
      category: 'event_safety',
      severity: 76,
      velocity: 85,
      credibility: 69,
      sentiment: -58,
      reach: 760000,
      summary: 'Short-form video shows crowd pressure at a side entrance while commenters ask for official guidance.',
    },
  }

  return scenarios[input.scenario] || scenarios.scam
}

function titleForCategory(category) {
  const titles = {
    weather_extreme: 'Weather and logistics crisis',
    scam: 'Scam and brand abuse spike',
    event_safety: 'Event safety crowd risk',
    hoax: 'Hoax and trust erosion',
    supply_disruption: 'Supply disruption watch',
    brand_issue: 'Brand issue escalation',
    social_conflict: 'Social conflict signal',
  }
  return titles[category] || category.replace(/_/g, ' ')
}

function summarizeSituation(category, items, score) {
  const sources = [...new Set(items.map((item) => item.source))].join(', ')
  const locations = [...new Set(items.map((item) => item.location))].join(', ')
  return `${items.length} signal(s) from ${sources} point to ${titleForCategory(category).toLowerCase()} around ${locations}. Current risk score is ${score}.`
}

function recommendAction(category, score, items) {
  const level = levelFromScore(score)
  const shared = [
    'Assign one incident owner and one public communication owner.',
    'Verify top three evidence items before publishing instructions.',
    'Keep a 15-minute update cycle until risk drops below medium.',
  ]

  const playbooks = {
    weather_extreme: [
      'Activate local route monitoring and logistics continuity checklist.',
      'Publish safe-route advisory for staff, vendors, and nearby communities.',
    ],
    scam: [
      'Freeze suspicious links, pin official channel notice, and open customer support macro.',
      'Coordinate takedown reports with platform trust-and-safety teams.',
    ],
    event_safety: [
      'Send field lead to verify crowd density and signage confusion.',
      'Open overflow gate plan and push clear arrival instructions.',
    ],
    hoax: [
      'Do not amplify the rumor; publish verified facts with source references.',
      'Ask community moderators to collect screenshots and origin links.',
    ],
    supply_disruption: [
      'Contact vendors for ETA confirmation and backup supply route.',
      'Notify affected teams with contingency timing.',
    ],
  }

  return {
    primary:
      level === 'critical'
        ? 'Open crisis room now and publish a verified holding statement within 20 minutes.'
        : level === 'high'
          ? 'Escalate to response team and prepare public guidance.'
          : level === 'medium'
            ? 'Continue monitoring and verify before amplification.'
            : 'Monitor normally and log evidence.',
    steps: [...(playbooks[category] || ['Create triage ticket and route to the correct owner.']), ...shared],
  }
}

function aggregateBreakdown(items) {
  const initial = { severity: 0, velocity: 0, credibility: 0, reach: 0, sentiment: 0 }
  const sum = items.reduce((acc, item) => {
    const breakdown = scoreBreakdown(item)
    Object.keys(acc).forEach((key) => {
      acc[key] += breakdown[key]
    })
    return acc
  }, initial)

  Object.keys(sum).forEach((key) => {
    sum[key] = Math.round(sum[key] / Math.max(1, items.length))
  })

  return sum
}

function buildScoreHistory(items) {
  return items
    .slice()
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((item, index, source) => {
      const slice = source.slice(0, index + 1)
      const score = Math.round(slice.reduce((sum, value) => sum + scoreSignal(value), 0) / slice.length)
      return { time: item.timestamp, score }
    })
}

function verificationStatus(signal) {
  if (signal.credibility >= 80) return 'confirmed'
  if (signal.credibility >= 58) return 'needs_review'
  return 'unverified'
}

function buildPlaybook(category, score, savedTasks = []) {
  const action = recommendAction(category, score, [])
  return action.steps.map((step, index) => ({
    id: `${category}-${index + 1}`,
    label: step,
    owner: index % 3 === 0 ? 'Ops lead' : index % 3 === 1 ? 'Comms' : 'Verification',
    eta: index < 2 ? '15m' : '30m',
    priority: index < 2 ? 'high' : 'normal',
    status: savedTasks.find((task) => task.id === `${category}-${index + 1}` || task.label === step)?.status || 'open',
  }))
}

function buildPlaybookCatalog() {
  const categories = [
    'weather_extreme',
    'scam',
    'event_safety',
    'hoax',
    'supply_disruption',
    'brand_issue',
    'social_conflict',
  ]

  return categories.map((category) => ({
    id: category,
    title: titleForCategory(category),
    actions: buildPlaybook(category, 70),
  }))
}

function buildAlerts(situations) {
  return situations
    .filter((situation) => situation.score >= 64 || situation.reach >= 1000000)
    .map((situation) => ({
      id: `alert-${situation.id}`,
      situationId: situation.id,
      level: situation.score >= 82 ? 'critical' : 'high',
      title: situation.score >= 82 ? 'Critical escalation rule triggered' : 'High-risk watch rule triggered',
      message:
        situation.score >= 82
          ? `${situation.title} requires immediate response room activation.`
          : `${situation.title} crossed the high-risk threshold or public reach guardrail.`,
    }))
}

function generateStatement(category, score, location) {
  const level = levelFromScore(score)
  const urgency =
    level === 'critical'
      ? 'We are actively responding and will share verified updates as they are confirmed.'
      : level === 'high'
        ? 'We are monitoring the situation closely and coordinating with relevant teams.'
        : 'We are aware of early signals and are validating the information.'

  return `We are aware of reports related to ${titleForCategory(category).toLowerCase()} near ${location}. ${urgency} Please rely on official channels for instructions and avoid sharing unverified claims.`
}
