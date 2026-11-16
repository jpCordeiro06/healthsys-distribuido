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
