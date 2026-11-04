import { ApiError, request } from '../api'
import type { Page, User, UsersService } from '../types'

// This is the only place that defines user endpoints and their response format.
export function createUsersService(token: string): UsersService {
  return {
    listUsers: async (page, signal) => {
      const result = await request<Page<User>>(
        `/users?page=${page}&size=10&sort=nome,asc`,
        { signal },
        token,
      )
      if (!Array.isArray(result?.content)) {
        throw new ApiError('A resposta de usuários não segue o contrato paginado da API.', 502)
      }
      return result
    },
    updateUser: async (id, data) => {
      try {
        return await request(`/users/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }, token)
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          throw new ApiError('Já existe um usuário com este e-mail.', 409, { email: ['Este e-mail já está em uso.'] })
        }
        throw error
      }
    },
    createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }, token),
  }
}
