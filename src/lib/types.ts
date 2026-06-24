export type Source = 'news' | 'rss' | 'x' | 'tiktok' | 'reddit' | 'youtube' | 'weather' | 'citizen_report'
export type Category =
  | 'weather_extreme'
  | 'scam'
  | 'event_safety'
  | 'hoax'
  | 'supply_disruption'
  | 'brand_issue'
  | 'social_conflict'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export type Signal = {
  id: string
  source: Source
  title: string
  location: string
  lat: number
  lng: number
  category: Category
  severity: number
  velocity: number
  credibility: number
  sentiment: number
  reach: number
  timestamp: string
  summary: string
  score?: number
}

export type Situation = {
  id: Category
  category: Category
  title: string
  score: number
  level: RiskLevel
  location: string
  lat: number
  lng: number
  reach: number
  signalCount: number
  summary: string
  nextAction: {
    primary: string
    steps: string[]
  }
  statement: string
  timeline: Array<{
    id: string
    time: string
    title: string
    source: Source
    note: string
  }>
  audit: Array<{
    id: string
    situationId: Category
    time: string
    reason: string
    recommendation: string
  }>
  evidence: Array<{
    id: string
    source: Source
    title: string
    credibility: number
    score: number
  }>
}

export type Team = {
  id: string
  name: string
  role: string
  status: string
}

export type Dashboard = {
  repoName: string
  description: string
  stats: {
    totalSignals: number
    activeSituations: number
    critical: number
    high: number
    avgRisk: number
    monitoredReach: number
  }
  situations: Situation[]
  teams: Team[]
  latestAudit: Situation['audit']
}
