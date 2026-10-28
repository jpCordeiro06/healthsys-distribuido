import { useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes } from 'react'
import { ApiError } from '../api'
import {
  profiles,
  profileLabels,
  type UsersService,
  type FieldErrors,
  type Profile,
} from '../types'
import { Icon } from './Icon'

function Field({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string[] }) {
  const errorId = `${props.id}-error`
  return (
    <div className="field">
      <label htmlFor={props.id}>
        {label}
        <span className="required-mark"> *</span>
      </label>
      <input
        {...props}
        required
        aria-invalid={error?.length ? true : undefined}
        aria-describedby={error?.length ? errorId : props['aria-describedby']}
      />
      {error?.length ? (
        <span className="field-error" id={errorId}>
          {error.join(' ')}
        </span>
      ) : null}
    </div>
  )
}

interface Props {
  service: UsersService
  onClose: () => void
  onCreated: () => void
  onExpired: () => void
}

export function CreateUserDialog({ service, onClose, onCreated, onExpired }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState<FieldErrors>({})

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
    const data = new FormData(event.currentTarget)
    const value = (name: string) => String(data.get(name) ?? '').trim()
    if (!value('nome')) {
      setFields({ nome: ['Informe um nome.'] })
      return
    }
    setBusy(true)
    setError('')
    setFields({})
    try {
      await service.createUser({
        nome: value('nome'),
        email: value('email'),
        senha: String(data.get('senha') ?? ''),
        perfil: value('perfil') as Profile,
      })
      onCreated()
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          onExpired()
          return
        }
        setError(error.message)
        setFields(error.fields)
      } else {
        setError('Não foi possível salvar. Tente novamente.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog
      ref={dialog}
      className="record-dialog"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
    >
      <div className="dialog-header">
        <span className="dialog-icon">
          <Icon name="users" size={23} />
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label="Fechar cadastro"
          onClick={onClose}
          disabled={busy}
        >
          <Icon name="close" />
        </button>
      </div>
      <h2 id="dialog-title">Novo usuário</h2>
      <p className="muted" id="dialog-description">
        Cadastre uma pessoa para acessar a plataforma. Campos com * são obrigatórios.
      </p>
      <form
        onSubmit={(event) => void submit(event)}
        onChange={(event) => {
          const target = event.target
          if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) {
            setFields((current) => ({ ...current, [target.name]: [] }))
          }
        }}
      >
        <fieldset disabled={busy} className="form-fields">
          <Field
            id="user-name"
            name="nome"
            label="Nome completo"
            autoComplete="name"
            placeholder="Digite o nome completo"
            maxLength={120}
            error={fields.nome}
          />
          <Field
            id="user-email"
            name="email"
            label="E-mail"
            type="email"
            autoComplete="email"
            placeholder="nome@hospital.com"
            maxLength={254}
            error={fields.email}
          />
          <div className="field">
            <label htmlFor="user-profile">
              Perfil de acesso<span className="required-mark"> *</span>
            </label>
            <select
              id="user-profile"
              name="perfil"
              required
              defaultValue=""
              aria-invalid={fields.perfil?.length ? true : undefined}
              aria-describedby={fields.perfil?.length ? 'profile-error' : undefined}
            >
              <option value="" disabled>
                Selecione um perfil
              </option>
              {profiles.map((profile) => (
                <option key={profile} value={profile}>
                  {profileLabels[profile]}
                </option>
              ))}
            </select>
            {fields.perfil?.length ? (
              <span className="field-error" id="profile-error">
                {fields.perfil.join(' ')}
              </span>
            ) : null}
          </div>
          <Field
            id="user-password"
            name="senha"
            label="Senha inicial"
            type="password"
            autoComplete="new-password"
            placeholder="Pelo menos 8 caracteres"
            minLength={8}
            maxLength={128}
            error={fields.senha}
            aria-describedby="password-help"
          />
          <p className="field-help" id="password-help">
            A senha deve ter entre 8 e 128 caracteres.
          </p>
        </fieldset>
        {error && (
          <div className="error-box" role="alert">
            {error}
          </div>
        )}
        <div className="dialog-footer">
          <button type="button" className="button secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="submit" className="button primary" disabled={busy}>
            {busy ? <span className="spinner" /> : <Icon name="check" size={17} />}
            {busy ? 'Salvando…' : 'Cadastrar usuário'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
