import { ApiError, request } from '../api'
import type { Page, Patient, PatientInput, PatientsService } from '../types'

type PatientPage = Omit<Page<Patient>, 'number'> & { page: number }

export function createPatientsService(token: string): PatientsService {
  async function save(path: string, method: string, data: PatientInput): Promise<Patient> {
    try {
      return await request<Patient>(path, { method, body: JSON.stringify(data) }, token)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        throw new ApiError('Já existe um paciente com este CPF.', 409, {
          cpf: ['Este CPF já está em uso.'],
        })
      }
      throw error
    }
  }

  return {
    listPatients: async (page, signal) => {
      const result = await request<PatientPage>(`/patients?page=${page}&size=10&sort=nome,asc`, { signal }, token)
      if (!Array.isArray(result?.content) || !Number.isInteger(result.page)) {
        throw new ApiError('A resposta de pacientes não segue o contrato paginado da API.', 502)
      }
      return { ...result, number: result.page }
    },
    createPatient: (data) => save('/patients', 'POST', data),
    updatePatient: (id, data) => save(`/patients/${encodeURIComponent(id)}`, 'PUT', data),
  }
}
