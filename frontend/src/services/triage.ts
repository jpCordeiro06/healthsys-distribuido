import { request } from '../api'
import type {
  RiskClassification,
  Screening,
  ScreeningInput,
  ScreeningStatus,
  Symptom,
  TriageService,
} from '../types'

export function createTriageService(token: string): TriageService {
  return {
    listScreenings: async (filter, signal) => {
      const params = new URLSearchParams()
      if (filter?.patientId) {
        params.append('patientId', filter.patientId)
      }
      if (filter?.status) {
        params.append('status', filter.status)
      }
      const query = params.toString() ? `?${params.toString()}` : ''
      return await request<Screening[]>(`/screenings${query}`, { signal }, token)
    },
    getScreening: (id, signal) =>
      request<Screening>(`/screenings/${encodeURIComponent(id)}`, { signal }, token),
    createScreening: (data: ScreeningInput) =>
      request<Screening>(
        '/screenings',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
        token,
      ),
    updateScreening: (id: string, data: ScreeningInput) =>
      request<Screening>(
        `/screenings/${encodeURIComponent(id)}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        },
        token,
      ),
    updateScreeningStatus: (id: string, status: ScreeningStatus) =>
      request<Screening>(
        `/screenings/${encodeURIComponent(id)}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        },
        token,
      ),
    deleteScreening: (id: string) =>
      request<void>(`/screenings/${encodeURIComponent(id)}`, { method: 'DELETE' }, token),
    listRiskClassifications: (signal) =>
      request<RiskClassification[]>('/risk-classifications', { signal }, token),
    listSymptoms: (signal) => request<Symptom[]>('/symptoms', { signal }, token),
  }
}
