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

export type UserUpdateInput = Omit<UserInput, 'senha'> & { senha?: string }

export interface Page<T> {
  content: T[]
  number: number
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
  updateUser: (id: string, data: UserUpdateInput) => Promise<User>
  deleteUser: (id: string) => Promise<void>
}


export interface PatientAllergy {
  id: string
  alergeno: string
  reacao: string | null
  observacoes: string | null
}

export interface PatientAllergyInput {
  alergeno: string
  reacao?: string | null
  observacoes?: string | null
}

export interface PatientVaccine {
  id: string
  vacina: string
  dose: string
  dataAplicacao: string
  lote: string | null
  proximaDose: string | null
}

export interface PatientVaccineInput {
  vacina: string
  dose: string
  dataAplicacao: string
  lote?: string | null
  proximaDose?: string | null
}

export interface Patient {
  id: string
  nome: string
  cpf: string
  dataNascimento: string
  sexo: string
  telefone: string | null
  alergias?: PatientAllergy[]
  vacinas?: PatientVaccine[]
}

export interface PatientInput {
  nome: string
  cpf: string
  dataNascimento: string
  sexo: string
  telefone: string
  alergias?: PatientAllergyInput[]
  vacinas?: PatientVaccineInput[]
}

export interface PatientsService {
  listPatients: (page: number, signal?: AbortSignal) => Promise<Page<Patient>>
  createPatient: (data: PatientInput) => Promise<Patient>
  updatePatient: (id: string, data: PatientInput) => Promise<Patient>
  deletePatient: (id: string) => Promise<void>
  listAllergies: (patientId: string, signal?: AbortSignal) => Promise<PatientAllergy[]>
  addAllergy: (patientId: string, data: PatientAllergyInput) => Promise<PatientAllergy>
  updateAllergy: (patientId: string, allergyId: string, data: PatientAllergyInput) => Promise<PatientAllergy>
  deleteAllergy: (patientId: string, allergyId: string) => Promise<void>
  listVaccines: (patientId: string, signal?: AbortSignal) => Promise<PatientVaccine[]>
  addVaccine: (patientId: string, data: PatientVaccineInput) => Promise<PatientVaccine>
  updateVaccine: (patientId: string, vaccineId: string, data: PatientVaccineInput) => Promise<PatientVaccine>
  deleteVaccine: (patientId: string, vaccineId: string) => Promise<void>
}

export type ScreeningStatus = 'AGUARDANDO' | 'ATENDIDO' | 'DESISTIU'

export const screeningStatusLabels: Record<ScreeningStatus, string> = {
  AGUARDANDO: 'Aguardando',
  ATENDIDO: 'Atendido',
  DESISTIU: 'Desistiu',
}

export interface RiskClassification {
  id: string
  name: string
  description?: string | null
  priorityLevel: number
  active?: boolean
}

export interface Symptom {
  id: string
  name: string
  description?: string | null
  active?: boolean
}

export interface Screening {
  id: string
  patientId: string
  doctorId?: string | null
  riskClassification?: RiskClassification | null
  status: ScreeningStatus
  screeningDate: string
  updatedAt?: string
  notes?: string | null
  symptoms?: Symptom[]
}

export interface ScreeningInput {
  patientId: string
  doctorId?: string | null
  riskClassificationId?: string | null
  status?: ScreeningStatus
  screeningDate?: string | null
  notes?: string | null
  symptomIds?: string[]
}

export interface TriageService {
  listScreenings: (
    filter?: { patientId?: string; status?: ScreeningStatus },
    signal?: AbortSignal,
  ) => Promise<Screening[]>
  getScreening: (id: string, signal?: AbortSignal) => Promise<Screening>
  createScreening: (data: ScreeningInput) => Promise<Screening>
  updateScreening: (id: string, data: ScreeningInput) => Promise<Screening>
  updateScreeningStatus: (id: string, status: ScreeningStatus) => Promise<Screening>
  deleteScreening: (id: string) => Promise<void>
  listRiskClassifications: (signal?: AbortSignal) => Promise<RiskClassification[]>
  listSymptoms: (signal?: AbortSignal) => Promise<Symptom[]>
}

export type NotificationType =
  | 'SYSTEM'
  | 'APPOINTMENT'
  | 'EXAM_RESULT'
  | 'TRIAGE_ALERT'
  | 'EMERGENCY'
  | 'GENERAL'
  | 'REMINDER'

export const notificationTypeLabels: Record<NotificationType, string> = {
  SYSTEM: 'Sistema',
  APPOINTMENT: 'Agendamento',
  EXAM_RESULT: 'Resultado de Exame',
  TRIAGE_ALERT: 'Alerta de Triagem',
  EMERGENCY: 'Emergência',
  GENERAL: 'Geral',
  REMINDER: 'Lembrete',
}

export interface NotificationChannel {
  id: string
  name: string
  description: string
  active: boolean
}

export interface NotificationChannelInput {
  name: string
  description?: string
  active?: boolean
}

export interface Notification {
  id: string
  senderId?: string | null
  receiverId: string
  type: NotificationType
  title: string
  message: string
  sentAt: string
  readAt?: string | null
  isRead: boolean
  isUrgent: boolean
  channel?: NotificationChannel | null
}

export interface NotificationInput {
  senderId?: string | null
  receiverId: string
  type?: NotificationType
  title: string
  message: string
  isUrgent?: boolean
  notificationChannelId?: string | null
}

export interface NotificationFilter {
  receiverId?: string
  senderId?: string
  isRead?: boolean
  isUrgent?: boolean
  type?: NotificationType
  channelId?: string
}

export interface NotificationsService {
  listNotifications: (filter?: NotificationFilter, signal?: AbortSignal) => Promise<Notification[]>
  getNotification: (id: string, signal?: AbortSignal) => Promise<Notification>
  getUnreadCount: (receiverId: string, signal?: AbortSignal) => Promise<number>
  createNotification: (data: NotificationInput) => Promise<Notification>
  markAsRead: (id: string) => Promise<Notification>
  markAsUnread: (id: string) => Promise<Notification>
  deleteNotification: (id: string) => Promise<void>
  listChannels: (active?: boolean, signal?: AbortSignal) => Promise<NotificationChannel[]>
  getChannel: (id: string, signal?: AbortSignal) => Promise<NotificationChannel>
  createChannel: (data: NotificationChannelInput) => Promise<NotificationChannel>
  updateChannel: (id: string, data: NotificationChannelInput) => Promise<NotificationChannel>
  deleteChannel: (id: string) => Promise<void>
}

export interface ExamResult {
  id: string
  medicalExamId?: string
  resultDate: string
  resultSummary: string
  detailedReport?: string | null
  laboratoryName?: string | null
  validated: boolean
}

export interface ExamResultInput {
  medicalExamId: string
  resultDate?: string | null
  resultSummary: string
  detailedReport?: string | null
  laboratoryName?: string | null
  validated?: boolean
}

export interface MedicalExam {
  id: string
  medicalRecordId: string
  patientId?: string
  type: string
  date: string
  doctorId?: string | null
  hasResult: boolean
  results: ExamResult[]
}

export interface MedicalExamInput {
  medicalRecordId: string
  type: string
  date?: string | null
  doctorId?: string | null
  hasResult?: boolean
}

export interface Diagnosis {
  id: string
  medicalRecordId: string
  patientId?: string
  description: string
  doctorId?: string | null
  date: string
  laboratoryName?: string | null
  validated: boolean
}

export interface DiagnosisInput {
  medicalRecordId: string
  description: string
  doctorId?: string | null
  date?: string | null
  laboratoryName?: string | null
  validated?: boolean
}

export interface MedicalRecord {
  id: string
  patientId: string
  createdAt: string
  updatedAt: string
  exams: MedicalExam[]
  diagnoses: Diagnosis[]
}

export interface MedicalRecordsService {
  getRecordByPatientId: (patientId: string, signal?: AbortSignal) => Promise<MedicalRecord | null>
  getRecord: (id: string, signal?: AbortSignal) => Promise<MedicalRecord>
  createRecord: (patientId: string) => Promise<MedicalRecord>
  createExam: (data: MedicalExamInput) => Promise<MedicalExam>
  updateExam: (id: string, data: MedicalExamInput) => Promise<MedicalExam>
  deleteExam: (id: string) => Promise<void>
  createExamResult: (data: ExamResultInput) => Promise<ExamResult>
  updateExamResult: (id: string, data: ExamResultInput) => Promise<ExamResult>
  validateExamResult: (id: string, validated: boolean) => Promise<ExamResult>
  deleteExamResult: (id: string) => Promise<void>
  createDiagnosis: (data: DiagnosisInput) => Promise<Diagnosis>
  updateDiagnosis: (id: string, data: DiagnosisInput) => Promise<Diagnosis>
  validateDiagnosis: (id: string, validated: boolean) => Promise<Diagnosis>
  deleteDiagnosis: (id: string) => Promise<void>
}
