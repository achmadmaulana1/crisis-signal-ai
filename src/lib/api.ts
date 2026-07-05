import type { ApprovalRequest, Dashboard, LiveEvent, Signal, User, UserRole } from './types'

const jsonHeaders = { 'Content-Type': 'application/json' }

export async function getDashboard(): Promise<Dashboard> {
  const response = await fetch('/api/dashboard', { credentials: 'include' })
  if (!response.ok) throw new Error('Failed to load dashboard')
  return response.json()
}

export async function ingestSignal(input: Partial<Signal>) {
  const response = await fetch('/api/ingest', {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(input),
  })
  if (!response.ok) throw new Error('Failed to ingest signal')
  return response.json() as Promise<{ signal: Signal; dashboard: Dashboard }>
}

export async function resetDemo() {
  const response = await fetch('/api/reset-demo', { method: 'POST', credentials: 'include' })
  if (!response.ok) throw new Error('Failed to reset demo')
  return response.json() as Promise<Dashboard>
}

export async function simulateScenario(scenario: 'flood' | 'scam' | 'crowd') {
  const response = await fetch('/api/simulate', {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ scenario }),
  })
  if (!response.ok) throw new Error('Failed to run scenario')
  return response.json() as Promise<{ signal: Signal; dashboard: Dashboard }>
}

export async function getSituationReport(id: string) {
  const response = await fetch(`/api/situations/${id}/report`, { credentials: 'include' })
  if (!response.ok) throw new Error('Failed to export report')
  return response.json()
}

export async function loginRole(role: UserRole, password?: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ role, password }),
  })
  if (!response.ok) throw new Error('Failed to switch role')
  return response.json() as Promise<{ user: User }>
}

export async function loginWithEmail(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) throw new Error('Failed to login')
  return response.json() as Promise<{ user: User }>
}

export async function getSession() {
  const response = await fetch('/api/auth/session', { credentials: 'include' })
  if (!response.ok) throw new Error('Failed to load session')
  return response.json() as Promise<{ user: User | null }>
}

export async function logoutSession() {
  const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
  if (!response.ok) throw new Error('Failed to logout')
  return response.json() as Promise<{ ok: boolean }>
}

export async function getLiveEvents() {
  const response = await fetch('/api/live', { credentials: 'include' })
  if (!response.ok) throw new Error('Failed to load live feed')
  const data = await response.json()
  return (Array.isArray(data) ? data : data.items) as LiveEvent[]
}

export async function createApproval(input: { situationId: string; statement: string; requestedBy: string }) {
  const response = await fetch('/api/approvals', {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(input),
  })
  if (!response.ok) throw new Error('Failed to create approval')
  return response.json() as Promise<ApprovalRequest>
}

export async function updateApproval(id: string, status: ApprovalRequest['status'], note = '') {
  const response = await fetch(`/api/approvals/${id}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ status, note }),
  })
  if (!response.ok) throw new Error('Failed to update approval')
  return response.json() as Promise<ApprovalRequest>
}

export function pdfReportUrl(id: string) {
  return `/api/situations/${id}/report.pdf`
}

export async function runConnector(type: string) {
  const response = await fetch('/api/connectors/run', {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify({ type }),
  })
  if (!response.ok) throw new Error('Failed to run connector')
  return response.json() as Promise<{ signal: Signal; dashboard: Dashboard }>
}

export async function createNotification(input: { channel: string; title: string; message: string; situationId?: string }) {
  const response = await fetch('/api/notifications', {
    method: 'POST',
    headers: jsonHeaders,
    credentials: 'include',
    body: JSON.stringify(input),
  })
  if (!response.ok) throw new Error('Failed to create notification')
  return response.json()
}

export async function saveSituationReport(id: string) {
  const response = await fetch(`/api/situations/${id}/report/save`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!response.ok) throw new Error('Failed to save report')
  return response.json()
}
