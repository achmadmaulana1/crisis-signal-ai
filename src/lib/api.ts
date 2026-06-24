import type { Dashboard, Signal } from './types'

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
