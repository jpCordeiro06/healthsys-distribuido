import { ApiError, request } from '../api'
import type {
  Diagnosis,
  DiagnosisInput,
  ExamResult,
  ExamResultInput,
  MedicalExam,
  MedicalExamInput,
  MedicalRecord,
  MedicalRecordsService,
} from '../types'

export function createMedicalRecordsService(token: string): MedicalRecordsService {
  return {
    getRecordByPatientId: async (patientId: string, signal?: AbortSignal) => {
      try {
        return await request<MedicalRecord>(
          `/medical-records/patient/${encodeURIComponent(patientId)}`,
          { signal },
          token,
        )
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null
        }
        throw error
      }
    },

    getRecord: (id: string, signal?: AbortSignal) =>
      request<MedicalRecord>(`/medical-records/${encodeURIComponent(id)}`, { signal }, token),

    createRecord: (patientId: string) =>
      request<MedicalRecord>(
        '/medical-records',
        {
          method: 'POST',
          body: JSON.stringify({ patientId }),
        },
        token,
      ),

    createExam: (data: MedicalExamInput) =>
      request<MedicalExam>(
        '/medical-exams',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
        token,
      ),

    updateExam: (id: string, data: MedicalExamInput) =>
      request<MedicalExam>(
        `/medical-exams/${encodeURIComponent(id)}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        },
        token,
      ),

    deleteExam: (id: string) =>
      request<void>(`/medical-exams/${encodeURIComponent(id)}`, { method: 'DELETE' }, token),

    createExamResult: (data: ExamResultInput) =>
      request<ExamResult>(
        '/exam-results',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
        token,
      ),

    updateExamResult: (id: string, data: ExamResultInput) =>
      request<ExamResult>(
        `/exam-results/${encodeURIComponent(id)}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        },
        token,
      ),

    validateExamResult: (id: string, validated: boolean) =>
      request<ExamResult>(
        `/exam-results/${encodeURIComponent(id)}/validate`,
        {
          method: 'PATCH',
          body: JSON.stringify({ validated }),
        },
        token,
      ),

    deleteExamResult: (id: string) =>
      request<void>(`/exam-results/${encodeURIComponent(id)}`, { method: 'DELETE' }, token),

    createDiagnosis: (data: DiagnosisInput) =>
      request<Diagnosis>(
        '/diagnoses',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
        token,
      ),

    updateDiagnosis: (id: string, data: DiagnosisInput) =>
      request<Diagnosis>(
        `/diagnoses/${encodeURIComponent(id)}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        },
        token,
      ),

    validateDiagnosis: (id: string, validated: boolean) =>
      request<Diagnosis>(
        `/diagnoses/${encodeURIComponent(id)}/validate`,
        {
          method: 'PATCH',
          body: JSON.stringify({ validated }),
        },
        token,
      ),

    deleteDiagnosis: (id: string) =>
      request<void>(`/diagnoses/${encodeURIComponent(id)}`, { method: 'DELETE' }, token),
  }
}
