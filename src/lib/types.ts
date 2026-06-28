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
export type VerificationStatus = 'confirmed' | 'needs_review' | 'unverified'

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
  scoreBreakdown: Record<'severity' | 'velocity' | 'credibility' | 'reach' | 'sentiment', number>
  scoreHistory: Array<{
    time: string
    score: number
  }>
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
  playbook: Array<{
    id: string
    label: string
    owner: string
    eta: string
    priority: 'high' | 'normal'
  }>
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
    verification: VerificationStatus
    summary: string
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
  alerts: Array<{
    id: string
    situationId: Category
    level: 'high' | 'critical'
    title: string
    message: string
  }>
  playbooks: Array<{
    id: Category
    title: string
    actions: Situation['playbook']
  }>
  teams: Team[]
  latestAudit: Situation['audit']
}
