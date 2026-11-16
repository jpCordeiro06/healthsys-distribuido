import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiError } from '../api'
import type {
  FieldErrors,
  Patient,
  PatientsService,
  RiskClassification,
  Screening,
  ScreeningInput,
  ScreeningStatus,
  Symptom,
  TriageService,
} from '../types'
import { Icon } from './Icon'

interface Props {
  screening?: Screening
  service: TriageService
  patientsService?: PatientsService
  onClose: () => void
  onSaved: () => void
  onExpired: () => void
}

function toLocalDatetimeInput(iso?: string | null): string {
  if (!iso) {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    return now.toISOString().slice(0, 16)
  }
  const date = new Date(iso)
  if (isNaN(date.getTime())) return ''
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

export function ScreeningDialog({
  screening,
  service,
  patientsService,
  onClose,
  onSaved,
  onExpired,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const isEditing = Boolean(screening?.id)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  // Options
  const [patients, setPatients] = useState<Patient[]>([])
  const [riskClassifications, setRiskClassifications] = useState<RiskClassification[]>([])
  const [availableSymptoms, setAvailableSymptoms] = useState<Symptom[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  // Form state
  const [patientId, setPatientId] = useState(() => screening?.patientId ?? '')
  const [doctorId, setDoctorId] = useState(() => screening?.doctorId ?? '')
  const [riskClassificationId, setRiskClassificationId] = useState(
    () => screening?.riskClassification?.id ?? '',
  )
  const [status, setStatus] = useState<ScreeningStatus>(
    () => screening?.status ?? 'AGUARDANDO',
  )
  const [screeningDate, setScreeningDate] = useState(() =>
    toLocalDatetimeInput(screening?.screeningDate),
  )
  const [notes, setNotes] = useState(() => screening?.notes ?? '')
  const [selectedSymptomIds, setSelectedSymptomIds] = useState<string[]>(
    () => screening?.symptoms?.map((s) => s.id) ?? [],
  )

  useEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement
    element?.showModal()
    return () => {
      element?.close()
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus()
      } else {
        document.getElementById('main-content')?.focus()
      }
    }
  }, [])

  useEffect(() => {
    let active = true
    async function loadData() {
      try {
        const [rcList, symList, patientsRes] = await Promise.all([
          service.listRiskClassifications().catch(() => []),
          service.listSymptoms().catch(() => []),
          patientsService?.listPatients(0).catch(() => null),
        ])
        if (!active) return
        setRiskClassifications(rcList.filter((rc) => rc.active !== false))
        setAvailableSymptoms(symList.filter((s) => s.active !== false))
        if (patientsRes?.content) {
          setPatients(patientsRes.content)
        }
      } catch {
        // Ignored fallback
      } finally {
        if (active) setLoadingOptions(false)
      }
    }
    void loadData()
    return () => {
      active = false
    }
  }, [service, patientsService])

  function toggleSymptom(id: string) {
    setSelectedSymptomIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return

    if (!patientId.trim()) {
      setErrors({ patientId: ['Selecione ou informe um paciente.'] })
      return
    }

    setBusy(true)
    setError('')
    setErrors({})

    const payload: ScreeningInput = {
      patientId: patientId.trim(),
      doctorId: doctorId.trim() || null,
      riskClassificationId: riskClassificationId || null,
      status,
      screeningDate: screeningDate ? new Date(screeningDate).toISOString() : null,
      notes: notes.trim() || null,
      symptomIds: selectedSymptomIds,
    }

    try {
      if (isEditing && screening) {
        await service.updateScreening(screening.id, payload)
      } else {
        await service.createScreening(payload)
      }
      onSaved()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          onExpired()
          return
        }
        setError(err.message)
        setErrors(err.fields)
      } else {
        setError('Ocorreu um erro ao salvar a triagem.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog
      ref={dialog}
      role="dialog"
      className="record-dialog wide-dialog"
      aria-labelledby="screening-dialog-title"
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
    >
      <div className="dialog-header">
        <span className="dialog-icon">
          <Icon name="activity" size={23} />
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label="Fechar janela de triagem"
          onClick={onClose}
          disabled={busy}
        >
          <Icon name="close" />
        </button>
      </div>

      <h2 id="screening-dialog-title">
        {isEditing ? 'Editar Triagem' : 'Nova Triagem'}
      </h2>
      <p className="muted">
        {isEditing
          ? 'Atualize os dados clínicos e a classificação de risco do paciente.'
          : 'Realize a classificação de risco e registro dos sintomas do paciente.'}
      </p>

      {error && (
        <div className="error-box" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={(e) => void submit(e)} noValidate>
        <div className="form-grid">
          {/* Patient Selection */}
          <div className="form-field full-width">
            <label htmlFor="screening-patient">
              Paciente <span className="required">*</span>
            </label>
            {patients.length > 0 ? (
              <select
                id="screening-patient"
                value={patientId}
                onChange={(e) => {
                  setPatientId(e.target.value)
                  if (errors.patientId) setErrors((prev) => ({ ...prev, patientId: [] }))
                }}
                disabled={busy}
                aria-invalid={Boolean(errors.patientId?.length)}
                aria-describedby={errors.patientId?.length ? 'screening-patient-error' : undefined}
                required
              >
                <option value="">Selecione um paciente cadastrado…</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} {p.cpf ? `(CPF: ${p.cpf})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="screening-patient"
                type="text"
                placeholder="ID ou identificador do paciente"
                value={patientId}
                onChange={(e) => {
                  setPatientId(e.target.value)
                  if (errors.patientId) setErrors((prev) => ({ ...prev, patientId: [] }))
                }}
                disabled={busy}
                aria-invalid={Boolean(errors.patientId?.length)}
                aria-describedby={errors.patientId?.length ? 'screening-patient-error' : undefined}
                required
              />
            )}
            {errors.patientId && errors.patientId.length > 0 && (
              <span id="screening-patient-error" className="field-error" role="alert">
                {errors.patientId[0]}
              </span>
            )}
          </div>

          {/* Risk Classification Selection */}
          <div className="form-field">
            <label htmlFor="screening-risk">Classificação de Risco</label>
            <select
              id="screening-risk"
              value={riskClassificationId}
              onChange={(e) => setRiskClassificationId(e.target.value)}
              disabled={busy || loadingOptions}
            >
              <option value="">Selecione a classificação…</option>
              {riskClassifications
                .sort((a, b) => a.priorityLevel - b.priorityLevel)
                .map((rc) => (
                  <option key={rc.id} value={rc.id}>
                    Prioridade {rc.priorityLevel}: {rc.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Status Selection */}
          <div className="form-field">
            <label htmlFor="screening-status">Status do Atendimento</label>
            <select
              id="screening-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ScreeningStatus)}
              disabled={busy}
            >
              <option value="AGUARDANDO">Aguardando</option>
              <option value="ATENDIDO">Atendido</option>
              <option value="DESISTIU">Desistiu</option>
            </select>
          </div>

          {/* Date & Time */}
          <div className="form-field">
            <label htmlFor="screening-date">Data e Hora da Triagem</label>
            <input
              id="screening-date"
              type="datetime-local"
              value={screeningDate}
              onChange={(e) => setScreeningDate(e.target.value)}
              disabled={busy}
            />
          </div>

          {/* Doctor / Attendant ID */}
          <div className="form-field">
            <label htmlFor="screening-doctor">Médico / Responsável (Opcional)</label>
            <input
              id="screening-doctor"
              type="text"
              placeholder="Identificador do profissional"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              disabled={busy}
            />
          </div>

          {/* Symptoms Selection */}
          <div className="form-field full-width">
            <label>Sintomas Observados</label>
            {availableSymptoms.length > 0 ? (
              <div className="symptoms-checkbox-grid">
                {availableSymptoms.map((sym) => {
                  const checked = selectedSymptomIds.includes(sym.id)
                  return (
                    <label
                      key={sym.id}
                      className={`symptom-checkbox-label ${checked ? 'selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSymptom(sym.id)}
                        disabled={busy}
                      />
                      <span>{sym.name}</span>
                    </label>
                  )
                })}
              </div>
            ) : (
              <p className="muted small">Nenhum sintoma cadastrado no sistema.</p>
            )}
          </div>

          {/* Notes */}
          <div className="form-field full-width">
            <label htmlFor="screening-notes">Observações / Queixa Principal</label>
            <textarea
              id="screening-notes"
              rows={4}
              placeholder="Descreva a queixa do paciente, sinais vitais (PA, temperatura, FC) ou observações clínicas relevantes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={busy}
              maxLength={5000}
            />
          </div>
        </div>

        <div className="dialog-footer">
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancelar
          </button>
          <button type="submit" className="button primary" disabled={busy}>
            {busy ? <span className="spinner" /> : <Icon name="check" size={17} />}
            {busy ? 'Salvando…' : isEditing ? 'Salvar alterações' : 'Cadastrar triagem'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
