import { ApiError } from '../api'
import type {
  Session,
  User,
  UsersService,
  Patient,
  PatientAllergy,
  PatientVaccine,
  PatientsService,
  RiskClassification,
  Symptom,
  Screening,
  ScreeningStatus,
  TriageService,
} from '../types'

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
    deleteUser: async (id) => {
      const index = users.findIndex((user) => user.id === id)
      if (index < 0) throw new ApiError('Usuário não encontrado.', 404)
      users.splice(index, 1)
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
  const allergiesMap: Record<string, PatientAllergy[]> = {
    'demo-patient-1': [
      {
        id: 'demo-allergy-1',
        alergeno: 'Penicilina',
        reacao: 'Erupção cutânea e prurido',
        observacoes: 'Identificado em 2018',
      },
      {
        id: 'demo-allergy-2',
        alergeno: 'Dipirona',
        reacao: 'Edema de lábios',
        observacoes: 'Evitar analgésicos derivados',
      },
    ],
    'demo-patient-2': [],
  }
  const vaccinesMap: Record<string, PatientVaccine[]> = {
    'demo-patient-1': [
      {
        id: 'demo-vaccine-1',
        vacina: 'Febre Amarela',
        dose: 'Dose única',
        dataAplicacao: '2021-03-15',
        lote: 'FA202103',
        proximaDose: null,
      },
      {
        id: 'demo-vaccine-2',
        vacina: 'Influenza (Gripe)',
        dose: 'Anual',
        dataAplicacao: '2024-04-10',
        lote: 'INF2024-B',
        proximaDose: '2025-04-10',
      },
    ],
    'demo-patient-2': [
      {
        id: 'demo-vaccine-3',
        vacina: 'COVID-19 (Pfizer bivalente)',
        dose: 'Reforço',
        dataAplicacao: '2023-11-05',
        lote: 'PF77881',
        proximaDose: null,
      },
    ],
  }

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
      const patientId = crypto.randomUUID()
      const allergiesList: PatientAllergy[] = data.alergias
        ? data.alergias.map((a) => ({
            id: crypto.randomUUID(),
            alergeno: a.alergeno,
            reacao: a.reacao ?? null,
            observacoes: a.observacoes ?? null,
          }))
        : []
      const vaccinesList: PatientVaccine[] = data.vacinas
        ? data.vacinas.map((v) => ({
            id: crypto.randomUUID(),
            vacina: v.vacina,
            dose: v.dose,
            dataAplicacao: v.dataAplicacao,
            lote: v.lote ?? null,
            proximaDose: v.proximaDose ?? null,
          }))
        : []

      allergiesMap[patientId] = allergiesList
      vaccinesMap[patientId] = vaccinesList

      const patient: Patient = {
        id: patientId,
        nome: data.nome,
        cpf,
        dataNascimento: data.dataNascimento,
        sexo: data.sexo,
        telefone: data.telefone || null,
        alergias: allergiesList,
        vacinas: vaccinesList,
      }
      patients.push(patient)
      return patient
    },
    updatePatient: async (id, data) => {
      const index = patients.findIndex((patient) => patient.id === id)
      if (index < 0) throw new ApiError('Paciente não encontrado.', 404)
      const cpf = data.cpf.replace(/\D/g, '')
      checkCpf(cpf, id)

      if (data.alergias) {
        allergiesMap[id] = data.alergias.map((a) => ({
          id: crypto.randomUUID(),
          alergeno: a.alergeno,
          reacao: a.reacao ?? null,
          observacoes: a.observacoes ?? null,
        }))
      }
      if (data.vacinas) {
        vaccinesMap[id] = data.vacinas.map((v) => ({
          id: crypto.randomUUID(),
          vacina: v.vacina,
          dose: v.dose,
          dataAplicacao: v.dataAplicacao,
          lote: v.lote ?? null,
          proximaDose: v.proximaDose ?? null,
        }))
      }

      const patient: Patient = {
        id,
        nome: data.nome,
        cpf,
        dataNascimento: data.dataNascimento,
        sexo: data.sexo,
        telefone: data.telefone || null,
        alergias: allergiesMap[id],
        vacinas: vaccinesMap[id],
      }
      patients[index] = patient
      return patient
    },
    deletePatient: async (id) => {
      const index = patients.findIndex((patient) => patient.id === id)
      if (index < 0) throw new ApiError('Paciente não encontrado.', 404)
      patients.splice(index, 1)
      delete allergiesMap[id]
      delete vaccinesMap[id]
    },
    listAllergies: async (patientId) => {
      return [...(allergiesMap[patientId] ?? [])]
    },
    addAllergy: async (patientId, data) => {
      if (!allergiesMap[patientId]) allergiesMap[patientId] = []
      const item = {
        id: crypto.randomUUID(),
        alergeno: data.alergeno,
        reacao: data.reacao ?? null,
        observacoes: data.observacoes ?? null,
      }
      allergiesMap[patientId].push(item)
      return item
    },
    updateAllergy: async (patientId, allergyId, data) => {
      const list = allergiesMap[patientId] ?? []
      const idx = list.findIndex((a) => a.id === allergyId)
      if (idx < 0) throw new ApiError('Alergia não encontrada.', 404)
      const item = {
        id: allergyId,
        alergeno: data.alergeno,
        reacao: data.reacao ?? null,
        observacoes: data.observacoes ?? null,
      }
      list[idx] = item
      return item
    },
    deleteAllergy: async (patientId, allergyId) => {
      const list = allergiesMap[patientId] ?? []
      const idx = list.findIndex((a) => a.id === allergyId)
      if (idx >= 0) list.splice(idx, 1)
    },
    listVaccines: async (patientId) => {
      return [...(vaccinesMap[patientId] ?? [])]
    },
    addVaccine: async (patientId, data) => {
      if (!vaccinesMap[patientId]) vaccinesMap[patientId] = []
      const item = {
        id: crypto.randomUUID(),
        vacina: data.vacina,
        dose: data.dose,
        dataAplicacao: data.dataAplicacao,
        lote: data.lote ?? null,
        proximaDose: data.proximaDose ?? null,
      }
      vaccinesMap[patientId].push(item)
      return item
    },
    updateVaccine: async (patientId, vaccineId, data) => {
      const list = vaccinesMap[patientId] ?? []
      const idx = list.findIndex((v) => v.id === vaccineId)
      if (idx < 0) throw new ApiError('Vacina não encontrada.', 404)
      const item = {
        id: vaccineId,
        vacina: data.vacina,
        dose: data.dose,
        dataAplicacao: data.dataAplicacao,
        lote: data.lote ?? null,
        proximaDose: data.proximaDose ?? null,
      }
      list[idx] = item
      return item
    },
    deleteVaccine: async (patientId, vaccineId) => {
      const list = vaccinesMap[patientId] ?? []
      const idx = list.findIndex((v) => v.id === vaccineId)
      if (idx >= 0) list.splice(idx, 1)
    },
  }
}

export function createDemoTriageService(): TriageService {
  const riskClassifications: RiskClassification[] = [
    {
      id: 'rc-1',
      name: 'Emergência (Vermelho)',
      description: 'Atendimento imediato com risco iminente de morte',
      priorityLevel: 1,
      active: true,
    },
    {
      id: 'rc-2',
      name: 'Muito Urgente (Laranja)',
      description: 'Atendimento em até 10 minutos',
      priorityLevel: 2,
      active: true,
    },
    {
      id: 'rc-3',
      name: 'Urgente (Amarelo)',
      description: 'Atendimento em até 60 minutos',
      priorityLevel: 3,
      active: true,
    },
    {
      id: 'rc-4',
      name: 'Pouco Urgente (Verde)',
      description: 'Atendimento em até 120 minutos',
      priorityLevel: 4,
      active: true,
    },
    {
      id: 'rc-5',
      name: 'Não Urgente (Azul)',
      description: 'Atendimento em até 240 minutos',
      priorityLevel: 5,
      active: true,
    },
  ]

  const symptoms: Symptom[] = [
    { id: 'sym-1', name: 'Febre alta (> 39°C)', description: 'Temperatura corporal elevada', active: true },
    { id: 'sym-2', name: 'Dor no peito', description: 'Dor torácica de forte intensidade', active: true },
    { id: 'sym-3', name: 'Falta de ar', description: 'Dispneia ou esforço respiratório', active: true },
    { id: 'sym-4', name: 'Cefaleia intensa', description: 'Dor de cabeça aguda ou persistente', active: true },
    { id: 'sym-5', name: 'Náuseas e vômitos', description: 'Desconforto gástrico acompanhado de vômito', active: true },
    { id: 'sym-6', name: 'Dor abdominal aguda', description: 'Dor na região do abdômen', active: true },
    { id: 'sym-7', name: 'Tontura e vertigem', description: 'Sensação de perda de equilíbrio ou desmaio', active: true },
    { id: 'sym-8', name: 'Tosse persistente', description: 'Tosse seca ou produtiva há mais de 3 dias', active: true },
  ]

  const screenings: Screening[] = [
    {
      id: 'demo-screening-1',
      patientId: 'demo-patient-1',
      doctorId: 'demo-user-2',
      riskClassification: riskClassifications[1], // Muito Urgente
      status: 'AGUARDANDO',
      screeningDate: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      notes: 'Paciente relata dor torácica de início súbito acompanhada de falta de ar.',
      symptoms: [symptoms[1], symptoms[2]],
    },
    {
      id: 'demo-screening-2',
      patientId: 'demo-patient-2',
      doctorId: 'demo-user-2',
      riskClassification: riskClassifications[3], // Pouco Urgente
      status: 'ATENDIDO',
      screeningDate: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
      notes: 'Quadro gripal leve. Paciente já atendido e medicado.',
      symptoms: [symptoms[0], symptoms[7]],
    },
  ]

  return {
    listScreenings: async (filter) => {
      let result = [...screenings]
      if (filter?.patientId) {
        result = result.filter((s) => s.patientId === filter.patientId)
      }
      if (filter?.status) {
        result = result.filter((s) => s.status === filter.status)
      }
      return result.sort(
        (a, b) => new Date(b.screeningDate).getTime() - new Date(a.screeningDate).getTime(),
      )
    },
    getScreening: async (id) => {
      const screening = screenings.find((s) => s.id === id)
      if (!screening) throw new ApiError('Triagem não encontrada.', 404)
      return screening
    },
    createScreening: async (data) => {
      if (!data.patientId) {
        throw new ApiError('Paciente é obrigatório para a triagem.', 400, {
          patientId: ['Selecione ou informe um paciente.'],
        })
      }
      const selectedRisk = data.riskClassificationId
        ? riskClassifications.find((rc) => rc.id === data.riskClassificationId) ?? null
        : null
      const selectedSymptoms = (data.symptomIds ?? [])
        .map((sId) => symptoms.find((s) => s.id === sId))
        .filter((s): s is Symptom => s !== undefined)

      const screening: Screening = {
        id: crypto.randomUUID(),
        patientId: data.patientId,
        doctorId: data.doctorId ?? null,
        riskClassification: selectedRisk,
        status: data.status ?? 'AGUARDANDO',
        screeningDate: data.screeningDate || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: data.notes ?? null,
        symptoms: selectedSymptoms,
      }
      screenings.unshift(screening)
      return screening
    },
    updateScreening: async (id, data) => {
      const index = screenings.findIndex((s) => s.id === id)
      if (index < 0) throw new ApiError('Triagem não encontrada.', 404)
      const selectedRisk = data.riskClassificationId
        ? riskClassifications.find((rc) => rc.id === data.riskClassificationId) ?? null
        : null
      const selectedSymptoms = (data.symptomIds ?? [])
        .map((sId) => symptoms.find((s) => s.id === sId))
        .filter((s): s is Symptom => s !== undefined)

      const updated: Screening = {
        ...screenings[index],
        patientId: data.patientId,
        doctorId: data.doctorId ?? null,
        riskClassification: selectedRisk,
        status: data.status ?? screenings[index].status,
        screeningDate: data.screeningDate || screenings[index].screeningDate,
        updatedAt: new Date().toISOString(),
        notes: data.notes ?? null,
        symptoms: selectedSymptoms,
      }
      screenings[index] = updated
      return updated
    },
    updateScreeningStatus: async (id, status: ScreeningStatus) => {
      const index = screenings.findIndex((s) => s.id === id)
      if (index < 0) throw new ApiError('Triagem não encontrada.', 404)
      screenings[index].status = status
      screenings[index].updatedAt = new Date().toISOString()
      return screenings[index]
    },
    deleteScreening: async (id) => {
      const index = screenings.findIndex((s) => s.id === id)
      if (index < 0) throw new ApiError('Triagem não encontrada.', 404)
      screenings.splice(index, 1)
    },
    listRiskClassifications: async () => [...riskClassifications],
    listSymptoms: async () => [...symptoms],
  }
}
