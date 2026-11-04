import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiError } from '../api'
import type { FieldErrors, Patient, PatientInput, PatientsService } from '../types'
import { Icon } from './Icon'

interface Props {
  patient?: Patient
  service: PatientsService
  onClose: () => void
  onSaved: () => void
  onExpired: () => void
}

const fields: { name: keyof PatientInput; label: string; type?: string; maxLength?: number; required?: boolean }[] = [
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

export function PatientDialog({ patient, service, onClose, onSaved, onExpired }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [sex, setSex] = useState(() => patient?.sexo
    ? sexOptions.includes(patient.sexo) ? patient.sexo : 'Outro'
    : '')
  const [otherSex, setOtherSex] = useState(() => patient?.sexo && !sexOptions.includes(patient.sexo) ? patient.sexo : '')

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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const value = (name: string) => String(form.get(name) ?? '').trim()
    const input: PatientInput = {
      nome: value('nome'), cpf: value('cpf').replace(/\D/g, ''),
      dataNascimento: value('dataNascimento'),
      sexo: value('sexo') === 'Outro' ? value('sexoOutro') : value('sexo'),
      telefone: value('telefone'),
    }
    const invalid: FieldErrors = {}
    if (!input.nome) invalid.nome = ['Informe um nome.']
    if (!input.sexo) invalid.sexo = ['Informe o sexo.']
    if (!validCpf(input.cpf)) invalid.cpf = ['Informe um CPF válido.']
    setErrors(invalid)
    setError('')
    if (Object.keys(invalid).length) return
    setBusy(true)
    try {
      if (patient) await service.updatePatient(patient.id, input)
      else await service.createPatient(input)
      onSaved()
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          onExpired()
          return
        }
        setError(error.message)
        setErrors(error.fields)
      } else setError('Não foi possível salvar. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  return (
    <dialog ref={dialog} className="record-dialog" aria-labelledby="patient-dialog-title"
      aria-describedby="patient-dialog-description"
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}>
      <div className="dialog-header">
        <span className="dialog-icon"><Icon name="cross" size={23} /></span>
        <button type="button" className="icon-button" aria-label="Fechar formulário de paciente" onClick={onClose} disabled={busy}>
          <Icon name="close" />
        </button>
      </div>
      <h2 id="patient-dialog-title">{patient ? 'Editar paciente' : 'Novo paciente'}</h2>
      <p className="muted" id="patient-dialog-description">
        {patient ? 'Atualize os dados do paciente.' : 'Cadastre um paciente da unidade.'} Campos com * são obrigatórios.
      </p>
      <form onSubmit={(event) => void submit(event)} onChange={(event) => {
        const target = event.target
        if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) {
          setErrors((current) => ({ ...current, [target.name === 'sexoOutro' ? 'sexo' : target.name]: [] }))
        }
      }}>
        <fieldset disabled={busy} className="form-fields">
          {fields.map((field) => {
            const id = `patient-${field.name}`
            const error = errors[field.name]
            return (
              <div className="field" key={field.name}>
                <label htmlFor={id}>{field.label}{field.required && <span className="required-mark" aria-hidden="true"> *</span>}</label>
                {field.name === 'sexo' ? (
                  <>
                    <select id={id} name="sexo" required value={sex}
                      onChange={(event) => setSex(event.target.value)}
                      aria-invalid={error?.length ? true : undefined}
                      aria-describedby={error?.length ? `${id}-error` : undefined}>
                      <option value="" disabled>Selecione uma opção</option>
                      {sexOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      <option value="Outro">Outro</option>
                    </select>
                    {sex === 'Outro' && (
                      <>
                        <label htmlFor="patient-other-sex">Especifique o sexo<span className="required-mark" aria-hidden="true"> *</span></label>
                        <input id="patient-other-sex" name="sexoOutro" required maxLength={30}
                          value={otherSex} onChange={(event) => setOtherSex(event.target.value)}
                          aria-invalid={error?.length ? true : undefined}
                          aria-describedby={error?.length ? `${id}-error` : undefined} />
                      </>
                    )}
                  </>
                ) : <input id={id} name={field.name} type={field.type ?? 'text'}
                  defaultValue={patient?.[field.name] ?? ''} required={field.required} maxLength={field.maxLength}
                  inputMode={field.name === 'cpf' ? 'numeric' : undefined}
                  max={field.type === 'date' ? today : undefined}
                  aria-invalid={error?.length ? true : undefined}
                  aria-describedby={error?.length ? `${id}-error` : undefined} />}
                {error?.length ? <span className="field-error" id={`${id}-error`}>{error.join(' ')}</span> : null}
              </div>
            )
          })}
        </fieldset>
        {error && <div className="error-box" role="alert">{error}</div>}
        <div className="dialog-footer">
          <button type="button" className="button secondary" onClick={onClose} disabled={busy}>Cancelar</button>
          <button type="submit" className="button primary" disabled={busy}>
            {busy ? <span className="spinner" /> : <Icon name="check" size={17} />}
            {busy ? 'Salvando…' : patient ? 'Salvar alterações' : 'Cadastrar paciente'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
