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
  Notification,
  NotificationChannel,
  NotificationChannelInput,
  NotificationFilter,
  NotificationInput,
  NotificationsService,
  MedicalRecord,
  MedicalExam,
  MedicalExamInput,
  ExamResult,
  ExamResultInput,
  Diagnosis,
  DiagnosisInput,
  MedicalRecordsService,
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

export function createDemoNotificationsService(): NotificationsService {
  const channels: NotificationChannel[] = [
    { id: 'chan-1', name: 'Email', description: 'Envio por correio eletrônico', active: true },
    { id: 'chan-2', name: 'SMS', description: 'Mensagem de texto para celular', active: true },
    { id: 'chan-3', name: 'WebSocket', description: 'Notificação em tempo real no navegador', active: true },
    { id: 'chan-4', name: 'Push', description: 'Notificação push em aplicativo móvel', active: true },
    { id: 'chan-5', name: 'WhatsApp', description: 'Mensagem via WhatsApp Business API', active: true },
  ]

  const notifications: Notification[] = [
    {
      id: 'demo-notif-1',
      senderId: null,
      receiverId: 'demo-user-1',
      type: 'TRIAGE_ALERT',
      title: 'ALERTA DE RISCO - Paciente Prioritário (LARANJA)',
      message: 'Paciente Ana Exemplo classificado com prioridade alta/crítica (MUITO URGENTE). Risco LARANJA.',
      sentAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      readAt: null,
      isRead: false,
      isUrgent: true,
      channel: channels[2], // WebSocket
    },
    {
      id: 'demo-notif-2',
      senderId: 'demo-user-2',
      receiverId: 'demo-user-1',
      type: 'EXAM_RESULT',
      title: 'Novo Resultado de Exame Disponível',
      message: 'O exame de Hemograma Completo do paciente Bruno Exemplo foi processado e registrado.',
      sentAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      readAt: null,
      isRead: false,
      isUrgent: false,
      channel: channels[0], // Email
    },
    {
      id: 'demo-notif-3',
      senderId: null,
      receiverId: 'demo-user-1',
      type: 'SYSTEM',
      title: 'Manutenção Programada do Sistema',
      message: 'O subsistema de prontuários passará por atualização preventiva no próximo domingo às 02h.',
      sentAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
      readAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      isRead: true,
      isUrgent: false,
      channel: channels[2], // WebSocket
    },
    {
      id: 'demo-notif-4',
      senderId: 'demo-user-3',
      receiverId: 'demo-patient-1',
      type: 'APPOINTMENT',
      title: 'Confirmação de Consulta Médica',
      message: 'Sua consulta médica com Dr. Marina foi confirmada para amanhã às 14:30.',
      sentAt: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
      readAt: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
      isRead: true,
      isUrgent: false,
      channel: channels[1], // SMS
    },
  ]

  return {
    listNotifications: async (filter?: NotificationFilter) => {
      let result = [...notifications]
      if (filter?.receiverId) {
        result = result.filter((n) => n.receiverId === filter.receiverId)
      }
      if (filter?.senderId) {
        result = result.filter((n) => n.senderId === filter.senderId)
      }
      if (filter?.isRead !== undefined) {
        result = result.filter((n) => n.isRead === filter.isRead)
      }
      if (filter?.isUrgent !== undefined) {
        result = result.filter((n) => n.isUrgent === filter.isUrgent)
      }
      if (filter?.type) {
        result = result.filter((n) => n.type === filter.type)
      }
      if (filter?.channelId) {
        result = result.filter((n) => n.channel?.id === filter.channelId)
      }
      return result.sort(
        (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
      )
    },

    getNotification: async (id: string) => {
      const notif = notifications.find((n) => n.id === id)
      if (!notif) throw new ApiError('Notificação não encontrada.', 404)
      return notif
    },

    getUnreadCount: async (receiverId: string) => {
      return notifications.filter((n) => n.receiverId === receiverId && !n.isRead).length
    },

    createNotification: async (data: NotificationInput) => {
      if (!data.receiverId) {
        throw new ApiError('Destinatário é obrigatório.', 400, {
          receiverId: ['Selecione ou informe um destinatário.'],
        })
      }
      if (!data.title?.trim()) {
        throw new ApiError('Título é obrigatório.', 400, {
          title: ['Informe o título da notificação.'],
        })
      }
      if (!data.message?.trim()) {
        throw new ApiError('Mensagem é obrigatória.', 400, {
          message: ['Informe o conteúdo da notificação.'],
        })
      }

      const channel = data.notificationChannelId
        ? channels.find((c) => c.id === data.notificationChannelId) ?? null
        : null

      const notif: Notification = {
        id: crypto.randomUUID(),
        senderId: data.senderId ?? null,
        receiverId: data.receiverId,
        type: data.type ?? 'GENERAL',
        title: data.title.trim(),
        message: data.message.trim(),
        sentAt: new Date().toISOString(),
        readAt: null,
        isRead: false,
        isUrgent: data.isUrgent ?? false,
        channel,
      }
      notifications.unshift(notif)
      return notif
    },

    markAsRead: async (id: string) => {
      const index = notifications.findIndex((n) => n.id === id)
      if (index < 0) throw new ApiError('Notificação não encontrada.', 404)
      notifications[index] = {
        ...notifications[index],
        isRead: true,
        readAt: new Date().toISOString(),
      }
      return notifications[index]
    },

    markAsUnread: async (id: string) => {
      const index = notifications.findIndex((n) => n.id === id)
      if (index < 0) throw new ApiError('Notificação não encontrada.', 404)
      notifications[index] = {
        ...notifications[index],
        isRead: false,
        readAt: null,
      }
      return notifications[index]
    },

    deleteNotification: async (id: string) => {
      const index = notifications.findIndex((n) => n.id === id)
      if (index < 0) throw new ApiError('Notificação não encontrada.', 404)
      notifications.splice(index, 1)
    },

    listChannels: async (active?: boolean) => {
      if (active !== undefined) {
        return channels.filter((c) => c.active === active)
      }
      return [...channels]
    },

    getChannel: async (id: string) => {
      const channel = channels.find((c) => c.id === id)
      if (!channel) throw new ApiError('Canal de notificação não encontrado.', 404)
      return channel
    },

    createChannel: async (data: NotificationChannelInput) => {
      if (!data.name?.trim()) {
        throw new ApiError('Nome do canal é obrigatório.', 400, {
          name: ['Informe o nome do canal.'],
        })
      }
      if (channels.some((c) => c.name.toLowerCase() === data.name.trim().toLowerCase())) {
        throw new ApiError('Já existe um canal com este nome.', 409, {
          name: ['Nome de canal já cadastrado.'],
        })
      }
      const channel: NotificationChannel = {
        id: crypto.randomUUID(),
        name: data.name.trim(),
        description: data.description?.trim() ?? '',
        active: data.active ?? true,
      }
      channels.push(channel)
      return channel
    },

    updateChannel: async (id: string, data: NotificationChannelInput) => {
      const index = channels.findIndex((c) => c.id === id)
      if (index < 0) throw new ApiError('Canal de notificação não encontrado.', 404)
      if (
        data.name &&
        channels.some(
          (c) => c.id !== id && c.name.toLowerCase() === data.name.trim().toLowerCase(),
        )
      ) {
        throw new ApiError('Já existe um canal com este nome.', 409, {
          name: ['Nome de canal já cadastrado.'],
        })
      }
      const updated: NotificationChannel = {
        ...channels[index],
        name: data.name ? data.name.trim() : channels[index].name,
        description:
          data.description !== undefined ? data.description.trim() : channels[index].description,
        active: data.active !== undefined ? data.active : channels[index].active,
      }
      channels[index] = updated
      return updated
    },

    deleteChannel: async (id: string) => {
      const index = channels.findIndex((c) => c.id === id)
      if (index < 0) throw new ApiError('Canal de notificação não encontrado.', 404)
      channels.splice(index, 1)
    },
  }
}

export function createDemoMedicalRecordsService(): MedicalRecordsService {
  const records: MedicalRecord[] = [
    {
      id: 'demo-record-1',
      patientId: 'demo-patient-1',
      createdAt: '2024-01-15T09:00:00',
      updatedAt: '2024-06-20T14:30:00',
      diagnoses: [
        {
          id: 'demo-diag-1',
          medicalRecordId: 'demo-record-1',
          patientId: 'demo-patient-1',
          description: 'Rinite Alérgica Perene (CID J30.0)',
          doctorId: 'demo-user-2',
          date: '2024-01-15T09:30:00',
          laboratoryName: 'Clínica Geral / Alergologia',
          validated: true,
        },
        {
          id: 'demo-diag-2',
          medicalRecordId: 'demo-record-1',
          patientId: 'demo-patient-1',
          description: 'Hipertensão Essencial Estágio 1 (CID I10)',
          doctorId: 'demo-user-2',
          date: '2024-06-20T14:15:00',
          laboratoryName: 'Cardiologia',
          validated: true,
        },
      ],
      exams: [
        {
          id: 'demo-exam-1',
          medicalRecordId: 'demo-record-1',
          patientId: 'demo-patient-1',
          type: 'Hemograma Completo com Plaquetas',
          date: '2024-06-18T08:00:00',
          doctorId: 'demo-user-2',
          hasResult: true,
          results: [
            {
              id: 'demo-result-1',
              medicalExamId: 'demo-exam-1',
              resultDate: '2024-06-19T10:00:00',
              resultSummary:
                'Hemoglobina: 13.5 g/dL, Leucócitos: 6.800/mm³, Plaquetas: 240.000/mm³ (Parâmetros normais)',
              detailedReport:
                'Eritrograma sem alterações morfológicas. Série branca com contagem absoluta e relativa dentro da normalidade. Plaquetas com volume e agregação normais.',
              laboratoryName: 'Laboratório Central Diagnósticos',
              validated: true,
            },
          ],
        },
        {
          id: 'demo-exam-2',
          medicalRecordId: 'demo-record-1',
          patientId: 'demo-patient-1',
          type: 'Eletrocardiograma de Repouso',
          date: '2024-06-19T11:30:00',
          doctorId: 'demo-user-2',
          hasResult: true,
          results: [
            {
              id: 'demo-result-2',
              medicalExamId: 'demo-exam-2',
              resultDate: '2024-06-19T12:00:00',
              resultSummary:
                'Ritmo sinusal regular, FC 72 bpm, sem alterações agudas do segmento ST-T',
              detailedReport:
                'Traçado dentro dos limites da normalidade para a faixa etária. Eixo elétrico preservado (SÂQRS a +60°). Condução AV normal.',
              laboratoryName: 'Setor de Métodos Gráficos',
              validated: true,
            },
          ],
        },
      ],
    },
    {
      id: 'demo-record-2',
      patientId: 'demo-patient-2',
      createdAt: '2024-08-10T09:00:00',
      updatedAt: '2024-08-12T08:00:00',
      diagnoses: [
        {
          id: 'demo-diag-3',
          medicalRecordId: 'demo-record-2',
          patientId: 'demo-patient-2',
          description: 'Gastrite Aguda (CID K29.1)',
          doctorId: 'demo-user-2',
          date: '2024-08-10T10:00:00',
          laboratoryName: 'Gastroenterologia',
          validated: false,
        },
      ],
      exams: [
        {
          id: 'demo-exam-3',
          medicalRecordId: 'demo-record-2',
          patientId: 'demo-patient-2',
          type: 'Endoscopia Digestiva Alta',
          date: '2024-08-12T07:30:00',
          doctorId: 'demo-user-2',
          hasResult: false,
          results: [],
        },
      ],
    },
  ]

  function findRecordByPatient(patientId: string): MedicalRecord | undefined {
    return records.find((r) => r.patientId === patientId)
  }

  return {
    getRecordByPatientId: async (patientId: string) => {
      const record = findRecordByPatient(patientId)
      return record ?? null
    },

    getRecord: async (id: string) => {
      const record = records.find((r) => r.id === id)
      if (!record) throw new ApiError('Prontuário não encontrado.', 404)
      return record
    },

    createRecord: async (patientId: string) => {
      const existing = findRecordByPatient(patientId)
      if (existing) {
        throw new ApiError('Prontuário já existe para este paciente.', 409)
      }
      const record: MedicalRecord = {
        id: crypto.randomUUID(),
        patientId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        exams: [],
        diagnoses: [],
      }
      records.push(record)
      return record
    },

    createExam: async (data: MedicalExamInput) => {
      if (!data.type?.trim()) {
        throw new ApiError('Tipo de exame é obrigatório.', 400, {
          type: ['Informe o tipo de exame.'],
        })
      }
      const record = records.find((r) => r.id === data.medicalRecordId)
      if (!record) throw new ApiError('Prontuário não encontrado.', 404)

      const exam: MedicalExam = {
        id: crypto.randomUUID(),
        medicalRecordId: data.medicalRecordId,
        patientId: record.patientId,
        type: data.type.trim(),
        date: data.date || new Date().toISOString(),
        doctorId: data.doctorId ?? null,
        hasResult: data.hasResult ?? false,
        results: [],
      }
      record.exams.push(exam)
      record.updatedAt = new Date().toISOString()
      return exam
    },

    updateExam: async (id: string, data: MedicalExamInput) => {
      for (const record of records) {
        const examIndex = record.exams.findIndex((e) => e.id === id)
        if (examIndex >= 0) {
          const current = record.exams[examIndex]
          const updated: MedicalExam = {
            ...current,
            type: data.type ? data.type.trim() : current.type,
            date: data.date ? data.date : current.date,
            doctorId: data.doctorId !== undefined ? data.doctorId : current.doctorId,
            hasResult: data.hasResult !== undefined ? data.hasResult : current.hasResult,
          }
          record.exams[examIndex] = updated
          record.updatedAt = new Date().toISOString()
          return updated
        }
      }
      throw new ApiError('Exame médico não encontrado.', 404)
    },

    deleteExam: async (id: string) => {
      for (const record of records) {
        const examIndex = record.exams.findIndex((e) => e.id === id)
        if (examIndex >= 0) {
          record.exams.splice(examIndex, 1)
          record.updatedAt = new Date().toISOString()
          return
        }
      }
      throw new ApiError('Exame médico não encontrado.', 404)
    },

    createExamResult: async (data: ExamResultInput) => {
      if (!data.resultSummary?.trim()) {
        throw new ApiError('Resumo do resultado é obrigatório.', 400, {
          resultSummary: ['Informe o resumo do resultado do exame.'],
        })
      }
      for (const record of records) {
        const exam = record.exams.find((e) => e.id === data.medicalExamId)
        if (exam) {
          const result: ExamResult = {
            id: crypto.randomUUID(),
            medicalExamId: data.medicalExamId,
            resultDate: data.resultDate || new Date().toISOString(),
            resultSummary: data.resultSummary.trim(),
            detailedReport: data.detailedReport?.trim() || null,
            laboratoryName: data.laboratoryName?.trim() || null,
            validated: data.validated ?? false,
          }
          exam.results.push(result)
          exam.hasResult = true
          record.updatedAt = new Date().toISOString()
          return result
        }
      }
      throw new ApiError('Exame médico não encontrado.', 404)
    },

    updateExamResult: async (id: string, data: ExamResultInput) => {
      for (const record of records) {
        for (const exam of record.exams) {
          const resIndex = exam.results.findIndex((r) => r.id === id)
          if (resIndex >= 0) {
            const current = exam.results[resIndex]
            const updated: ExamResult = {
              ...current,
              resultDate: data.resultDate || current.resultDate,
              resultSummary: data.resultSummary ? data.resultSummary.trim() : current.resultSummary,
              detailedReport:
                data.detailedReport !== undefined
                  ? data.detailedReport?.trim() || null
                  : current.detailedReport,
              laboratoryName:
                data.laboratoryName !== undefined
                  ? data.laboratoryName?.trim() || null
                  : current.laboratoryName,
              validated: data.validated !== undefined ? data.validated : current.validated,
            }
            exam.results[resIndex] = updated
            record.updatedAt = new Date().toISOString()
            return updated
          }
        }
      }
      throw new ApiError('Resultado de exame não encontrado.', 404)
    },

    validateExamResult: async (id: string, validated: boolean) => {
      for (const record of records) {
        for (const exam of record.exams) {
          const resIndex = exam.results.findIndex((r) => r.id === id)
          if (resIndex >= 0) {
            exam.results[resIndex] = {
              ...exam.results[resIndex],
              validated,
            }
            record.updatedAt = new Date().toISOString()
            return exam.results[resIndex]
          }
        }
      }
      throw new ApiError('Resultado de exame não encontrado.', 404)
    },

    deleteExamResult: async (id: string) => {
      for (const record of records) {
        for (const exam of record.exams) {
          const resIndex = exam.results.findIndex((r) => r.id === id)
          if (resIndex >= 0) {
            exam.results.splice(resIndex, 1)
            exam.hasResult = exam.results.length > 0
            record.updatedAt = new Date().toISOString()
            return
          }
        }
      }
      throw new ApiError('Resultado de exame não encontrado.', 404)
    },

    createDiagnosis: async (data: DiagnosisInput) => {
      if (!data.description?.trim()) {
        throw new ApiError('Descrição do diagnóstico é obrigatória.', 400, {
          description: ['Informe a descrição do diagnóstico.'],
        })
      }
      const record = records.find((r) => r.id === data.medicalRecordId)
      if (!record) throw new ApiError('Prontuário não encontrado.', 404)

      const diag: Diagnosis = {
        id: crypto.randomUUID(),
        medicalRecordId: data.medicalRecordId,
        patientId: record.patientId,
        description: data.description.trim(),
        doctorId: data.doctorId ?? null,
        date: data.date || new Date().toISOString(),
        laboratoryName: data.laboratoryName?.trim() || null,
        validated: data.validated ?? false,
      }
      record.diagnoses.push(diag)
      record.updatedAt = new Date().toISOString()
      return diag
    },

    updateDiagnosis: async (id: string, data: DiagnosisInput) => {
      for (const record of records) {
        const diagIndex = record.diagnoses.findIndex((d) => d.id === id)
        if (diagIndex >= 0) {
          const current = record.diagnoses[diagIndex]
          const updated: Diagnosis = {
            ...current,
            description: data.description ? data.description.trim() : current.description,
            doctorId: data.doctorId !== undefined ? data.doctorId : current.doctorId,
            date: data.date ? data.date : current.date,
            laboratoryName:
              data.laboratoryName !== undefined
                ? data.laboratoryName?.trim() || null
                : current.laboratoryName,
            validated: data.validated !== undefined ? data.validated : current.validated,
          }
          record.diagnoses[diagIndex] = updated
          record.updatedAt = new Date().toISOString()
          return updated
        }
      }
      throw new ApiError('Diagnóstico não encontrado.', 404)
    },

    validateDiagnosis: async (id: string, validated: boolean) => {
      for (const record of records) {
        const diagIndex = record.diagnoses.findIndex((d) => d.id === id)
        if (diagIndex >= 0) {
          record.diagnoses[diagIndex] = {
            ...record.diagnoses[diagIndex],
            validated,
          }
          record.updatedAt = new Date().toISOString()
          return record.diagnoses[diagIndex]
        }
      }
      throw new ApiError('Diagnóstico não encontrado.', 404)
    },

    deleteDiagnosis: async (id: string) => {
      for (const record of records) {
        const diagIndex = record.diagnoses.findIndex((d) => d.id === id)
        if (diagIndex >= 0) {
          record.diagnoses.splice(diagIndex, 1)
          record.updatedAt = new Date().toISOString()
          return
        }
      }
      throw new ApiError('Diagnóstico não encontrado.', 404)
    },
  }
}
