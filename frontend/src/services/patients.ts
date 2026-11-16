import { ApiError, request } from '../api'
import type { Page, Patient, PatientInput, PatientsService } from '../types'

type PatientPage = Omit<Page<Patient>, 'number'> & { page: number }

export function createPatientsService(token: string): PatientsService {
  async function save(path: string, method: string, data: PatientInput): Promise<Patient> {
    try {
      const payload: Record<string, unknown> = {
        nome: data.nome,
        cpf: data.cpf,
        dataNascimento: data.dataNascimento,
        sexo: data.sexo,
        telefone: data.telefone,
      }
      if (data.alergias && data.alergias.length > 0) {
        payload.alergias = data.alergias
      }
      if (data.vacinas && data.vacinas.length > 0) {
        payload.vacinas = data.vacinas
      }
      return await request<Patient>(path, { method, body: JSON.stringify(payload) }, token)
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
    deletePatient: (id) => request<void>(`/patients/${encodeURIComponent(id)}`, { method: 'DELETE' }, token),
    listAllergies: (patientId, signal) =>
      request(`/patients/${encodeURIComponent(patientId)}/allergies`, { signal }, token),
    addAllergy: (patientId, data) =>
      request(`/patients/${encodeURIComponent(patientId)}/allergies`, {
        method: 'POST',
        body: JSON.stringify(data),
      }, token),
    updateAllergy: (patientId, allergyId, data) =>
      request(`/patients/${encodeURIComponent(patientId)}/allergies/${encodeURIComponent(allergyId)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }, token),
    deleteAllergy: (patientId, allergyId) =>
      request<void>(`/patients/${encodeURIComponent(patientId)}/allergies/${encodeURIComponent(allergyId)}`, {
        method: 'DELETE',
      }, token),
    listVaccines: (patientId, signal) =>
      request(`/patients/${encodeURIComponent(patientId)}/vaccines`, { signal }, token),
    addVaccine: (patientId, data) =>
      request(`/patients/${encodeURIComponent(patientId)}/vaccines`, {
        method: 'POST',
        body: JSON.stringify(data),
      }, token),
    updateVaccine: (patientId, vaccineId, data) =>
      request(`/patients/${encodeURIComponent(patientId)}/vaccines/${encodeURIComponent(vaccineId)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }, token),
    deleteVaccine: (patientId, vaccineId) =>
      request<void>(`/patients/${encodeURIComponent(patientId)}/vaccines/${encodeURIComponent(vaccineId)}`, {
        method: 'DELETE',
      }, token),
  }
}
