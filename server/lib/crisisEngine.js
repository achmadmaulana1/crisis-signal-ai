import { nanoid } from 'nanoid'

export const levelFromScore = (score) => {
  if (score >= 82) return 'critical'
  if (score >= 64) return 'high'
  if (score >= 42) return 'medium'
  return 'low'
}

export function scoreSignal(signal) {
  const reachScore = Math.min(100, Math.log10(Math.max(signal.reach, 10)) * 13)
  const negativeSentiment = Math.abs(Math.min(0, signal.sentiment))
  return Math.round(
    signal.severity * 0.3 +
      signal.velocity * 0.24 +
      signal.credibility * 0.22 +
      reachScore * 0.12 +
      negativeSentiment * 0.12,
  )
}

export function clusterSituations(signals, auditTrail = []) {
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
        level: levelFromScore(score),
        location: peak.location,
        lat: peak.lat,
        lng: peak.lng,
        reach: items.reduce((sum, item) => sum + item.reach, 0),
        signalCount: items.length,
        summary: summarizeSituation(category, items, score),
        nextAction: recommendAction(category, score, items),
        statement: generateStatement(category, score, peak.location),
        timeline,
        audit: auditTrail.filter((entry) => entry.situationId === category),
        evidence: items.map((item) => ({
          id: item.id,
          source: item.source,
          title: item.title,
          credibility: item.credibility,
          score: scoreSignal(item),
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
  const situations = clusterSituations(db.signals, db.auditTrail)
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
    teams: db.teams,
    latestAudit: db.auditTrail.slice(0, 8),
  }
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
