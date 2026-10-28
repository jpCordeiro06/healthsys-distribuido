export const profiles = ['ADMIN', 'MEDICO', 'ENFERMEIRO', 'RECEPCAO'] as const
export type Profile = (typeof profiles)[number]

export const profileLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  MEDICO: 'Médico',
  ENFERMEIRO: 'Enfermeiro',
  RECEPCAO: 'Recepção',
}

export interface User {
  id: string
  nome: string
  email: string
  perfil: string
}

export interface UserInput {
  nome: string
  email: string
  senha: string
  perfil: Profile
}

export interface Page<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export type FieldErrors = Record<string, string[]>

export interface LoginResponse {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  usuario: User
}

export interface Session {
  mode: 'api' | 'demo'
  usuario: User
  accessToken: string | null
  expiresAt: number | null
}

export interface UsersService {
  listUsers: (page: number, signal?: AbortSignal) => Promise<Page<User>>
  createUser: (data: UserInput) => Promise<User>
}
