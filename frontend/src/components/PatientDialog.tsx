import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiError } from '../api'
import type {
  Diagnosis,
  DiagnosisInput,
  ExamResult,
  ExamResultInput,
  FieldErrors,
  MedicalExam,
  MedicalExamInput,
  MedicalRecord,
  MedicalRecordsService,
  Patient,
  PatientAllergy,
  PatientAllergyInput,
  PatientInput,
  PatientVaccine,
  PatientVaccineInput,
  PatientsService,
  Session,
} from '../types'
import { Icon } from './Icon'

interface Props {
  patient?: Patient
  session?: Session
  service: PatientsService
  recordsService?: MedicalRecordsService
  onClose: () => void
  onSaved: () => void
  onExpired: () => void
}

const fields: {
  name: 'nome' | 'cpf' | 'dataNascimento' | 'sexo' | 'telefone'
  label: string
  type?: string
  maxLength?: number
  required?: boolean
}[] = [
  { name: 'nome', label: 'Nome completo', maxLength: 150, required: true },
  { name: 'cpf', label: 'CPF', maxLength: 14, required: true },
  { name: 'dataNascimento', label: 'Data de nascimento', type: 'date', required: true },
  { name: 'sexo', label: 'Sexo', maxLength: 30, required: true },
  { name: 'telefone', label: 'Telefone', type: 'tel', maxLength: 30 },
]

const sexOptions = ['Feminino', 'Masculino', 'Intersexo', 'Não informado']

function validCpf(cpf: string) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false
  for (let length = 9; length <= 10; length++) {
    let sum = 0
    for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (length + 1 - i)
    const digit = (sum * 10) % 11
    if (Number(cpf[length]) !== (digit === 10 ? 0 : digit)) return false
  }
  return true
}

function formatDate(isoDate?: string | null) {
  if (!isoDate) return '—'
  const datePart = isoDate.includes('T') ? isoDate.split('T')[0] : isoDate
  const parts = datePart.split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return isoDate
}

function formatDateTime(isoString?: string | null) {
  if (!isoString) return '—'
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return isoString
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

export function PatientDialog({
  patient,
  service,
  recordsService,
  onClose,
  onSaved,
  onExpired,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [tab, setTab] = useState<'dados' | 'alergias' | 'vacinas' | 'historico'>('dados')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  // General fields state
  const [nome, setNome] = useState(() => patient?.nome ?? '')
  const [cpf, setCpf] = useState(() => patient?.cpf ?? '')
  const [dataNascimento, setDataNascimento] = useState(() => patient?.dataNascimento ?? '')
  const [sex, setSex] = useState(() =>
    patient?.sexo ? (sexOptions.includes(patient.sexo) ? patient.sexo : 'Outro') : '',
  )
  const [otherSex, setOtherSex] = useState(() =>
    patient?.sexo && !sexOptions.includes(patient.sexo) ? patient.sexo : '',
  )
  const [telefone, setTelefone] = useState(() => patient?.telefone ?? '')

  // Allergies state
  const [allergies, setAllergies] = useState<PatientAllergy[]>(() => patient?.alergias ?? [])
  const [allergiesLoading, setAllergiesLoading] = useState(() => Boolean(patient?.id))
  const [allergyError, setAllergyError] = useState('')
  const [allergyBusy, setAllergyBusy] = useState(false)
  const [showAllergyForm, setShowAllergyForm] = useState(false)
  const [editingAllergyId, setEditingAllergyId] = useState<string | null>(null)
  const [allergyAlergeno, setAllergyAlergeno] = useState('')
  const [allergyReacao, setAllergyReacao] = useState('')
  const [allergyObservacoes, setAllergyObservacoes] = useState('')

  // Vaccines state
  const [vaccines, setVaccines] = useState<PatientVaccine[]>(() => patient?.vacinas ?? [])
  const [vaccinesLoading, setVaccinesLoading] = useState(() => Boolean(patient?.id))
  const [vaccineError, setVaccineError] = useState('')
  const [vaccineBusy, setVaccineBusy] = useState(false)
  const [showVaccineForm, setShowVaccineForm] = useState(false)
  const [editingVaccineId, setEditingVaccineId] = useState<string | null>(null)
  const [vaccineVacina, setVaccineVacina] = useState('')
  const [vaccineDose, setVaccineDose] = useState('')
  const [vaccineDataAplicacao, setVaccineDataAplicacao] = useState('')
  const [vaccineLote, setVaccineLote] = useState('')
  const [vaccineProximaDose, setVaccineProximaDose] = useState('')

  // Medical Record state
  const [record, setRecord] = useState<MedicalRecord | null>(null)
  const [recordLoading, setRecordLoading] = useState(() => Boolean(patient?.id && recordsService))
  const [recordError, setRecordError] = useState('')
  const [recordBusy, setRecordBusy] = useState(false)
  const [historySection, setHistorySection] = useState<'all' | 'diagnoses' | 'exams'>('all')

  // Diagnoses state
  const [showDiagnosisForm, setShowDiagnosisForm] = useState(false)
  const [editingDiagnosisId, setEditingDiagnosisId] = useState<string | null>(null)
  const [diagnosisDescription, setDiagnosisDescription] = useState('')
  const [diagnosisDate, setDiagnosisDate] = useState('')
  const [diagnosisLabName, setDiagnosisLabName] = useState('')
  const [diagnosisValidated, setDiagnosisValidated] = useState(false)
  const [diagnosisError, setDiagnosisError] = useState('')

  // Exams state
  const [showExamForm, setShowExamForm] = useState(false)
  const [editingExamId, setEditingExamId] = useState<string | null>(null)
  const [examType, setExamType] = useState('')
  const [examDate, setExamDate] = useState('')
  const [examError, setExamError] = useState('')

  // Exam Result state
  const [activeResultExamId, setActiveResultExamId] = useState<string | null>(null)
  const [showResultForm, setShowResultForm] = useState(false)
  const [editingResultId, setEditingResultId] = useState<string | null>(null)
  const [resultSummary, setResultSummary] = useState('')
  const [resultDate, setResultDate] = useState('')
  const [resultLabName, setResultLabName] = useState('')
  const [resultReport, setResultReport] = useState('')
  const [resultValidated, setResultValidated] = useState(false)
  const [resultError, setResultError] = useState('')
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement
    element?.showModal()
    element?.querySelector('input')?.focus()
    return () => {
      element?.close()
      if (previousFocus instanceof HTMLElement) previousFocus.focus()
    }
  }, [])

  useEffect(() => {
    if (!patient?.id) return
    const controller = new AbortController()
    let active = true

    service
      .listAllergies(patient.id, controller.signal)
      .then((data) => {
        if (active) setAllergies(data)
      })
      .catch((err: unknown) => {
        if (!active || (err instanceof Error && err.name === 'AbortError')) return
        if (err instanceof ApiError && err.status === 401) onExpired()
      })
      .finally(() => {
        if (active) setAllergiesLoading(false)
      })

    service
      .listVaccines(patient.id, controller.signal)
      .then((data) => {
        if (active) setVaccines(data)
      })
      .catch((err: unknown) => {
        if (!active || (err instanceof Error && err.name === 'AbortError')) return
        if (err instanceof ApiError && err.status === 401) onExpired()
      })
      .finally(() => {
        if (active) setVaccinesLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [patient?.id, service, onExpired])

  useEffect(() => {
    if (!patient?.id || !recordsService) return
    const controller = new AbortController()
    let active = true

    recordsService
      .getRecordByPatientId(patient.id, controller.signal)
      .then((rec) => {
        if (active) {
          setRecord(rec)
          setRecordError('')
        }
      })
      .catch((err: unknown) => {
        if (!active || (err instanceof Error && err.name === 'AbortError')) return
        if (err instanceof ApiError && err.status === 401) {
          onExpired()
          return
        }
        setRecordError(
          err instanceof Error && err.message
            ? err.message
            : 'Não foi possível carregar o histórico médico.',
        )
      })
      .finally(() => {
        if (active) setRecordLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [patient?.id, recordsService, onExpired])

  async function ensureRecord(): Promise<MedicalRecord> {
    if (record) return record
    if (!patient?.id || !recordsService) {
      throw new Error('Serviço de prontuário indisponível.')
    }
    const created = await recordsService.createRecord(patient.id)
    setRecord(created)
    return created
  }

  // --- Allergies Handlers ---
  function resetAllergyForm() {
    setEditingAllergyId(null)
    setAllergyAlergeno('')
    setAllergyReacao('')
    setAllergyObservacoes('')
    setAllergyError('')
    setShowAllergyForm(false)
  }

  function startEditAllergy(allergy: PatientAllergy) {
    setEditingAllergyId(allergy.id)
    setAllergyAlergeno(allergy.alergeno)
    setAllergyReacao(allergy.reacao ?? '')
    setAllergyObservacoes(allergy.observacoes ?? '')
    setAllergyError('')
    setShowAllergyForm(true)
  }

  async function handleSaveAllergy(event: FormEvent) {
    event.preventDefault()
    const alergenoTrimmed = allergyAlergeno.trim()
    if (!alergenoTrimmed) {
      setAllergyError('Informe o nome do alérgeno.')
      return
    }
    const input: PatientAllergyInput = {
      alergeno: alergenoTrimmed,
      reacao: allergyReacao.trim() || null,
      observacoes: allergyObservacoes.trim() || null,
    }

    setAllergyBusy(true)
    setAllergyError('')
    try {
      if (patient?.id) {
        if (editingAllergyId) {
          const updated = await service.updateAllergy(patient.id, editingAllergyId, input)
          setAllergies((current) =>
            current.map((item) => (item.id === editingAllergyId ? updated : item)),
          )
        } else {
          const created = await service.addAllergy(patient.id, input)
          setAllergies((current) => [...current, created])
        }
      } else {
        if (editingAllergyId) {
          setAllergies((current) =>
            current.map((item) =>
              item.id === editingAllergyId
                ? {
                    ...item,
                    alergeno: input.alergeno,
                    reacao: input.reacao ?? null,
                    observacoes: input.observacoes ?? null,
                  }
                : item,
            ),
          )
        } else {
          setAllergies((current) => [
            ...current,
            {
              id: crypto.randomUUID(),
              alergeno: input.alergeno,
              reacao: input.reacao ?? null,
              observacoes: input.observacoes ?? null,
            },
          ])
        }
      }
      resetAllergyForm()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          onExpired()
          return
        }
        setAllergyError(err.message)
      } else {
        setAllergyError('Não foi possível salvar a alergia.')
      }
    } finally {
      setAllergyBusy(false)
    }
  }

  async function handleDeleteAllergy(allergyId: string) {
    if (patient?.id) {
      setAllergyBusy(true)
      try {
        await service.deleteAllergy(patient.id, allergyId)
        setAllergies((current) => current.filter((item) => item.id !== allergyId))
        if (editingAllergyId === allergyId) resetAllergyForm()
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          onExpired()
          return
        }
        setAllergyError('Não foi possível excluir a alergia.')
      } finally {
        setAllergyBusy(false)
      }
    } else {
      setAllergies((current) => current.filter((item) => item.id !== allergyId))
      if (editingAllergyId === allergyId) resetAllergyForm()
    }
  }

  // --- Vaccines Handlers ---
  function resetVaccineForm() {
    setEditingVaccineId(null)
    setVaccineVacina('')
    setVaccineDose('')
    setVaccineDataAplicacao('')
    setVaccineLote('')
    setVaccineProximaDose('')
    setVaccineError('')
    setShowVaccineForm(false)
  }

  function startEditVaccine(vaccine: PatientVaccine) {
    setEditingVaccineId(vaccine.id)
    setVaccineVacina(vaccine.vacina)
    setVaccineDose(vaccine.dose)
    setVaccineDataAplicacao(vaccine.dataAplicacao)
    setVaccineLote(vaccine.lote ?? '')
    setVaccineProximaDose(vaccine.proximaDose ?? '')
    setVaccineError('')
    setShowVaccineForm(true)
  }

  async function handleSaveVaccine(event: FormEvent) {
    event.preventDefault()
    const vacinaTrimmed = vaccineVacina.trim()
    const doseTrimmed = vaccineDose.trim()
    if (!vacinaTrimmed) {
      setVaccineError('Informe o nome da vacina.')
      return
    }
    if (!doseTrimmed) {
      setVaccineError('Informe a dose da vacina.')
      return
    }
    if (!vaccineDataAplicacao) {
      setVaccineError('Informe a data de aplicação.')
      return
    }
    if (vaccineProximaDose && vaccineProximaDose < vaccineDataAplicacao) {
      setVaccineError('A próxima dose não pode ser anterior à data de aplicação.')
      return
    }

    const input: PatientVaccineInput = {
      vacina: vacinaTrimmed,
      dose: doseTrimmed,
      dataAplicacao: vaccineDataAplicacao,
      lote: vaccineLote.trim() || null,
      proximaDose: vaccineProximaDose || null,
    }

    setVaccineBusy(true)
    setVaccineError('')
    try {
      if (patient?.id) {
        if (editingVaccineId) {
          const updated = await service.updateVaccine(patient.id, editingVaccineId, input)
          setVaccines((current) =>
            current.map((item) => (item.id === editingVaccineId ? updated : item)),
          )
        } else {
          const created = await service.addVaccine(patient.id, input)
          setVaccines((current) => [...current, created])
        }
      } else {
        if (editingVaccineId) {
          setVaccines((current) =>
            current.map((item) =>
              item.id === editingVaccineId
                ? {
                    ...item,
                    vacina: input.vacina,
                    dose: input.dose,
                    dataAplicacao: input.dataAplicacao,
                    lote: input.lote ?? null,
                    proximaDose: input.proximaDose ?? null,
                  }
                : item,
            ),
          )
        } else {
          setVaccines((current) => [
            ...current,
            {
              id: crypto.randomUUID(),
              vacina: input.vacina,
              dose: input.dose,
              dataAplicacao: input.dataAplicacao,
              lote: input.lote ?? null,
              proximaDose: input.proximaDose ?? null,
            },
          ])
        }
      }
      resetVaccineForm()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          onExpired()
          return
        }
        setVaccineError(err.message)
      } else {
        setVaccineError('Não foi possível salvar a vacina.')
      }
    } finally {
      setVaccineBusy(false)
    }
  }

  async function handleDeleteVaccine(vaccineId: string) {
    if (patient?.id) {
      setVaccineBusy(true)
      try {
        await service.deleteVaccine(patient.id, vaccineId)
        setVaccines((current) => current.filter((item) => item.id !== vaccineId))
        if (editingVaccineId === vaccineId) resetVaccineForm()
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          onExpired()
          return
        }
        setVaccineError('Não foi possível excluir a vacina.')
      } finally {
        setVaccineBusy(false)
      }
    } else {
      setVaccines((current) => current.filter((item) => item.id !== vaccineId))
      if (editingVaccineId === vaccineId) resetVaccineForm()
    }
  }

  // --- Diagnoses Handlers ---
  function resetDiagnosisForm() {
    setEditingDiagnosisId(null)
    setDiagnosisDescription('')
    setDiagnosisDate('')
    setDiagnosisLabName('')
    setDiagnosisValidated(false)
    setDiagnosisError('')
    setShowDiagnosisForm(false)
  }

  function startEditDiagnosis(diag: Diagnosis) {
    setEditingDiagnosisId(diag.id)
    setDiagnosisDescription(diag.description)
    setDiagnosisDate(diag.date ? diag.date.split('T')[0] : '')
    setDiagnosisLabName(diag.laboratoryName ?? '')
    setDiagnosisValidated(diag.validated)
    setDiagnosisError('')
    setShowDiagnosisForm(true)
  }

  async function handleSaveDiagnosis(event: FormEvent) {
    event.preventDefault()
    if (!recordsService) return
    const descTrimmed = diagnosisDescription.trim()
    if (!descTrimmed) {
      setDiagnosisError('Informe a descrição do diagnóstico.')
      return
    }

    setRecordBusy(true)
    setDiagnosisError('')
    try {
      const activeRec = await ensureRecord()
      const input: DiagnosisInput = {
        medicalRecordId: activeRec.id,
        description: descTrimmed,
        date: diagnosisDate ? `${diagnosisDate}T12:00:00` : new Date().toISOString(),
        laboratoryName: diagnosisLabName.trim() || null,
        validated: diagnosisValidated,
      }

      if (editingDiagnosisId) {
        const updated = await recordsService.updateDiagnosis(editingDiagnosisId, input)
        setRecord((current) =>
          current
            ? {
                ...current,
                diagnoses: current.diagnoses.map((d) =>
                  d.id === editingDiagnosisId ? updated : d,
                ),
                updatedAt: new Date().toISOString(),
              }
            : current,
        )
      } else {
        const created = await recordsService.createDiagnosis(input)
        setRecord((current) =>
          current
            ? {
                ...current,
                diagnoses: [created, ...current.diagnoses],
                updatedAt: new Date().toISOString(),
              }
            : current,
        )
      }
      resetDiagnosisForm()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onExpired()
        return
      }
      setDiagnosisError(
        err instanceof Error ? err.message : 'Não foi possível salvar o diagnóstico.',
      )
    } finally {
      setRecordBusy(false)
    }
  }

  async function handleToggleValidateDiagnosis(diag: Diagnosis) {
    if (!recordsService) return
    setRecordBusy(true)
    try {
      const updated = await recordsService.validateDiagnosis(diag.id, !diag.validated)
      setRecord((current) =>
        current
          ? {
              ...current,
              diagnoses: current.diagnoses.map((d) => (d.id === diag.id ? updated : d)),
            }
          : current,
      )
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onExpired()
        return
      }
    } finally {
      setRecordBusy(false)
    }
  }

  async function handleDeleteDiagnosis(diagId: string) {
    if (!recordsService) return
    setRecordBusy(true)
    try {
      await recordsService.deleteDiagnosis(diagId)
      setRecord((current) =>
        current
          ? {
              ...current,
              diagnoses: current.diagnoses.filter((d) => d.id !== diagId),
            }
          : current,
      )
      if (editingDiagnosisId === diagId) resetDiagnosisForm()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onExpired()
        return
      }
    } finally {
      setRecordBusy(false)
    }
  }

  // --- Exams Handlers ---
  function resetExamForm() {
    setEditingExamId(null)
    setExamType('')
    setExamDate('')
    setExamError('')
    setShowExamForm(false)
  }

  function startEditExam(exam: MedicalExam) {
    setEditingExamId(exam.id)
    setExamType(exam.type)
    setExamDate(exam.date ? exam.date.split('T')[0] : '')
    setExamError('')
    setShowExamForm(true)
  }

  async function handleSaveExam(event: FormEvent) {
    event.preventDefault()
    if (!recordsService) return
    const typeTrimmed = examType.trim()
    if (!typeTrimmed) {
      setExamError('Informe o tipo de exame.')
      return
    }

    setRecordBusy(true)
    setExamError('')
    try {
      const activeRec = await ensureRecord()
      const input: MedicalExamInput = {
        medicalRecordId: activeRec.id,
        type: typeTrimmed,
        date: examDate ? `${examDate}T08:00:00` : new Date().toISOString(),
      }

      if (editingExamId) {
        const updated = await recordsService.updateExam(editingExamId, input)
        setRecord((current) =>
          current
            ? {
                ...current,
                exams: current.exams.map((e) => (e.id === editingExamId ? updated : e)),
                updatedAt: new Date().toISOString(),
              }
            : current,
        )
      } else {
        const created = await recordsService.createExam(input)
        setRecord((current) =>
          current
            ? {
                ...current,
                exams: [created, ...current.exams],
                updatedAt: new Date().toISOString(),
              }
            : current,
        )
      }
      resetExamForm()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onExpired()
        return
      }
      setExamError(err instanceof Error ? err.message : 'Não foi possível salvar o exame.')
    } finally {
      setRecordBusy(false)
    }
  }

  async function handleDeleteExam(examId: string) {
    if (!recordsService) return
    setRecordBusy(true)
    try {
      await recordsService.deleteExam(examId)
      setRecord((current) =>
        current
          ? {
              ...current,
              exams: current.exams.filter((e) => e.id !== examId),
            }
          : current,
      )
      if (editingExamId === examId) resetExamForm()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onExpired()
        return
      }
    } finally {
      setRecordBusy(false)
    }
  }

  // --- Exam Results Handlers ---
  function resetResultForm() {
    setActiveResultExamId(null)
    setEditingResultId(null)
    setResultSummary('')
    setResultDate('')
    setResultLabName('')
    setResultReport('')
    setResultValidated(false)
    setResultError('')
    setShowResultForm(false)
  }

  function startAddResult(examId: string) {
    setActiveResultExamId(examId)
    setEditingResultId(null)
    setResultSummary('')
    setResultDate(today)
    setResultLabName('')
    setResultReport('')
    setResultValidated(false)
    setResultError('')
    setShowResultForm(true)
  }

  function startEditResult(examId: string, res: ExamResult) {
    setActiveResultExamId(examId)
    setEditingResultId(res.id)
    setResultSummary(res.resultSummary)
    setResultDate(res.resultDate ? res.resultDate.split('T')[0] : '')
    setResultLabName(res.laboratoryName ?? '')
    setResultReport(res.detailedReport ?? '')
    setResultValidated(res.validated)
    setResultError('')
    setShowResultForm(true)
  }

  async function handleSaveResult(event: FormEvent) {
    event.preventDefault()
    if (!recordsService || !activeResultExamId) return
    const summaryTrimmed = resultSummary.trim()
    if (!summaryTrimmed) {
      setResultError('Informe o resumo ou conclusão do laudo.')
      return
    }

    setRecordBusy(true)
    setResultError('')
    try {
      const input: ExamResultInput = {
        medicalExamId: activeResultExamId,
        resultSummary: summaryTrimmed,
        resultDate: resultDate ? `${resultDate}T10:00:00` : new Date().toISOString(),
        laboratoryName: resultLabName.trim() || null,
        detailedReport: resultReport.trim() || null,
        validated: resultValidated,
      }

      if (editingResultId) {
        const updated = await recordsService.updateExamResult(editingResultId, input)
        setRecord((current) =>
          current
            ? {
                ...current,
                exams: current.exams.map((e) =>
                  e.id === activeResultExamId
                    ? {
                        ...e,
                        hasResult: true,
                        results: e.results.map((r) => (r.id === editingResultId ? updated : r)),
                      }
                    : e,
                ),
              }
            : current,
        )
      } else {
        const created = await recordsService.createExamResult(input)
        setRecord((current) =>
          current
            ? {
                ...current,
                exams: current.exams.map((e) =>
                  e.id === activeResultExamId
                    ? {
                        ...e,
                        hasResult: true,
                        results: [...e.results, created],
                      }
                    : e,
                ),
              }
            : current,
        )
      }
      setExpandedResults((prev) => ({ ...prev, [activeResultExamId]: true }))
      resetResultForm()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onExpired()
        return
      }
      setResultError(err instanceof Error ? err.message : 'Não foi possível salvar o laudo do exame.')
    } finally {
      setRecordBusy(false)
    }
  }

  async function handleToggleValidateResult(examId: string, res: ExamResult) {
    if (!recordsService) return
    setRecordBusy(true)
    try {
      const updated = await recordsService.validateExamResult(res.id, !res.validated)
      setRecord((current) =>
        current
          ? {
              ...current,
              exams: current.exams.map((e) =>
                e.id === examId
                  ? {
                      ...e,
                      results: e.results.map((r) => (r.id === res.id ? updated : r)),
                    }
                  : e,
              ),
            }
          : current,
      )
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onExpired()
        return
      }
    } finally {
      setRecordBusy(false)
    }
  }

  async function handleDeleteResult(examId: string, resultId: string) {
    if (!recordsService) return
    setRecordBusy(true)
    try {
      await recordsService.deleteExamResult(resultId)
      setRecord((current) =>
        current
          ? {
              ...current,
              exams: current.exams.map((e) =>
                e.id === examId
                  ? {
                      ...e,
                      results: e.results.filter((r) => r.id !== resultId),
                      hasResult: e.results.filter((r) => r.id !== resultId).length > 0,
                    }
                  : e,
              ),
            }
          : current,
      )
      if (editingResultId === resultId) resetResultForm()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onExpired()
        return
      }
    } finally {
      setRecordBusy(false)
    }
  }

  // --- Main Patient Submit ---
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanCpf = cpf.replace(/\D/g, '')
    const finalSexo = sex === 'Outro' ? otherSex.trim() : sex

    const input: PatientInput = {
      nome: nome.trim(),
      cpf: cleanCpf,
      dataNascimento: dataNascimento.trim(),
      sexo: finalSexo,
      telefone: telefone.trim(),
    }

    if (allergies.length > 0) {
      input.alergias = allergies.map((a) => ({
        alergeno: a.alergeno,
        reacao: a.reacao,
        observacoes: a.observacoes,
      }))
    }
    if (vaccines.length > 0) {
      input.vacinas = vaccines.map((v) => ({
        vacina: v.vacina,
        dose: v.dose,
        dataAplicacao: v.dataAplicacao,
        lote: v.lote,
        proximaDose: v.proximaDose,
      }))
    }

    const invalid: FieldErrors = {}
    if (!input.nome) invalid.nome = ['Informe um nome.']
    if (!input.sexo) invalid.sexo = ['Informe o sexo.']
    if (!validCpf(input.cpf)) invalid.cpf = ['Informe um CPF válido.']
    if (!input.dataNascimento) invalid.dataNascimento = ['Informe a data de nascimento.']

    setErrors(invalid)
    setError('')
    if (Object.keys(invalid).length) {
      setTab('dados')
      return
    }

    setBusy(true)
    try {
      if (patient) await service.updatePatient(patient.id, input)
      else await service.createPatient(input)
      onSaved()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          onExpired()
          return
        }
        setError(err.message)
        setErrors(err.fields)
      } else setError('Não foi possível salvar. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const totalHistoryItems = (record?.diagnoses.length ?? 0) + (record?.exams.length ?? 0)

  return (
    <dialog
      ref={dialog}
      className="record-dialog"
      aria-labelledby="patient-dialog-title"
      aria-describedby="patient-dialog-description"
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
    >
      <div className="dialog-header">
        <span className="dialog-icon">
          <Icon name="cross" size={23} />
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label="Fechar formulário de paciente"
          onClick={onClose}
          disabled={busy || recordBusy}
        >
          <Icon name="close" />
        </button>
      </div>

      <h2 id="patient-dialog-title">{patient ? 'Editar paciente' : 'Novo paciente'}</h2>
      <p className="muted" id="patient-dialog-description">
        {patient ? 'Atualize os dados e consulte o histórico clínico do paciente.' : 'Cadastre um paciente da unidade.'} Campos com
        * são obrigatórios.
      </p>

      <div className="dialog-tabs" role="tablist" aria-label="Abas do paciente">
        <button
          type="button"
          role="tab"
          id="tab-dados"
          aria-selected={tab === 'dados'}
          aria-controls="panel-dados"
          className={tab === 'dados' ? 'tab-button active' : 'tab-button'}
          onClick={() => setTab('dados')}
        >
          Dados cadastrais
        </button>
        <button
          type="button"
          role="tab"
          id="tab-alergias"
          aria-selected={tab === 'alergias'}
          aria-controls="panel-alergias"
          className={tab === 'alergias' ? 'tab-button active' : 'tab-button'}
          onClick={() => setTab('alergias')}
        >
          Alergias
          {allergies.length > 0 && <span className="tab-badge">{allergies.length}</span>}
        </button>
        <button
          type="button"
          role="tab"
          id="tab-vacinas"
          aria-selected={tab === 'vacinas'}
          aria-controls="panel-vacinas"
          className={tab === 'vacinas' ? 'tab-button active' : 'tab-button'}
          onClick={() => setTab('vacinas')}
        >
          Vacinas
          {vaccines.length > 0 && <span className="tab-badge">{vaccines.length}</span>}
        </button>
        <button
          type="button"
          role="tab"
          id="tab-historico"
          aria-selected={tab === 'historico'}
          aria-controls="panel-historico"
          className={tab === 'historico' ? 'tab-button active' : 'tab-button'}
          onClick={() => setTab('historico')}
        >
          <Icon name="clipboard" size={16} />
          Histórico médico
          {totalHistoryItems > 0 && <span className="tab-badge">{totalHistoryItems}</span>}
        </button>
      </div>

      <form onSubmit={(event) => void submit(event)}>
        {tab === 'dados' && (
          <fieldset
            disabled={busy}
            className="form-fields"
            id="panel-dados"
            role="tabpanel"
            aria-labelledby="tab-dados"
          >
            {fields.map((field) => {
              const id = `patient-${field.name}`
              const error = errors[field.name]
              return (
                <div className="field" key={field.name}>
                  <label htmlFor={id}>
                    {field.label}
                    {field.required && (
                      <span className="required-mark" aria-hidden="true">
                        {' '}
                        *
                      </span>
                    )}
                  </label>
                  {field.name === 'sexo' ? (
                    <>
                      <select
                        id={id}
                        name="sexo"
                        required
                        value={sex}
                        onChange={(event) => {
                          setSex(event.target.value)
                          setErrors((current) => ({ ...current, sexo: [] }))
                        }}
                        aria-invalid={error?.length ? true : undefined}
                        aria-describedby={error?.length ? `${id}-error` : undefined}
                      >
                        <option value="" disabled>
                          Selecione uma opção
                        </option>
                        {sexOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                        <option value="Outro">Outro</option>
                      </select>
                      {sex === 'Outro' && (
                        <>
                          <label htmlFor="patient-other-sex">
                            Especifique o sexo
                            <span className="required-mark" aria-hidden="true">
                              {' '}
                              *
                            </span>
                          </label>
                          <input
                            id="patient-other-sex"
                            name="sexoOutro"
                            required
                            maxLength={30}
                            value={otherSex}
                            onChange={(event) => {
                              setOtherSex(event.target.value)
                              setErrors((current) => ({ ...current, sexo: [] }))
                            }}
                            aria-invalid={error?.length ? true : undefined}
                            aria-describedby={error?.length ? `${id}-error` : undefined}
                          />
                        </>
                      )}
                    </>
                  ) : (
                    <input
                      id={id}
                      name={field.name}
                      type={field.type ?? 'text'}
                      value={
                        field.name === 'nome'
                          ? nome
                          : field.name === 'cpf'
                            ? cpf
                            : field.name === 'dataNascimento'
                              ? dataNascimento
                              : telefone
                      }
                      onChange={(event) => {
                        const val = event.target.value
                        if (field.name === 'nome') setNome(val)
                        else if (field.name === 'cpf') setCpf(val)
                        else if (field.name === 'dataNascimento') setDataNascimento(val)
                        else if (field.name === 'telefone') setTelefone(val)
                        setErrors((current) => ({ ...current, [field.name]: [] }))
                      }}
                      required={field.required}
                      maxLength={field.maxLength}
                      inputMode={field.name === 'cpf' ? 'numeric' : undefined}
                      max={field.type === 'date' ? today : undefined}
                      aria-invalid={error?.length ? true : undefined}
                      aria-describedby={error?.length ? `${id}-error` : undefined}
                    />
                  )}
                  {error?.length ? (
                    <span className="field-error" id={`${id}-error`}>
                      {error.join(' ')}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </fieldset>
        )}

        {tab === 'alergias' && (
          <div
            className="sub-panel"
            id="panel-alergias"
            role="tabpanel"
            aria-labelledby="tab-alergias"
          >
            <div className="sub-panel-intro">
              <p>Cadastre e consulte as alergias conhecidas do paciente.</p>
              {!showAllergyForm && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    resetAllergyForm()
                    setShowAllergyForm(true)
                  }}
                  disabled={allergyBusy}
                >
                  <Icon name="plus" size={16} />
                  Nova alergia
                </button>
              )}
            </div>

            {showAllergyForm && (
              <div className="sub-form-card">
                <span className="sub-form-title">
                  {editingAllergyId ? 'Editar alergia' : 'Nova alergia'}
                </span>
                <div className="field">
                  <label htmlFor="allergy-alergeno">
                    Alérgeno / Substância <span className="required-mark">*</span>
                  </label>
                  <input
                    id="allergy-alergeno"
                    type="text"
                    maxLength={150}
                    placeholder="Ex.: Penicilina, Amendoim, Dipirona, Látex"
                    value={allergyAlergeno}
                    onChange={(e) => setAllergyAlergeno(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="allergy-reacao">Reação observada</label>
                  <input
                    id="allergy-reacao"
                    type="text"
                    maxLength={500}
                    placeholder="Ex.: Urticária, edema de glote, anafilaxia"
                    value={allergyReacao}
                    onChange={(e) => setAllergyReacao(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="allergy-observacoes">Observações</label>
                  <input
                    id="allergy-observacoes"
                    type="text"
                    maxLength={1000}
                    placeholder="Ex.: Diagnosticado em teste alérgico em 2021"
                    value={allergyObservacoes}
                    onChange={(e) => setAllergyObservacoes(e.target.value)}
                  />
                </div>

                {allergyError && (
                  <div className="error-box" role="alert">
                    {allergyError}
                  </div>
                )}

                <div className="sub-form-actions">
                  <button
                    type="button"
                    className="button secondary"
                    onClick={resetAllergyForm}
                    disabled={allergyBusy}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="button primary"
                    onClick={(e) => void handleSaveAllergy(e)}
                    disabled={allergyBusy}
                  >
                    {allergyBusy ? <span className="spinner" /> : <Icon name="check" size={16} />}
                    {editingAllergyId ? 'Atualizar alergia' : 'Adicionar alergia'}
                  </button>
                </div>
              </div>
            )}

            {allergiesLoading ? (
              <div className="table-state" style={{ minHeight: '120px' }}>
                <span className="spinner teal" />
                <p>Carregando alergias…</p>
              </div>
            ) : allergies.length > 0 ? (
              <div className="sub-list" aria-label="Lista de alergias">
                {allergies.map((item) => (
                  <div key={item.id} className="sub-item-card">
                    <div className="sub-item-main">
                      <div className="sub-item-title">
                        <span>{item.alergeno}</span>
                        {item.reacao && <span className="sub-item-tag">{item.reacao}</span>}
                      </div>
                      {item.observacoes && (
                        <p className="sub-item-desc">{item.observacoes}</p>
                      )}
                    </div>
                    <div className="sub-item-actions">
                      <button
                        type="button"
                        className="button quiet"
                        aria-label={`Editar alergia ${item.alergeno}`}
                        onClick={() => startEditAllergy(item)}
                        disabled={allergyBusy}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="button danger-quiet"
                        aria-label={`Excluir alergia ${item.alergeno}`}
                        onClick={() => void handleDeleteAllergy(item.id)}
                        disabled={allergyBusy}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !showAllergyForm && (
                <div className="empty-sub-state">
                  <p>Nenhuma alergia cadastrada para este paciente.</p>
                </div>
              )
            )}
          </div>
        )}

        {tab === 'vacinas' && (
          <div
            className="sub-panel"
            id="panel-vacinas"
            role="tabpanel"
            aria-labelledby="tab-vacinas"
          >
            <div className="sub-panel-intro">
              <p>Cadastre e consulte o histórico de vacinas do paciente.</p>
              {!showVaccineForm && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    resetVaccineForm()
                    setShowVaccineForm(true)
                  }}
                  disabled={vaccineBusy}
                >
                  <Icon name="plus" size={16} />
                  Nova vacina
                </button>
              )}
            </div>

            {showVaccineForm && (
              <div className="sub-form-card">
                <span className="sub-form-title">
                  {editingVaccineId ? 'Editar vacina' : 'Nova vacina'}
                </span>
                <div className="sub-fields-grid">
                  <div className="field">
                    <label htmlFor="vaccine-vacina">
                      Nome da vacina <span className="required-mark">*</span>
                    </label>
                    <input
                      id="vaccine-vacina"
                      type="text"
                      maxLength={150}
                      placeholder="Ex.: Febre Amarela, COVID-19, Tétano"
                      value={vaccineVacina}
                      onChange={(e) => setVaccineVacina(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="vaccine-dose">
                      Dose <span className="required-mark">*</span>
                    </label>
                    <input
                      id="vaccine-dose"
                      type="text"
                      maxLength={100}
                      placeholder="Ex.: 1ª dose, 2ª dose, Dose única, Reforço"
                      value={vaccineDose}
                      onChange={(e) => setVaccineDose(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="sub-fields-grid">
                  <div className="field">
                    <label htmlFor="vaccine-data-aplicacao">
                      Data de aplicação <span className="required-mark">*</span>
                    </label>
                    <input
                      id="vaccine-data-aplicacao"
                      type="date"
                      max={today}
                      value={vaccineDataAplicacao}
                      onChange={(e) => setVaccineDataAplicacao(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="vaccine-lote">Lote</label>
                    <input
                      id="vaccine-lote"
                      type="text"
                      maxLength={100}
                      placeholder="Ex.: LT2024-01"
                      value={vaccineLote}
                      onChange={(e) => setVaccineLote(e.target.value)}
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="vaccine-proxima-dose">Próxima dose (previsão)</label>
                  <input
                    id="vaccine-proxima-dose"
                    type="date"
                    min={vaccineDataAplicacao || undefined}
                    value={vaccineProximaDose}
                    onChange={(e) => setVaccineProximaDose(e.target.value)}
                  />
                </div>

                {vaccineError && (
                  <div className="error-box" role="alert">
                    {vaccineError}
                  </div>
                )}

                <div className="sub-form-actions">
                  <button
                    type="button"
                    className="button secondary"
                    onClick={resetVaccineForm}
                    disabled={vaccineBusy}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="button primary"
                    onClick={(e) => void handleSaveVaccine(e)}
                    disabled={vaccineBusy}
                  >
                    {vaccineBusy ? <span className="spinner" /> : <Icon name="check" size={16} />}
                    {editingVaccineId ? 'Atualizar vacina' : 'Adicionar vacina'}
                  </button>
                </div>
              </div>
            )}

            {vaccinesLoading ? (
              <div className="table-state" style={{ minHeight: '120px' }}>
                <span className="spinner teal" />
                <p>Carregando vacinas…</p>
              </div>
            ) : vaccines.length > 0 ? (
              <div className="sub-list" aria-label="Lista de vacinas">
                {vaccines.map((item) => (
                  <div key={item.id} className="sub-item-card">
                    <div className="sub-item-main">
                      <div className="sub-item-title">
                        <span>{item.vacina}</span>
                        <span className="sub-item-tag">{item.dose}</span>
                      </div>
                      <div className="sub-item-meta">
                        <span>Aplicação: {formatDate(item.dataAplicacao)}</span>
                        {item.lote && <span> • Lote: {item.lote}</span>}
                        {item.proximaDose && (
                          <span> • Próxima dose: {formatDate(item.proximaDose)}</span>
                        )}
                      </div>
                    </div>
                    <div className="sub-item-actions">
                      <button
                        type="button"
                        className="button quiet"
                        aria-label={`Editar vacina ${item.vacina}`}
                        onClick={() => startEditVaccine(item)}
                        disabled={vaccineBusy}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="button danger-quiet"
                        aria-label={`Excluir vacina ${item.vacina}`}
                        onClick={() => void handleDeleteVaccine(item.id)}
                        disabled={vaccineBusy}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !showVaccineForm && (
                <div className="empty-sub-state">
                  <p>Nenhuma vacina registrada para este paciente.</p>
                </div>
              )
            )}
          </div>
        )}

        {tab === 'historico' && (
          <div
            className="sub-panel medical-history-panel"
            id="panel-historico"
            role="tabpanel"
            aria-labelledby="tab-historico"
          >
            {!patient?.id ? (
              <div className="empty-sub-state history-unregistered-state">
                <span className="empty-icon-wrapper">
                  <Icon name="clipboard" size={32} />
                </span>
                <h3>Histórico clínico sob demanda</h3>
                <p>
                  O prontuário médico, exames e diagnósticos clínicos estarão disponíveis para
                  edição e consulta assim que o cadastro básico do paciente for salvo.
                </p>
              </div>
            ) : recordLoading ? (
              <div className="table-state" style={{ minHeight: '180px' }}>
                <span className="spinner teal" />
                <p>Carregando prontuário e histórico clínico…</p>
              </div>
            ) : recordError ? (
              <div className="error-box" role="alert">
                <p>{recordError}</p>
              </div>
            ) : (
              <>
                <div className="history-summary-bar">
                  <div className="history-stat">
                    <span className="history-stat-label">Diagnósticos</span>
                    <strong className="history-stat-value">
                      {record?.diagnoses.length ?? 0}
                    </strong>
                  </div>
                  <div className="history-stat">
                    <span className="history-stat-label">Exames Solicitados</span>
                    <strong className="history-stat-value">{record?.exams.length ?? 0}</strong>
                  </div>
                  <div className="history-stat">
                    <span className="history-stat-label">Exames com Laudo</span>
                    <strong className="history-stat-value">
                      {record?.exams.filter((e) => e.hasResult).length ?? 0}
                    </strong>
                  </div>
                  {record?.updatedAt && (
                    <div className="history-stat meta-stat">
                      <span className="history-stat-label">Última atualização</span>
                      <span className="history-stat-date">
                        {formatDateTime(record.updatedAt)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="history-section-filter">
                  <button
                    type="button"
                    className={`filter-pill ${historySection === 'all' ? 'active' : ''}`}
                    onClick={() => setHistorySection('all')}
                  >
                    Visão Geral
                  </button>
                  <button
                    type="button"
                    className={`filter-pill ${historySection === 'diagnoses' ? 'active' : ''}`}
                    onClick={() => setHistorySection('diagnoses')}
                  >
                    Diagnósticos ({record?.diagnoses.length ?? 0})
                  </button>
                  <button
                    type="button"
                    className={`filter-pill ${historySection === 'exams' ? 'active' : ''}`}
                    onClick={() => setHistorySection('exams')}
                  >
                    Exames & Laudos ({record?.exams.length ?? 0})
                  </button>
                </div>

                {/* --- DIAGNOSES SECTION --- */}
                {(historySection === 'all' || historySection === 'diagnoses') && (
                  <section className="history-block" aria-labelledby="diagnoses-heading">
                    <div className="history-block-header">
                      <div className="history-block-title-group">
                        <Icon name="activity" size={18} />
                        <h3 id="diagnoses-heading">Diagnósticos Médicos</h3>
                      </div>
                      {!showDiagnosisForm && (
                        <button
                          type="button"
                          className="button secondary"
                          onClick={() => {
                            resetDiagnosisForm()
                            setDiagnosisDate(today)
                            setShowDiagnosisForm(true)
                          }}
                          disabled={recordBusy}
                        >
                          <Icon name="plus" size={15} />
                          Novo diagnóstico
                        </button>
                      )}
                    </div>

                    {showDiagnosisForm && (
                      <div className="sub-form-card history-form-card">
                        <span className="sub-form-title">
                          {editingDiagnosisId ? 'Editar diagnóstico' : 'Registrar diagnóstico'}
                        </span>
                        <div className="field">
                          <label htmlFor="diag-description">
                            Hipótese Diagnóstica / CID / Descrição Clínica{' '}
                            <span className="required-mark">*</span>
                          </label>
                          <textarea
                            id="diag-description"
                            rows={3}
                            maxLength={500}
                            placeholder="Ex.: Hipertensão Arterial Sistêmica Estágio 2 (CID I10) associada a cefaleia occipital."
                            value={diagnosisDescription}
                            onChange={(e) => setDiagnosisDescription(e.target.value)}
                            required
                          />
                        </div>

                        <div className="sub-fields-grid">
                          <div className="field">
                            <label htmlFor="diag-date">Data do diagnóstico</label>
                            <input
                              id="diag-date"
                              type="date"
                              max={today}
                              value={diagnosisDate}
                              onChange={(e) => setDiagnosisDate(e.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label htmlFor="diag-lab">Especialidade / Unidade Clínica</label>
                            <input
                              id="diag-lab"
                              type="text"
                              maxLength={100}
                              placeholder="Ex.: Cardiologia, Clínica Geral"
                              value={diagnosisLabName}
                              onChange={(e) => setDiagnosisLabName(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="field-checkbox">
                          <label htmlFor="diag-validated" className="checkbox-label">
                            <input
                              id="diag-validated"
                              type="checkbox"
                              checked={diagnosisValidated}
                              onChange={(e) => setDiagnosisValidated(e.target.checked)}
                            />
                            <span>Diagnóstico validado e confirmado pelo médico</span>
                          </label>
                        </div>

                        {diagnosisError && (
                          <div className="error-box" role="alert">
                            {diagnosisError}
                          </div>
                        )}

                        <div className="sub-form-actions">
                          <button
                            type="button"
                            className="button secondary"
                            onClick={resetDiagnosisForm}
                            disabled={recordBusy}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className="button primary"
                            onClick={(e) => void handleSaveDiagnosis(e)}
                            disabled={recordBusy}
                          >
                            {recordBusy ? (
                              <span className="spinner" />
                            ) : (
                              <Icon name="check" size={16} />
                            )}
                            {editingDiagnosisId ? 'Atualizar diagnóstico' : 'Salvar diagnóstico'}
                          </button>
                        </div>
                      </div>
                    )}

                    {record && record.diagnoses.length > 0 ? (
                      <div className="sub-list" aria-label="Lista de diagnósticos">
                        {record.diagnoses.map((diag) => (
                          <div key={diag.id} className="sub-item-card history-card">
                            <div className="sub-item-main">
                              <div className="sub-item-title">
                                <span>{diag.description}</span>
                                <span
                                  className={`status-pill ${
                                    diag.validated ? 'validated-pill' : 'pending-pill'
                                  }`}
                                >
                                  {diag.validated ? 'Validado' : 'Pendente de validação'}
                                </span>
                              </div>
                              <div className="sub-item-meta">
                                <span>Data: {formatDate(diag.date)}</span>
                                {diag.laboratoryName && (
                                  <span> • Especialidade/Unidade: {diag.laboratoryName}</span>
                                )}
                              </div>
                            </div>
                            <div className="sub-item-actions">
                              <button
                                type="button"
                                className="button quiet"
                                title={
                                  diag.validated
                                    ? 'Marcar como pendente'
                                    : 'Validar diagnóstico'
                                }
                                onClick={() => void handleToggleValidateDiagnosis(diag)}
                                disabled={recordBusy}
                              >
                                <Icon name="check" size={14} />
                                {diag.validated ? 'Desvalidar' : 'Validar'}
                              </button>
                              <button
                                type="button"
                                className="button quiet"
                                aria-label={`Editar diagnóstico ${diag.description}`}
                                onClick={() => startEditDiagnosis(diag)}
                                disabled={recordBusy}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="button danger-quiet"
                                aria-label={`Excluir diagnóstico ${diag.description}`}
                                onClick={() => void handleDeleteDiagnosis(diag.id)}
                                disabled={recordBusy}
                              >
                                <Icon name="trash" size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      !showDiagnosisForm && (
                        <div className="empty-sub-state">
                          <p>Nenhum diagnóstico registrado no prontuário.</p>
                        </div>
                      )
                    )}
                  </section>
                )}

                {/* --- EXAMS & RESULTS SECTION --- */}
                {(historySection === 'all' || historySection === 'exams') && (
                  <section className="history-block" aria-labelledby="exams-heading">
                    <div className="history-block-header">
                      <div className="history-block-title-group">
                        <Icon name="file" size={18} />
                        <h3 id="exams-heading">Exames Médicos & Laudos</h3>
                      </div>
                      {!showExamForm && !showResultForm && (
                        <button
                          type="button"
                          className="button secondary"
                          onClick={() => {
                            resetExamForm()
                            setExamDate(today)
                            setShowExamForm(true)
                          }}
                          disabled={recordBusy}
                        >
                          <Icon name="plus" size={15} />
                          Novo exame
                        </button>
                      )}
                    </div>

                    {showExamForm && (
                      <div className="sub-form-card history-form-card">
                        <span className="sub-form-title">
                          {editingExamId ? 'Editar exame' : 'Solicitar / Registrar exame'}
                        </span>
                        <div className="sub-fields-grid">
                          <div className="field">
                            <label htmlFor="exam-type">
                              Tipo de Exame <span className="required-mark">*</span>
                            </label>
                            <input
                              id="exam-type"
                              type="text"
                              maxLength={100}
                              placeholder="Ex.: Hemograma Completo, Tomografia, Raio-X de Tórax, ECG"
                              value={examType}
                              onChange={(e) => setExamType(e.target.value)}
                              required
                            />
                          </div>
                          <div className="field">
                            <label htmlFor="exam-date">Data da solicitação/realização</label>
                            <input
                              id="exam-date"
                              type="date"
                              max={today}
                              value={examDate}
                              onChange={(e) => setExamDate(e.target.value)}
                            />
                          </div>
                        </div>

                        {examError && (
                          <div className="error-box" role="alert">
                            {examError}
                          </div>
                        )}

                        <div className="sub-form-actions">
                          <button
                            type="button"
                            className="button secondary"
                            onClick={resetExamForm}
                            disabled={recordBusy}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className="button primary"
                            onClick={(e) => void handleSaveExam(e)}
                            disabled={recordBusy}
                          >
                            {recordBusy ? (
                              <span className="spinner" />
                            ) : (
                              <Icon name="check" size={16} />
                            )}
                            {editingExamId ? 'Atualizar exame' : 'Registrar exame'}
                          </button>
                        </div>
                      </div>
                    )}

                    {showResultForm && (
                      <div className="sub-form-card history-form-card result-form-card">
                        <span className="sub-form-title">
                          {editingResultId ? 'Editar laudo/resultado' : 'Adicionar laudo/resultado'}
                        </span>
                        <div className="field">
                          <label htmlFor="res-summary">
                            Resumo / Conclusão do Laudo <span className="required-mark">*</span>
                          </label>
                          <input
                            id="res-summary"
                            type="text"
                            maxLength={255}
                            placeholder="Ex.: Hemoglobina 14.2 g/dL, Leucócitos 7.200/mm³ (Parâmetros normais)"
                            value={resultSummary}
                            onChange={(e) => setResultSummary(e.target.value)}
                            required
                          />
                        </div>

                        <div className="sub-fields-grid">
                          <div className="field">
                            <label htmlFor="res-date">Data do resultado</label>
                            <input
                              id="res-date"
                              type="date"
                              max={today}
                              value={resultDate}
                              onChange={(e) => setResultDate(e.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label htmlFor="res-lab">Laboratório / Centro de Diagnóstico</label>
                            <input
                              id="res-lab"
                              type="text"
                              maxLength={100}
                              placeholder="Ex.: Laboratório Central Diagnósticos"
                              value={resultLabName}
                              onChange={(e) => setResultLabName(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="field">
                          <label htmlFor="res-report">Laudo Completo e Detalhado</label>
                          <textarea
                            id="res-report"
                            rows={4}
                            placeholder="Descreva o relatório minucioso, valores de referência e observações laboratoriais..."
                            value={resultReport}
                            onChange={(e) => setResultReport(e.target.value)}
                          />
                        </div>

                        <div className="field-checkbox">
                          <label htmlFor="res-validated" className="checkbox-label">
                            <input
                              id="res-validated"
                              type="checkbox"
                              checked={resultValidated}
                              onChange={(e) => setResultValidated(e.target.checked)}
                            />
                            <span>Laudo validado pelo médico responsável</span>
                          </label>
                        </div>

                        {resultError && (
                          <div className="error-box" role="alert">
                            {resultError}
                          </div>
                        )}

                        <div className="sub-form-actions">
                          <button
                            type="button"
                            className="button secondary"
                            onClick={resetResultForm}
                            disabled={recordBusy}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className="button primary"
                            onClick={(e) => void handleSaveResult(e)}
                            disabled={recordBusy}
                          >
                            {recordBusy ? (
                              <span className="spinner" />
                            ) : (
                              <Icon name="check" size={16} />
                            )}
                            {editingResultId ? 'Atualizar laudo' : 'Salvar laudo'}
                          </button>
                        </div>
                      </div>
                    )}

                    {record && record.exams.length > 0 ? (
                      <div className="sub-list" aria-label="Lista de exames">
                        {record.exams.map((exam) => {
                          const isExpanded = expandedResults[exam.id] ?? false
                          return (
                            <div key={exam.id} className="sub-item-card history-card exam-card">
                              <div className="exam-card-header">
                                <div className="sub-item-main">
                                  <div className="sub-item-title">
                                    <span>{exam.type}</span>
                                    <span
                                      className={`status-pill ${
                                        exam.hasResult ? 'result-ready-pill' : 'result-waiting-pill'
                                      }`}
                                    >
                                      {exam.hasResult ? 'Com laudo' : 'Aguardando resultado'}
                                    </span>
                                  </div>
                                  <div className="sub-item-meta">
                                    <span>Solicitação: {formatDate(exam.date)}</span>
                                    {exam.results.length > 0 && (
                                      <span>
                                        {' '}
                                        • {exam.results.length}{' '}
                                        {exam.results.length === 1
                                          ? 'resultado anexado'
                                          : 'resultados anexados'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="sub-item-actions">
                                  <button
                                    type="button"
                                    className="button quiet"
                                    onClick={() => startAddResult(exam.id)}
                                    disabled={recordBusy}
                                  >
                                    <Icon name="plus" size={14} />
                                    Laudo
                                  </button>
                                  <button
                                    type="button"
                                    className="button quiet"
                                    aria-label={`Editar exame ${exam.type}`}
                                    onClick={() => startEditExam(exam)}
                                    disabled={recordBusy}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    className="button danger-quiet"
                                    aria-label={`Excluir exame ${exam.type}`}
                                    onClick={() => void handleDeleteExam(exam.id)}
                                    disabled={recordBusy}
                                  >
                                    <Icon name="trash" size={15} />
                                  </button>
                                </div>
                              </div>

                              {/* Exam results list */}
                              {exam.results && exam.results.length > 0 && (
                                <div className="exam-results-container">
                                  <button
                                    type="button"
                                    className="toggle-results-btn"
                                    onClick={() =>
                                      setExpandedResults((prev) => ({
                                        ...prev,
                                        [exam.id]: !isExpanded,
                                      }))
                                    }
                                  >
                                    <Icon
                                      name="chevron"
                                      size={14}
                                    />
                                    <span>
                                      {isExpanded
                                        ? 'Ocultar laudo(s)'
                                        : `Ver laudo (${exam.results.length})`}
                                    </span>
                                  </button>

                                  {isExpanded && (
                                    <div className="results-expanded-list">
                                      {exam.results.map((res) => (
                                        <div key={res.id} className="result-detail-box">
                                          <div className="result-detail-header">
                                            <div>
                                              <strong className="result-summary-text">
                                                {res.resultSummary}
                                              </strong>
                                              <div className="result-meta-text">
                                                <span>Data: {formatDate(res.resultDate)}</span>
                                                {res.laboratoryName && (
                                                  <span> • Lab: {res.laboratoryName}</span>
                                                )}
                                              </div>
                                            </div>
                                            <div className="result-actions-group">
                                              <span
                                                className={`status-pill small-pill ${
                                                  res.validated
                                                    ? 'validated-pill'
                                                    : 'pending-pill'
                                                }`}
                                              >
                                                {res.validated ? 'Validado' : 'Pendente'}
                                              </span>
                                              <button
                                                type="button"
                                                className="button quiet small-btn"
                                                title={
                                                  res.validated
                                                    ? 'Marcar como pendente'
                                                    : 'Validar laudo'
                                                }
                                                onClick={() =>
                                                  void handleToggleValidateResult(exam.id, res)
                                                }
                                                disabled={recordBusy}
                                              >
                                                {res.validated ? 'Desvalidar' : 'Validar'}
                                              </button>
                                              <button
                                                type="button"
                                                className="button quiet small-btn"
                                                onClick={() => startEditResult(exam.id, res)}
                                                disabled={recordBusy}
                                              >
                                                Editar
                                              </button>
                                              <button
                                                type="button"
                                                className="button danger-quiet small-btn"
                                                onClick={() =>
                                                  void handleDeleteResult(exam.id, res.id)
                                                }
                                                disabled={recordBusy}
                                              >
                                                <Icon name="trash" size={13} />
                                              </button>
                                            </div>
                                          </div>
                                          {res.detailedReport && (
                                            <div className="result-report-body">
                                              <span className="report-label">
                                                Laudo detalhado:
                                              </span>
                                              <p className="report-content">{res.detailedReport}</p>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      !showExamForm &&
                      !showResultForm && (
                        <div className="empty-sub-state">
                          <p>Nenhum exame solicitado para este paciente.</p>
                        </div>
                      )
                    )}
                  </section>
                )}
              </>
            )}
          </div>
        )}

        {error && (
          <div className="error-box" role="alert">
            {error}
          </div>
        )}

        <div className="dialog-footer">
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            disabled={busy || recordBusy}
          >
            Cancelar
          </button>
          <button type="submit" className="button primary" disabled={busy || recordBusy}>
            {busy ? <span className="spinner" /> : <Icon name="check" size={17} />}
            {busy ? 'Salvando…' : patient ? 'Salvar alterações' : 'Cadastrar paciente'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
