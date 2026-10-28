import { ApiError, request } from '../api'
import type { LoginResponse, Session } from '../types'

export async function login(email: string, senha: string): Promise<Session> {
  let result: LoginResponse
  try {
    result = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw new ApiError('E-mail ou senha inválidos.', 401, error.fields)
    }
    throw error
  }
  if (
    !result.accessToken ||
    result.tokenType !== 'Bearer' ||
    !Number.isFinite(result.expiresIn) ||
    result.expiresIn <= 0 ||
    !result.usuario?.id ||
    !result.usuario?.nome ||
    !result.usuario?.perfil
  ) {
    throw new ApiError('A resposta de login não corresponde ao contrato da API.', 502)
  }
  return {
    mode: 'api',
    usuario: result.usuario,
    accessToken: result.accessToken,
    expiresAt: Date.now() + result.expiresIn * 1000,
  }
}
