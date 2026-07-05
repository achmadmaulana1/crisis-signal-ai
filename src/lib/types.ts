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
export type UserRole = 'admin' | 'analyst' | 'comms' | 'field_verifier' | 'viewer'
export type IncidentLifecycle = 'new' | 'triaging' | 'verified' | 'responding' | 'monitoring' | 'resolved'

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
  lifecycle: IncidentLifecycle
  sla: {
    openedAt: string
    deadline: string
    targetMinutes: number
    elapsedMinutes: number
    remainingMinutes: number
    pressure: number
    state: 'healthy' | 'watch' | 'urgent' | 'breached'
  }
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
  explanation: {
    confidence: number
    leadingFactors: Array<{ name: string; value: number }>
    influentialSignals: Array<{
      id: string
      title: string
      source: Source
      score: number
      credibility: number
    }>
    missingEvidence: string[]
    verificationRecommendation: string
  }
  statement: string
  playbook: Array<{
    id: string
    label: string
    owner: string
    eta: string
    priority: 'high' | 'normal'
    status: 'open' | 'done' | 'blocked'
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

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  avatar: string
  createdAt: string
}

export type ApprovalRequest = {
  id: string
  situationId: Category
  statement: string
  status: 'draft' | 'review' | 'approved' | 'published' | 'rejected'
  requestedBy: string
  reviewer: string
  note: string
  createdAt: string
  updatedAt: string
}

export type LiveEvent = {
  id: string
  type: string
  title: string
  message: string
  situationId: Category | null
  createdAt: string
}

export type WarRoom = {
  operatingMode: string
  averageReadiness: number
  teamReadiness: number
  unresolvedApprovals: number
  freshEvents: number
  lanes: Array<{
    situationId: Category
    title: string
    level: RiskLevel
    readiness: number
    evidenceHealth: number
    slaPressure: number
    minutesOpen: number
    communicationStatus: string
    nextMove: string
    blockers: string[]
  }>
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
  users: User[]
  approvals: ApprovalRequest[]
  liveEvents: LiveEvent[]
  warRoom: WarRoom
  teams: Team[]
  organizations: Array<{ id: string; name: string; plan: string; region: string; createdAt: string }>
  incidents: Array<{
    id: string
    organizationId: string | null
    category: Category
    title: string
    status: IncidentLifecycle
    owner: string
    severity: string
    publicStatus: string
    dueAt: string | null
    createdAt: string
    updatedAt: string
  }>
  connectors: {
    total: number
    online: number
    degraded: number
    offline: number
    health: number
    items: Array<{
      id: string
      type: string
      name: string
      status: 'online' | 'degraded' | 'offline'
      config: string
      lastRunAt: string | null
      createdAt: string
    }>
  }
  notifications: Array<{
    id: string
    channel: string
    title: string
    message: string
    status: string
    situationId: Category | null
    createdAt: string
  }>
  comments: Array<{
    id: string
    situationId: Category
    author: string
    body: string
    internal: boolean
    createdAt: string
  }>
  attachments: Array<{
    id: string
    situationId: Category
    name: string
    kind: string
    url: string
    createdAt: string
  }>
  savedReports: Array<{
    id: string
    situationId: Category
    title: string
    format: string
    content: string
    createdBy: string
    createdAt: string
  }>
  latestAudit: Situation['audit']
}
