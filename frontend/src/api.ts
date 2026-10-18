const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

export const apiBaseUrl = configuredApiBaseUrl.replace(/\/+$/, '')

const gatewayBaseUrl = apiBaseUrl.replace(/\/api\/v1$/, '')

export async function getGatewayStatus(): Promise<'online' | 'offline'> {
  try {
    const response = await fetch(`${gatewayBaseUrl}/actuator/health`)
    if (!response.ok) return 'offline'

    const health = (await response.json()) as { status?: string }
    return health.status === 'UP' ? 'online' : 'offline'
  } catch {
    return 'offline'
  }
}