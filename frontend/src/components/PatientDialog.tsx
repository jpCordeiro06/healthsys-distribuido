import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiError } from '../api'
import type {
  FieldErrors,
  Patient,
  PatientAllergy,
  PatientAllergyInput,
  PatientInput,
  PatientVaccine,
  PatientVaccineInput,
  PatientsService,
} from '../types'
import { Icon } from './Icon'

interface Props {
  patient?: Patient
  service: PatientsService
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
  const parts = isoDate.split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return isoDate
}

export function PatientDialog({ patient, service, onClose, onSaved, onExpired }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [tab, setTab] = useState<'dados' | 'alergias' | 'vacinas'>('dados')
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

    service
      .listAllergies(patient.id, controller.signal)
      .then((data) => setAllergies(data))
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) onExpired()
      })
      .finally(() => setAllergiesLoading(false))

    service
      .listVaccines(patient.id, controller.signal)
      .then((data) => setVaccines(data))
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) onExpired()
      })
      .finally(() => setVaccinesLoading(false))

    return () => controller.abort()
  }, [patient?.id, service, onExpired])

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
          disabled={busy}
        >
          <Icon name="close" />
        </button>
      </div>

      <h2 id="patient-dialog-title">{patient ? 'Editar paciente' : 'Novo paciente'}</h2>
      <p className="muted" id="patient-dialog-description">
        {patient ? 'Atualize os dados do paciente.' : 'Cadastre um paciente da unidade.'} Campos com
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
      </div>

      <form onSubmit={(event) => void submit(event)}>
        {tab === 'dados' && (
          <fieldset disabled={busy} className="form-fields" id="panel-dados" role="tabpanel" aria-labelledby="tab-dados">
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
          <div className="sub-panel" id="panel-alergias" role="tabpanel" aria-labelledby="tab-alergias">
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

                {allergyError && <div className="error-box" role="alert">{allergyError}</div>}

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
          <div className="sub-panel" id="panel-vacinas" role="tabpanel" aria-labelledby="tab-vacinas">
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

                {vaccineError && <div className="error-box" role="alert">{vaccineError}</div>}

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

        {error && <div className="error-box" role="alert">{error}</div>}

        <div className="dialog-footer">
          <button type="button" className="button secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="submit" className="button primary" disabled={busy}>
            {busy ? <span className="spinner" /> : <Icon name="check" size={17} />}
            {busy ? 'Salvando…' : patient ? 'Salvar alterações' : 'Cadastrar paciente'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
