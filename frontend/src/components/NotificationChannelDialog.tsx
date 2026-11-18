import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiError } from '../api'
import { Icon } from './Icon'
import type {
  FieldErrors,
  NotificationChannel,
  NotificationChannelInput,
  NotificationsService,
} from '../types'

interface Props {
  channel?: NotificationChannel | null
  service: NotificationsService
  onClose: () => void
  onSaved: () => void
  onExpired: () => void
}

export function NotificationChannelDialog({
  channel,
  service,
  onClose,
  onSaved,
  onExpired,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState<FieldErrors>({})

  const [name, setName] = useState(channel?.name ?? '')
  const [description, setDescription] = useState(channel?.description ?? '')
  const [active, setActive] = useState(channel?.active ?? true)

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
    setError('')
    setFields({})

    if (!name.trim()) {
      setFields({ name: ['Informe o nome do canal.'] })
      return
    }

    setBusy(true)

    try {
      const input: NotificationChannelInput = {
        name: name.trim(),
        description: description.trim(),
        active,
      }

      if (channel) {
        await service.updateChannel(channel.id, input)
      } else {
        await service.createChannel(input)
      }
      onSaved()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          onExpired()
          return
        }
        setError(err.message)
        setFields(err.fields)
      } else {
        setError('Não foi possível salvar o canal de notificação. Tente novamente.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog
      ref={dialog}
      className="record-dialog"
      aria-labelledby="channel-dialog-title"
      aria-describedby="channel-dialog-description"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      <div className="dialog-header">
        <div>
          <h2 id="channel-dialog-title">
            {channel ? 'Editar Canal de Notificação' : 'Novo Canal de Notificação'}
          </h2>
          <p id="channel-dialog-description" className="dialog-subtitle">
            Configure os meios de transmissão para distribuição de alertas e comunicados (ex: Email,
            SMS, WhatsApp, WebSocket).
          </p>
        </div>
        <button
          type="button"
          className="icon-button dialog-close"
          aria-label="Fechar"
          onClick={onClose}
        >
          <Icon name="close" size={18} />
        </button>
      </div>

      <form onSubmit={submit} className="dialog-form" noValidate>
        {error && (
          <div className="notice-banner error" role="alert">
            {error}
          </div>
        )}

        <div className="form-grid">
          <div className="form-field full-width">
            <label htmlFor="channel-name-input">
              Nome do Canal <span className="required">*</span>
            </label>
            <input
              id="channel-name-input"
              type="text"
              placeholder="Ex: Push, Telegram, WhatsApp"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={fields.name?.length ? true : undefined}
            />
            {fields.name && <span className="field-error">{fields.name.join(' ')}</span>}
          </div>

          <div className="form-field full-width">
            <label htmlFor="channel-desc-input">Descrição do Canal</label>
            <textarea
              id="channel-desc-input"
              rows={3}
              placeholder="Descreva o propósito e características técnicas deste canal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-invalid={fields.description?.length ? true : undefined}
            />
            {fields.description && (
              <span className="field-error">{fields.description.join(' ')}</span>
            )}
          </div>

          <div className="form-field full-width">
            <label className="checkbox-label" htmlFor="channel-active-checkbox">
              <input
                id="channel-active-checkbox"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <span>
                <strong>Canal Ativo</strong> (habilitado para despachos e envios no sistema)
              </span>
            </label>
          </div>
        </div>

        <div className="dialog-actions">
          <button type="button" className="button button-secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="submit" className="button button-primary" disabled={busy}>
            {busy ? 'Salvando...' : channel ? 'Atualizar Canal' : 'Criar Canal'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
