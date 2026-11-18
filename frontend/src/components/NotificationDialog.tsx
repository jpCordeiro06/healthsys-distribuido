import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ApiError } from '../api'
import { Icon } from './Icon'
import {
  notificationTypeLabels,
  type FieldErrors,
  type NotificationChannel,
  type NotificationInput,
  type NotificationType,
  type NotificationsService,
  type Patient,
  type User,
} from '../types'

interface Props {
  senderId?: string | null
  channels: NotificationChannel[]
  users?: User[]
  patients?: Patient[]
  service: NotificationsService
  onClose: () => void
  onCreated: () => void
  onExpired: () => void
}

const notificationTypes: NotificationType[] = [
  'GENERAL',
  'TRIAGE_ALERT',
  'EMERGENCY',
  'EXAM_RESULT',
  'APPOINTMENT',
  'REMINDER',
  'SYSTEM',
]

export function NotificationDialog({
  senderId,
  channels,
  users = [],
  patients = [],
  service,
  onClose,
  onCreated,
  onExpired,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState<FieldErrors>({})

  const [receiverType, setReceiverType] = useState<'USER' | 'PATIENT' | 'CUSTOM'>('USER')
  const [selectedReceiverId, setSelectedReceiverId] = useState(
    users.length > 0 ? users[0].id : '',
  )
  const [customReceiverId, setCustomReceiverId] = useState('')
  const [type, setType] = useState<NotificationType>('GENERAL')
  const [channelId, setChannelId] = useState<string>(() => {
    if (channels.length > 0) {
      const defaultChannel =
        channels.find((c) => c.name.toLowerCase() === 'websocket') ?? channels[0]
      return defaultChannel.id
    }
    return ''
  })
  const [isUrgent, setIsUrgent] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement
    element?.showModal()
    const focusTarget = element?.querySelector('input, select')
    if (focusTarget instanceof HTMLElement) {
      focusTarget.focus()
    }
    return () => {
      element?.close()
      if (previousFocus instanceof HTMLElement) previousFocus.focus()
    }
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setFields({})

    const receiverId = receiverType === 'CUSTOM' ? customReceiverId.trim() : selectedReceiverId

    if (!receiverId) {
      setFields({ receiverId: ['Selecione ou informe um destinatário.'] })
      return
    }

    if (!title.trim()) {
      setFields({ title: ['Informe o título da notificação.'] })
      return
    }

    if (!message.trim()) {
      setFields({ message: ['Informe a mensagem da notificação.'] })
      return
    }

    setBusy(true)

    try {
      const input: NotificationInput = {
        senderId: senderId ?? null,
        receiverId,
        type,
        title: title.trim(),
        message: message.trim(),
        isUrgent,
        notificationChannelId: channelId || null,
      }

      await service.createNotification(input)
      onCreated()
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          onExpired()
          return
        }
        setError(err.message)
        setFields(err.fields)
      } else {
        setError('Não foi possível enviar a notificação. Tente novamente.')
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
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      <div className="dialog-header">
        <div>
          <h2 id="dialog-title">Nova Notificação</h2>
          <p id="dialog-description" className="dialog-subtitle">
            Envie alertas clínicos, comunicados hospitalares ou avisos para pacientes e profissionais.
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
            <label htmlFor="receiver-type-select">
              Tipo de Destinatário <span className="required">*</span>
            </label>
            <select
              id="receiver-type-select"
              value={receiverType}
              onChange={(e) => {
                const nextType = e.target.value as 'USER' | 'PATIENT' | 'CUSTOM'
                setReceiverType(nextType)
                if (nextType === 'USER') {
                  setSelectedReceiverId(users.length > 0 ? users[0].id : '')
                } else if (nextType === 'PATIENT') {
                  setSelectedReceiverId(patients.length > 0 ? patients[0].id : '')
                } else {
                  setSelectedReceiverId('')
                }
              }}
            >
              <option value="USER">Profissional / Usuário do Sistema</option>
              <option value="PATIENT">Paciente Cadastrado</option>
              <option value="CUSTOM">Identificador Manual (UUID)</option>
            </select>
          </div>

          {receiverType === 'USER' && (
            <div className="form-field full-width">
              <label htmlFor="receiver-user-select">
                Destinatário <span className="required">*</span>
              </label>
              {users.length > 0 ? (
                <select
                  id="receiver-user-select"
                  value={selectedReceiverId}
                  onChange={(e) => setSelectedReceiverId(e.target.value)}
                  aria-invalid={fields.receiverId?.length ? true : undefined}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome} ({u.perfil} - {u.email})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="ID do Usuário"
                  value={selectedReceiverId}
                  onChange={(e) => setSelectedReceiverId(e.target.value)}
                  aria-invalid={fields.receiverId?.length ? true : undefined}
                />
              )}
              {fields.receiverId && (
                <span className="field-error">{fields.receiverId.join(' ')}</span>
              )}
            </div>
          )}

          {receiverType === 'PATIENT' && (
            <div className="form-field full-width">
              <label htmlFor="receiver-patient-select">
                Paciente Destinatário <span className="required">*</span>
              </label>
              {patients.length > 0 ? (
                <select
                  id="receiver-patient-select"
                  value={selectedReceiverId}
                  onChange={(e) => setSelectedReceiverId(e.target.value)}
                  aria-invalid={fields.receiverId?.length ? true : undefined}
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} (CPF: {p.cpf})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="ID do Paciente"
                  value={selectedReceiverId}
                  onChange={(e) => setSelectedReceiverId(e.target.value)}
                  aria-invalid={fields.receiverId?.length ? true : undefined}
                />
              )}
              {fields.receiverId && (
                <span className="field-error">{fields.receiverId.join(' ')}</span>
              )}
            </div>
          )}

          {receiverType === 'CUSTOM' && (
            <div className="form-field full-width">
              <label htmlFor="custom-receiver-id">
                UUID do Destinatário <span className="required">*</span>
              </label>
              <input
                id="custom-receiver-id"
                type="text"
                placeholder="Ex: 550e8400-e29b-41d4-a716-446655440000"
                value={customReceiverId}
                onChange={(e) => setCustomReceiverId(e.target.value)}
                aria-invalid={fields.receiverId?.length ? true : undefined}
              />
              {fields.receiverId && (
                <span className="field-error">{fields.receiverId.join(' ')}</span>
              )}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="notification-type-select">
              Categoria / Tipo <span className="required">*</span>
            </label>
            <select
              id="notification-type-select"
              value={type}
              onChange={(e) => setType(e.target.value as NotificationType)}
            >
              {notificationTypes.map((t) => (
                <option key={t} value={t}>
                  {notificationTypeLabels[t]}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="channel-select">Canal de Envio</label>
            <select
              id="channel-select"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
            >
              <option value="">Nenhum / Padrão</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {!c.active ? '(Inativo)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field full-width">
            <label className="checkbox-label" htmlFor="is-urgent-checkbox">
              <input
                id="is-urgent-checkbox"
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
              />
              <span>
                <strong>Marcar como Notificação Urgente</strong> (prioridade máxima para a equipe
                assistencial)
              </span>
            </label>
          </div>

          <div className="form-field full-width">
            <label htmlFor="notification-title-input">
              Título da Notificação <span className="required">*</span>
            </label>
            <input
              id="notification-title-input"
              type="text"
              maxLength={255}
              placeholder="Ex: Alerta de Triagem - Paciente Crítico"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={fields.title?.length ? true : undefined}
            />
            {fields.title && <span className="field-error">{fields.title.join(' ')}</span>}
          </div>

          <div className="form-field full-width">
            <label htmlFor="notification-message-input">
              Mensagem / Conteúdo <span className="required">*</span>
            </label>
            <textarea
              id="notification-message-input"
              rows={4}
              placeholder="Descreva detalhadamente o teor da notificação hospitalar..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              aria-invalid={fields.message?.length ? true : undefined}
            />
            {fields.message && <span className="field-error">{fields.message.join(' ')}</span>}
          </div>
        </div>

        <div className="dialog-actions">
          <button type="button" className="button button-secondary" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="submit" className="button button-primary" disabled={busy}>
            {busy ? 'Enviando...' : 'Enviar Notificação'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
