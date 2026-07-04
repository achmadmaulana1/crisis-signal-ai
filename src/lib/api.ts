import type { ApprovalRequest, Dashboard, LiveEvent, Signal, User, UserRole } from './types'

export async function getDashboard(): Promise<Dashboard> {
  const response = await fetch('/api/dashboard')
  if (!response.ok) throw new Error('Failed to load dashboard')
  return response.json()
}

export async function ingestSignal(input: Partial<Signal>) {
  const response = await fetch('/api/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) throw new Error('Failed to ingest signal')
  return response.json() as Promise<{ signal: Signal; dashboard: Dashboard }>
}

export async function resetDemo() {
  const response = await fetch('/api/reset-demo', { method: 'POST' })
  if (!response.ok) throw new Error('Failed to reset demo')
  return response.json() as Promise<Dashboard>
}

export async function simulateScenario(scenario: 'flood' | 'scam' | 'crowd') {
  const response = await fetch('/api/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario }),
  })
  if (!response.ok) throw new Error('Failed to run scenario')
  return response.json() as Promise<{ signal: Signal; dashboard: Dashboard }>
}

export async function getSituationReport(id: string) {
  const response = await fetch(`/api/situations/${id}/report`)
  if (!response.ok) throw new Error('Failed to export report')
  return response.json()
}

export async function loginRole(role: UserRole) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  })
  if (!response.ok) throw new Error('Failed to switch role')
  return response.json() as Promise<{ user: User }>
}

export async function getLiveEvents() {
  const response = await fetch('/api/live')
  if (!response.ok) throw new Error('Failed to load live feed')
  return response.json() as Promise<LiveEvent[]>
}

export async function createApproval(input: { situationId: string; statement: string; requestedBy: string }) {
  const response = await fetch('/api/approvals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) throw new Error('Failed to create approval')
  return response.json() as Promise<ApprovalRequest>
}

export async function updateApproval(id: string, status: ApprovalRequest['status'], note = '') {
  const response = await fetch(`/api/approvals/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, note }),
  })
  if (!response.ok) throw new Error('Failed to update approval')
  return response.json() as Promise<ApprovalRequest>
}

export function pdfReportUrl(id: string) {
  return `/api/situations/${id}/report.pdf`
}
