import type { FieldErrors } from './types'

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'
export const apiBaseUrl = configuredApiBaseUrl.replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fields: FieldErrors = {},
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error
    throw new ApiError(
      'Não foi possível conectar à API. Verifique se os serviços estão disponíveis.',
      0,
    )
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null)
    const error = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
    const fields: FieldErrors = {}
    if (error.campos && typeof error.campos === 'object') {
      for (const [field, messages] of Object.entries(error.campos)) {
        if (Array.isArray(messages))
          fields[field] = messages.filter((item): item is string => typeof item === 'string')
      }
    }
    const fallback =
      response.status === 401
        ? 'Sua sessão expirou. Entre novamente.'
        : response.status === 403
          ? 'Seu perfil não tem permissão para esta operação.'
          : 'Não foi possível concluir a solicitação. Tente novamente.'
    throw new ApiError(
      typeof error.mensagem === 'string' ? error.mensagem : fallback,
      response.status,
      fields,
    )
  }

  if (response.status === 204) return undefined as T
  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError('A API retornou uma resposta em formato inesperado.', response.status)
  }
}
