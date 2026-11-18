import { useEffect, useRef } from 'react'
import { Icon } from './Icon'
import {
  notificationTypeLabels,
  type Notification,
  type Patient,
  type User,
} from '../types'

interface Props {
  notification: Notification
  usersMap?: Record<string, User>
  patientsMap?: Record<string, Patient>
  onClose: () => void
  onToggleRead: (id: string, isRead: boolean) => void
  onDelete: (notification: Notification) => void
}

function formatDatetime(isoDate?: string | null) {
  if (!isoDate) return '—'
  const date = new Date(isoDate)
  if (isNaN(date.getTime())) return isoDate
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function NotificationViewDialog({
  notification,
  usersMap = {},
  patientsMap = {},
  onClose,
  onToggleRead,
  onDelete,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement
    element?.showModal()
    return () => {
      element?.close()
      if (previousFocus instanceof HTMLElement) previousFocus.focus()
    }
  }, [])

  const senderUser = notification.senderId ? usersMap[notification.senderId] : null
  const receiverUser = usersMap[notification.receiverId]
  const receiverPatient = patientsMap[notification.receiverId]

  return (
    <dialog
      ref={dialog}
      className="record-dialog notification-view-dialog"
      aria-labelledby="view-dialog-title"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      <div className="dialog-header">
        <div className="notification-view-header-title">
          {notification.isUrgent && (
            <span className="urgent-badge" title="Notificação Urgente">
              <Icon name="alert" size={14} /> Urgente
            </span>
          )}
          <h2 id="view-dialog-title">{notification.title}</h2>
          <span className="notification-meta-tag">
            {notificationTypeLabels[notification.type] ?? notification.type}
          </span>
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

      <div className="dialog-body notification-view-content">
        <div className="notification-detail-grid">
          <div className="detail-item">
            <span className="detail-label">Data de Envio</span>
            <strong className="detail-value">{formatDatetime(notification.sentAt)}</strong>
          </div>
          <div className="detail-item">
            <span className="detail-label">Status de Leitura</span>
            <strong className="detail-value">
              {notification.isRead
                ? `Lida (${formatDatetime(notification.readAt)})`
                : 'Não Lida (Pendente)'}
            </strong>
          </div>
          <div className="detail-item">
            <span className="detail-label">Canal de Transmissão</span>
            <strong className="detail-value">
              {notification.channel?.name ?? 'Padrão / Interno'}
            </strong>
          </div>
          <div className="detail-item">
            <span className="detail-label">Remetente</span>
            <strong className="detail-value">
              {senderUser ? `${senderUser.nome} (${senderUser.perfil})` : 'Sistema Automático'}
            </strong>
          </div>
          <div className="detail-item full-width">
            <span className="detail-label">Destinatário</span>
            <strong className="detail-value">
              {receiverUser
                ? `${receiverUser.nome} (${receiverUser.perfil} - ${receiverUser.email})`
                : receiverPatient
                  ? `${receiverPatient.nome} (Paciente - CPF: ${receiverPatient.cpf})`
                  : notification.receiverId}
            </strong>
          </div>
        </div>

        <div className="notification-message-box">
          <span className="detail-label">Conteúdo da Mensagem</span>
          <p className="notification-full-message">{notification.message}</p>
        </div>
      </div>

      <div className="dialog-actions notification-view-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={() => {
            onToggleRead(notification.id, notification.isRead)
            onClose()
          }}
        >
          <Icon name="check" size={16} />
          {notification.isRead ? 'Marcar como Não Lida' : 'Marcar como Lida'}
        </button>
        <button
          type="button"
          className="button button-danger"
          onClick={() => {
            onDelete(notification)
            onClose()
          }}
        >
          <Icon name="trash" size={16} />
          Excluir
        </button>
        <button type="button" className="button button-primary" onClick={onClose}>
          Fechar
        </button>
      </div>
    </dialog>
  )
}
