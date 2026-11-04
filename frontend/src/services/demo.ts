import { ApiError } from '../api'
import type { Session, User, UsersService, Patient, PatientsService } from '../types'

export const demoEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO === 'true'

export function createDemoSession(): Session {
  return {
    mode: 'demo',
    usuario: {
      id: 'demo-admin',
      nome: 'Alex Demo',
      email: 'demo@example.invalid',
      perfil: 'ADMIN',
    },
    accessToken: null,
    expiresAt: null,
  }
}

// Only fictional users; this data is discarded when leaving the demonstration.
export function createDemoUsersService(): UsersService {
  const users: User[] = [
    { id: 'demo-user-1', nome: 'Alex Demo', email: 'demo@example.invalid', perfil: 'ADMIN' },
    {
      id: 'demo-user-2',
      nome: 'Marina Exemplo',
      email: 'marina@example.invalid',
      perfil: 'MEDICO',
    },
    {
      id: 'demo-user-3',
      nome: 'Rafael Exemplo',
      email: 'rafael@example.invalid',
      perfil: 'RECEPCAO',
    },
  ]

  return {
    listUsers: async (page) => {
      const sorted = [...users].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      const size = 10
      const totalPages = Math.ceil(sorted.length / size)
      return {
        content: sorted.slice(page * size, (page + 1) * size),
        number: page,
        size,
        totalElements: sorted.length,
        totalPages,
        first: page === 0,
        last: page >= totalPages - 1,
      }
    },
    updateUser: async (id, { nome, email, perfil }) => {
      const index = users.findIndex((user) => user.id === id)
      if (index < 0) throw new ApiError('Usuário não encontrado.', 404)
      if (users.some((user) => user.id !== id && user.email.toLowerCase() === email.toLowerCase())) {
        throw new ApiError('Já existe um usuário com este e-mail.', 409, { email: ['Este e-mail já está em uso.'] })
      }
      const user = { id, nome, email, perfil }
      users[index] = user
      return user
    },
    createUser: async ({ nome, email, perfil }) => {
      if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
        throw new ApiError('Já existe um usuário com este e-mail.', 409, {
          email: ['Este e-mail já está em uso.'],
        })
      }
      const user = { id: crypto.randomUUID(), nome, email, perfil }
      users.push(user)
      return user
    },
  }
}


export function createDemoPatientsService(): PatientsService {
  const patients: Patient[] = [
    { id: 'demo-patient-1', nome: 'Ana Exemplo', cpf: '52998224725', dataNascimento: '1990-05-12', sexo: 'Feminino', telefone: '(85) 99999-0000' },
    { id: 'demo-patient-2', nome: 'Bruno Exemplo', cpf: '11144477735', dataNascimento: '1985-09-20', sexo: 'Masculino', telefone: null },
  ]
  function checkCpf(cpf: string, id?: string) {
    if (patients.some((patient) => patient.id !== id && patient.cpf === cpf)) {
      throw new ApiError('Já existe um paciente com este CPF.', 409, { cpf: ['Este CPF já está em uso.'] })
    }
  }
  return {
    listPatients: async (number) => {
      const sorted = [...patients].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      const size = 10
      return { content: sorted.slice(number * size, (number + 1) * size), number, size,
        totalElements: sorted.length, totalPages: Math.ceil(sorted.length / size), first: number === 0,
        last: (number + 1) * size >= sorted.length }
    },
    createPatient: async (data) => {
      const cpf = data.cpf.replace(/\D/g, '')
      checkCpf(cpf)
      const patient = { ...data, cpf, id: crypto.randomUUID() }
      patients.push(patient)
      return patient
    },
    updatePatient: async (id, data) => {
      const index = patients.findIndex((patient) => patient.id === id)
      if (index < 0) throw new ApiError('Paciente não encontrado.', 404)
      const cpf = data.cpf.replace(/\D/g, '')
      checkCpf(cpf, id)
      const patient = { ...data, cpf, id }
      patients[index] = patient
      return patient
    },
  }
}
