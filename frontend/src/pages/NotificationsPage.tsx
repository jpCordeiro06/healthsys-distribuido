import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../api'
import { NotificationDialog } from '../components/NotificationDialog'
import { NotificationChannelDialog } from '../components/NotificationChannelDialog'
import { NotificationViewDialog } from '../components/NotificationViewDialog'
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog'
import { Icon } from '../components/Icon'
import {
  notificationTypeLabels,
  type Notification,
  type NotificationChannel,
  type NotificationFilter,
  type NotificationType,
  type NotificationsService,
  type Patient,
  type PatientsService,
  type Session,
  type User,
  type UsersService,
} from '../types'

interface Props {
  session: Session
  service: NotificationsService
  usersService?: UsersService
  patientsService?: PatientsService
  onExpired: () => void
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

function getTypeBadgeClass(type: NotificationType) {
  switch (type) {
    case 'EMERGENCY':
    case 'TRIAGE_ALERT':
      return 'badge-type-danger'
    case 'EXAM_RESULT':
      return 'badge-type-info'
    case 'APPOINTMENT':
      return 'badge-type-success'
    case 'REMINDER':
      return 'badge-type-warning'
    case 'SYSTEM':
      return 'badge-type-purple'
    default:
      return 'badge-type-default'
  }
}

export function NotificationsPage({
  session,
  service,
  usersService,
  patientsService,
  onExpired,
}: Props) {
  const [activeTab, setActiveTab] = useState<'MY' | 'ALL' | 'CHANNELS'>('ALL')
  const [notifications, setNotifications] = useState<Notification[] | null>(null)
  const [channels, setChannels] = useState<NotificationChannel[]>([])
  const [usersList, setUsersList] = useState<User[]>([])
  const [patientsList, setPatientsList] = useState<Patient[]>([])
  const [usersMap, setUsersMap] = useState<Record<string, User>>({})
  const [patientsMap, setPatientsMap] = useState<Record<string, Patient>>({})

  // Filters
  const [readFilter, setReadFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL')
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'URGENT'>('ALL')
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'ALL'>('ALL')
  const [channelFilter, setChannelFilter] = useState<string>('ALL')

  const [refresh, setRefresh] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Dialog states
  const [creatingNotification, setCreatingNotification] = useState(false)
  const [editingChannel, setEditingChannel] = useState<NotificationChannel | null | undefined>(
    undefined,
  )
  const [viewingNotification, setViewingNotification] = useState<Notification | null>(null)
  const [deletingNotification, setDeletingNotification] = useState<Notification | null>(null)
  const [deletingChannel, setDeletingChannel] = useState<NotificationChannel | null>(null)

  const heading = useRef<HTMLHeadingElement>(null)
  const loading = notifications === null && error === ''

  useEffect(() => {
    heading.current?.focus()
  }, [])

  // Load auxiliary users and patients for friendly names
  useEffect(() => {
    let active = true
    if (usersService) {
      usersService
        .listUsers(0)
        .then((res) => {
          if (!active || !res?.content) return
          setUsersList(res.content)
          const map: Record<string, User> = {}
          for (const u of res.content) {
            map[u.id] = u
          }
          setUsersMap(map)
        })
        .catch(() => {})
    }

    if (patientsService) {
      patientsService
        .listPatients(0)
        .then((res) => {
          if (!active || !res?.content) return
          setPatientsList(res.content)
          const map: Record<string, Patient> = {}
          for (const p of res.content) {
            map[p.id] = p
          }
          setPatientsMap(map)
        })
        .catch(() => {})
    }

    return () => {
      active = false
    }
  }, [usersService, patientsService])

  // Load channels
  useEffect(() => {
    let active = true
    service
      .listChannels()
      .then((res) => {
        if (!active) return
        setChannels(res)
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          onExpired()
        }
      })
    return () => {
      active = false
    }
  }, [service, refresh, onExpired])

  // Load notifications
  useEffect(() => {
    let active = true
    const filterObj: NotificationFilter = {}

    if (activeTab === 'MY' && session.usuario.id) {
      filterObj.receiverId = session.usuario.id
    }
    if (readFilter === 'UNREAD') {
      filterObj.isRead = false
    } else if (readFilter === 'READ') {
      filterObj.isRead = true
    }
    if (urgencyFilter === 'URGENT') {
      filterObj.isUrgent = true
    }
    if (typeFilter !== 'ALL') {
      filterObj.type = typeFilter
    }
    if (channelFilter !== 'ALL') {
      filterObj.channelId = channelFilter
    }

    service
      .listNotifications(filterObj)
      .then((data) => {
        if (!active) return
        setNotifications(data)
        setError('')
      })
      .catch((err) => {
        if (!active) return
        if (err instanceof ApiError) {
          if (err.status === 401) {
            onExpired()
            return
          }
          setError(err.message)
        } else {
          setError('Não foi possível carregar as notificações.')
        }
      })

    return () => {
      active = false
    }
  }, [service, activeTab, readFilter, urgencyFilter, typeFilter, channelFilter, refresh, onExpired, session.usuario.id])

  // Stats
  const totalNotifs = notifications?.length ?? 0
  const unreadNotifs = notifications?.filter((n) => !n.isRead).length ?? 0
  const urgentNotifs = notifications?.filter((n) => n.isUrgent).length ?? 0
  const activeChannelsCount = channels.filter((c) => c.active).length

  async function handleToggleRead(id: string, currentlyRead: boolean) {
    try {
      if (currentlyRead) {
        await service.markAsUnread(id)
        setNotice('Notificação marcada como não lida.')
      } else {
        await service.markAsRead(id)
        setNotice('Notificação marcada como lida.')
      }
      setRefresh((r) => r + 1)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onExpired()
        return
      }
      setError('Erro ao atualizar status da notificação.')
    }
  }

  async function handleDeleteNotification() {
    if (!deletingNotification) return
    await service.deleteNotification(deletingNotification.id)
  }

  async function handleDeleteChannel() {
    if (!deletingChannel) return
    await service.deleteChannel(deletingChannel.id)
  }

  const isAdmin = session.usuario.perfil === 'ADMIN'

  return (
    <div className="notifications-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">COMUNICAÇÃO & ALERTAS</span>
          <h1 ref={heading} tabIndex={-1}>
            Central de Notificações
          </h1>
          <p className="page-subtitle">
            Monitore alertas clínicos em tempo real, despache comunicados hospitalares e gerencie
            canais de transmissão.
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setRefresh((r) => r + 1)}
            title="Atualizar lista"
          >
            <Icon name="refresh" size={16} />
            Atualizar
          </button>
          {activeTab === 'CHANNELS' && isAdmin ? (
            <button
              type="button"
              className="button button-primary"
              onClick={() => setEditingChannel(null)}
            >
              <Icon name="plus" size={18} />
              Novo Canal
            </button>
          ) : (
            <button
              type="button"
              className="button button-primary"
              onClick={() => setCreatingNotification(true)}
            >
              <Icon name="plus" size={18} />
              Nova Notificação
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className="notice-banner success" role="status">
          <span>{notice}</span>
          <button
            type="button"
            className="icon-button close-notice"
            aria-label="Fechar aviso"
            onClick={() => setNotice('')}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="notice-banner error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="icon-button close-notice"
            aria-label="Fechar erro"
            onClick={() => setError('')}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Listado</span>
          <strong className="stat-value">{totalNotifs}</strong>
          <span className="stat-hint">Registros recuperados</span>
        </div>
        <div className="stat-card stat-unread">
          <span className="stat-label">Não Lidas</span>
          <strong className="stat-value">{unreadNotifs}</strong>
          <span className="stat-hint">Requerem atenção</span>
        </div>
        <div className="stat-card stat-urgent">
          <span className="stat-label">Alertas Urgentes</span>
          <strong className="stat-value">{urgentNotifs}</strong>
          <span className="stat-hint">Prioridade assistencial</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Canais Ativos</span>
          <strong className="stat-value">{activeChannelsCount}</strong>
          <span className="stat-hint">Vias de envio prontas</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="view-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'ALL'}
          className={`view-tab ${activeTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveTab('ALL')}
        >
          <Icon name="bell" size={16} />
          Todas as Notificações
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'MY'}
          className={`view-tab ${activeTab === 'MY' ? 'active' : ''}`}
          onClick={() => setActiveTab('MY')}
        >
          <Icon name="users" size={16} />
          Minhas Notificações
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'CHANNELS'}
          className={`view-tab ${activeTab === 'CHANNELS' ? 'active' : ''}`}
          onClick={() => setActiveTab('CHANNELS')}
        >
          <Icon name="radio" size={16} />
          Canais de Envio ({channels.length})
        </button>
      </div>

      {/* Filter Bar (Only for notifications view) */}
      {activeTab !== 'CHANNELS' && (
        <div className="filter-bar">
          <div className="filter-group">
            <label htmlFor="filter-read-status">Status de Leitura:</label>
            <select
              id="filter-read-status"
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value as 'ALL' | 'UNREAD' | 'READ')}
            >
              <option value="ALL">Todas</option>
              <option value="UNREAD">Somente Não Lidas</option>
              <option value="READ">Somente Lidas</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-urgency">Urgência:</label>
            <select
              id="filter-urgency"
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value as 'ALL' | 'URGENT')}
            >
              <option value="ALL">Todas</option>
              <option value="URGENT">Somente Urgentes</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-type">Tipo:</label>
            <select
              id="filter-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as NotificationType | 'ALL')}
            >
              <option value="ALL">Todos os Tipos</option>
              {Object.entries(notificationTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-channel">Canal:</label>
            <select
              id="filter-channel"
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
            >
              <option value="ALL">Todos os Canais</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Content for Notifications Tabs */}
      {activeTab !== 'CHANNELS' && (
        <div className="notifications-container">
          {loading ? (
            <div className="empty-state">
              <Icon name="refresh" size={24} />
              <p>Carregando notificações...</p>
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="empty-state">
              <Icon name="bell" size={36} />
              <h3>Nenhuma notificação encontrada</h3>
              <p>Não há notificações correspondentes aos critérios de filtro selecionados.</p>
              <button
                type="button"
                className="button button-primary"
                onClick={() => setCreatingNotification(true)}
              >
                <Icon name="plus" size={16} />
                Enviar Primeira Notificação
              </button>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notif) => {
                const senderUser = notif.senderId ? usersMap[notif.senderId] : null
                const receiverUser = usersMap[notif.receiverId]
                const receiverPatient = patientsMap[notif.receiverId]

                return (
                  <article
                    key={notif.id}
                    className={`notification-card ${!notif.isRead ? 'unread' : ''} ${
                      notif.isUrgent ? 'urgent' : ''
                    }`}
                  >
                    <div className="notification-card-header">
                      <div className="notification-badges-row">
                        {!notif.isRead && (
                          <span className="unread-dot" title="Não lida" aria-label="Não lida" />
                        )}
                        {notif.isUrgent && (
                          <span className="badge-urgent">
                            <Icon name="alert" size={12} />
                            URGENTE
                          </span>
                        )}
                        <span className={`badge-type ${getTypeBadgeClass(notif.type)}`}>
                          {notificationTypeLabels[notif.type] ?? notif.type}
                        </span>
                        {notif.channel && (
                          <span className="badge-channel">
                            <Icon name="radio" size={12} />
                            {notif.channel.name}
                          </span>
                        )}
                      </div>
                      <time className="notification-timestamp" dateTime={notif.sentAt}>
                        {formatDatetime(notif.sentAt)}
                      </time>
                    </div>

                    <div
                      className="notification-card-body"
                      onClick={() => setViewingNotification(notif)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setViewingNotification(notif)
                        }
                      }}
                    >
                      <h3 className="notification-title">{notif.title}</h3>
                      <p className="notification-message-preview">{notif.message}</p>
                    </div>

                    <div className="notification-card-footer">
                      <div className="notification-participants">
                        <span className="participant-info">
                          <strong>Para:</strong>{' '}
                          {receiverUser
                            ? `${receiverUser.nome} (${receiverUser.perfil})`
                            : receiverPatient
                              ? `${receiverPatient.nome} (Paciente)`
                              : notif.receiverId.slice(0, 8) + '...'}
                        </span>
                        {senderUser && (
                          <span className="participant-info">
                            <strong>De:</strong> {senderUser.nome}
                          </span>
                        )}
                      </div>

                      <div className="notification-card-actions">
                        <button
                          type="button"
                          className="button-link"
                          onClick={() => handleToggleRead(notif.id, notif.isRead)}
                          title={notif.isRead ? 'Marcar como não lida' : 'Marcar como lida'}
                        >
                          <Icon name="check" size={14} />
                          {notif.isRead ? 'Não lida' : 'Marcar como lida'}
                        </button>
                        <button
                          type="button"
                          className="button-link"
                          onClick={() => setViewingNotification(notif)}
                          title="Ver detalhes completos"
                        >
                          Detalhes
                        </button>
                        <button
                          type="button"
                          className="icon-button action-delete"
                          aria-label="Excluir notificação"
                          title="Excluir"
                          onClick={() => setDeletingNotification(notif)}
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Content for Channels Tab */}
      {activeTab === 'CHANNELS' && (
        <div className="channels-section">
          <div className="section-description">
            <p>
              Canais cadastrados representam os diferentes meios de entrega (ex: tempo real via
              WebSocket, correio eletrônico, SMS, mensageiro WhatsApp, Push Notification).
            </p>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome do Canal</th>
                  <th>Descrição</th>
                  <th>Status</th>
                  {isAdmin && <th className="text-right">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {channels.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 4 : 3} className="text-center py-4">
                      Nenhum canal de notificação cadastrado.
                    </td>
                  </tr>
                ) : (
                  channels.map((chan) => (
                    <tr key={chan.id}>
                      <td className="font-semibold">{chan.name}</td>
                      <td>{chan.description || '—'}</td>
                      <td>
                        <span
                          className={`channel-status-pill ${
                            chan.active ? 'status-active' : 'status-inactive'
                          }`}
                        >
                          {chan.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="text-right">
                          <button
                            type="button"
                            className="button-link mr-2"
                            onClick={() => setEditingChannel(chan)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="icon-button action-delete"
                            aria-label={`Excluir canal ${chan.name}`}
                            onClick={() => setDeletingChannel(chan)}
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {creatingNotification && (
        <NotificationDialog
          senderId={session.usuario.id}
          channels={channels}
          users={usersList}
          patients={patientsList}
          service={service}
          onClose={() => setCreatingNotification(false)}
          onCreated={() => {
            setCreatingNotification(false)
            setNotice('Notificação enviada com sucesso!')
            setRefresh((r) => r + 1)
          }}
          onExpired={onExpired}
        />
      )}

      {editingChannel !== undefined && (
        <NotificationChannelDialog
          channel={editingChannel}
          service={service}
          onClose={() => setEditingChannel(undefined)}
          onSaved={() => {
            setEditingChannel(undefined)
            setNotice('Canal de notificação salvo com sucesso!')
            setRefresh((r) => r + 1)
          }}
          onExpired={onExpired}
        />
      )}

      {viewingNotification && (
        <NotificationViewDialog
          notification={viewingNotification}
          usersMap={usersMap}
          patientsMap={patientsMap}
          onClose={() => setViewingNotification(null)}
          onToggleRead={handleToggleRead}
          onDelete={(notif) => {
            setViewingNotification(null)
            setDeletingNotification(notif)
          }}
        />
      )}

      {deletingNotification && (
        <ConfirmDeleteDialog
          kind="notificação"
          recordName={deletingNotification.title}
          recordDetail={`Enviada em ${formatDatetime(deletingNotification.sentAt)}`}
          onDelete={handleDeleteNotification}
          onDeleted={() => {
            setDeletingNotification(null)
            setNotice('Notificação excluída com sucesso.')
            setRefresh((r) => r + 1)
          }}
          onClose={() => setDeletingNotification(null)}
          onExpired={onExpired}
        />
      )}

      {deletingChannel && (
        <ConfirmDeleteDialog
          kind="canal de notificação"
          recordName={deletingChannel.name}
          recordDetail={deletingChannel.description || 'Sem descrição'}
          onDelete={handleDeleteChannel}
          onDeleted={() => {
            setDeletingChannel(null)
            setNotice('Canal de notificação excluído com sucesso.')
            setRefresh((r) => r + 1)
          }}
          onClose={() => setDeletingChannel(null)}
          onExpired={onExpired}
        />
      )}
    </div>
  )
}
