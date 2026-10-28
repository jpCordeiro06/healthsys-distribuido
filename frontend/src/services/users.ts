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
    createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }, token),
  }
}
