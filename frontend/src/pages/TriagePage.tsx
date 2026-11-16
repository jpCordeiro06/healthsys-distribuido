import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../api'
import { ScreeningDialog } from '../components/ScreeningDialog'
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog'
import { Icon } from '../components/Icon'
import {
  profileLabels,
  screeningStatusLabels,
  type Patient,
  type PatientsService,
  type Screening,
  type ScreeningStatus,
  type Session,
  type TriageService,
} from '../types'

interface Props {
  session: Session
  service: TriageService
  patientsService?: PatientsService
  onExpired: () => void
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
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

function getPriorityBadgeClass(priorityLevel?: number | null) {
  switch (priorityLevel) {
    case 1:
      return 'priority-emergency' // Red
    case 2:
      return 'priority-very-urgent' // Orange
    case 3:
      return 'priority-urgent' // Yellow
    case 4:
      return 'priority-less-urgent' // Green
    case 5:
      return 'priority-not-urgent' // Blue
    default:
      return 'priority-default'
  }
}

function getStatusBadgeClass(status: ScreeningStatus) {
  switch (status) {
    case 'AGUARDANDO':
      return 'status-pending'
    case 'ATENDIDO':
      return 'status-attended'
    case 'DESISTIU':
      return 'status-abandoned'
    default:
      return ''
  }
}

export function TriagePage({ session, service, patientsService, onExpired }: Props) {
  const [screenings, setScreenings] = useState<Screening[] | null>(null)
  const [patientsMap, setPatientsMap] = useState<Record<string, Patient>>({})
  const [statusFilter, setStatusFilter] = useState<ScreeningStatus | 'ALL'>('ALL')
  const [refresh, setRefresh] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Screening | null>(null)
  const [deleting, setDeleting] = useState<Screening | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  const heading = useRef<HTMLHeadingElement>(null)
  const loading = screenings === null && error === ''

  useEffect(() => {
    heading.current?.focus()
  }, [])

  useEffect(() => {
    let active = true
    if (patientsService) {
      patientsService
        .listPatients(0)
        .then((res) => {
          if (!active || !res?.content) return
          const map: Record<string, Patient> = {}
          for (const p of res.content) {
            map[p.id] = p
          }
          setPatientsMap(map)
        })
        .catch(() => {
          // Ignore patient mapping failure
        })
    }
    return () => {
      active = false
    }
  }, [patientsService, refresh])

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    const filter =
      statusFilter === 'ALL'
        ? undefined
        : { status: statusFilter as ScreeningStatus }

    service
      .listScreenings(filter, controller.signal)
      .then((result) => {
        if (active) setScreenings(result)
      })
      .catch((err: unknown) => {
        if (!active) return
        if (err instanceof ApiError && err.status === 401) {
          onExpired()
          return
        }
        setError(
          err instanceof Error && err.message
            ? err.message
            : 'Não foi possível carregar as triagens.',
        )
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [service, statusFilter, refresh, onExpired])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 6500)
    return () => window.clearTimeout(timer)
  }, [notice])

  function reload() {
    setScreenings(null)
    setError('')
    setRefresh((v) => v + 1)
  }

  async function handleQuickStatusChange(id: string, newStatus: ScreeningStatus) {
    if (updatingStatusId) return
    setUpdatingStatusId(id)
    try {
      await service.updateScreeningStatus(id, newStatus)
      setNotice(`Status da triagem alterado para ${screeningStatusLabels[newStatus]}.`)
      reload()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onExpired()
        return
      }
      setError('Não foi possível atualizar o status da triagem.')
    } finally {
      setUpdatingStatusId(null)
    }
  }

  function created() {
    setCreating(false)
    reload()
    setNotice('Triagem cadastrada com sucesso.')
  }

  function updated() {
    setEditing(null)
    reload()
    setNotice('Triagem atualizada com sucesso.')
  }

  function deleted() {
    setDeleting(null)
    reload()
    setNotice('Triagem excluída com sucesso.')
  }

  const counts = {
    ALL: screenings?.length ?? 0,
    AGUARDANDO: screenings?.filter((s) => s.status === 'AGUARDANDO').length ?? 0,
    ATENDIDO: screenings?.filter((s) => s.status === 'ATENDIDO').length ?? 0,
    DESISTIU: screenings?.filter((s) => s.status === 'DESISTIU').length ?? 0,
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ATENDIMENTO CLÍNICO</span>
          <h1 ref={heading} tabIndex={-1}>
            Triagem<span className="heading-dot">.</span>
          </h1>
          <p className="muted">
            Gerencie a fila de triagem, classificação de risco e sintomas dos pacientes.
          </p>
        </div>
        <button
          type="button"
          className="button primary"
          onClick={() => setCreating(true)}
        >
          <Icon name="plus" size={18} />
          Nova triagem
        </button>
      </div>

      {session.mode === 'demo' && (
        <div className="demo-banner">
          <span className="demo-badge">DEMONSTRAÇÃO</span>
          <p>
            Você está explorando dados fictícios de triagem e classificação de risco. As alterações
            são temporárias e mantidas apenas na sessão atual.
          </p>
        </div>
      )}

      {notice && (
        <div className="success-box" role="status">
          <Icon name="check" size={18} />
          {notice}
        </div>
      )}

      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-icon">
            <Icon name="activity" size={24} />
          </span>
          <div>
            <span className="summary-label">Aguardando atendimento</span>
            <strong className="summary-number">
              {loading ? '…' : counts.AGUARDANDO}
            </strong>
          </div>
          <span className="summary-caption">Fila de espera ativa</span>
        </div>

        <div className="summary-card">
          <span className="summary-icon">
            <Icon name="check" size={24} />
          </span>
          <div>
            <span className="summary-label">Pacientes atendidos</span>
            <strong className="summary-number">
              {loading ? '…' : counts.ATENDIDO}
            </strong>
          </div>
          <span className="summary-caption">Triagens concluídas</span>
        </div>

        <div className="summary-card session-card">
          <span className="summary-icon subtle">
            <Icon name="shield" size={24} />
          </span>
          <div>
            <span className="summary-label">Seu perfil de acesso</span>
            <strong className="profile-title">
              {profileLabels[session.usuario.perfil] ?? session.usuario.perfil}
            </strong>
            <span className="session-note">
              {session.mode === 'demo' ? 'Sessão de demonstração' : 'Sessão autenticada'}
            </span>
          </div>
        </div>
      </div>

      <section className="records-card" aria-labelledby="triage-title" aria-busy={loading}>
        <div className="records-header">
          <div>
            <h2 id="triage-title">Fila de triagem</h2>
            <p>Registros de triagem e classificação por ordem de prioridade e chegada</p>
          </div>
          <button
            type="button"
            className="button quiet"
            disabled={loading}
            onClick={() => reload()}
            title="Recarregar dados"
          >
            <Icon name="refresh" size={16} />
            <span>Atualizar</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="filter-bar">
          <div className="filter-tabs" role="tablist" aria-label="Filtrar por status">
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'ALL'}
              className={`filter-tab ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => {
                setScreenings(null)
                setStatusFilter('ALL')
              }}
            >
              Todos
              {screenings !== null && statusFilter === 'ALL' && (
                <span className="tab-count">{counts.ALL}</span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'AGUARDANDO'}
              className={`filter-tab ${statusFilter === 'AGUARDANDO' ? 'active' : ''}`}
              onClick={() => {
                setScreenings(null)
                setStatusFilter('AGUARDANDO')
              }}
            >
              Aguardando
              {screenings !== null && (
                <span className="tab-count warning">{counts.AGUARDANDO}</span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'ATENDIDO'}
              className={`filter-tab ${statusFilter === 'ATENDIDO' ? 'active' : ''}`}
              onClick={() => {
                setScreenings(null)
                setStatusFilter('ATENDIDO')
              }}
            >
              Atendidos
              {screenings !== null && (
                <span className="tab-count success">{counts.ATENDIDO}</span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'DESISTIU'}
              className={`filter-tab ${statusFilter === 'DESISTIU' ? 'active' : ''}`}
              onClick={() => {
                setScreenings(null)
                setStatusFilter('DESISTIU')
              }}
            >
              Desistências
              {screenings !== null && (
                <span className="tab-count muted">{counts.DESISTIU}</span>
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="table-state" role="status">
            <span className="spinner teal" />
            <h3>Carregando triagens</h3>
            <p>Aguarde um instante.</p>
          </div>
        ) : error ? (
          <div className="table-state">
            <span className="state-icon">
              <Icon name="refresh" size={26} />
            </span>
            <h3>Não foi possível carregar</h3>
            <p role="alert">{error}</p>
            <button type="button" className="button secondary" onClick={() => reload()}>
              Tentar novamente
            </button>
          </div>
        ) : screenings && screenings.length === 0 ? (
          <div className="table-state">
            <span className="state-icon">
              <Icon name="activity" size={26} />
            </span>
            <h3>Nenhuma triagem encontrada</h3>
            <p>
              {statusFilter !== 'ALL'
                ? `Não há triagens com o status selecionado (${screeningStatusLabels[statusFilter as ScreeningStatus]}).`
                : 'Nenhuma triagem foi registrada ainda.'}
            </p>
            {statusFilter === 'ALL' && (
              <button
                type="button"
                className="button primary"
                onClick={() => setCreating(true)}
              >
                <Icon name="plus" size={17} />
                Realizar primeira triagem
              </button>
            )}
          </div>
        ) : (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Tabela de triagens"
          >
            <table className="triage-table">
              <caption className="sr-only">Lista de triagens realizadas</caption>
              <thead>
                <tr>
                  <th scope="col">Paciente</th>
                  <th scope="col">Classificação de Risco</th>
                  <th scope="col">Status</th>
                  <th scope="col">Data/Hora</th>
                  <th scope="col">Sintomas & Observações</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {screenings?.map((item) => {
                  const patient = patientsMap[item.patientId]
                  const patientDisplayName = patient?.nome ?? item.patientId
                  const patientCpf = patient?.cpf
                    ? patient.cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
                    : null

                  return (
                    <tr key={item.id}>
                      <th scope="row">
                        <div className="person-cell">
                          <span className="avatar small" aria-hidden="true">
                            {initials(patientDisplayName)}
                          </span>
                          <div>
                            <div>{patientDisplayName}</div>
                            {patientCpf && <small className="muted">{patientCpf}</small>}
                          </div>
                        </div>
                      </th>

                      <td>
                        {item.riskClassification ? (
                          <span
                            className={`priority-badge ${getPriorityBadgeClass(item.riskClassification.priorityLevel)}`}
                          >
                            <span className="priority-dot" />
                            {item.riskClassification.name}
                          </span>
                        ) : (
                          <span className="priority-badge priority-default">Não classificado</span>
                        )}
                      </td>

                      <td>
                        <span className={`status-pill ${getStatusBadgeClass(item.status)}`}>
                          {screeningStatusLabels[item.status] ?? item.status}
                        </span>
                      </td>

                      <td>
                        <span>{formatDatetime(item.screeningDate)}</span>
                      </td>

                      <td>
                        {item.symptoms && item.symptoms.length > 0 && (
                          <div className="symptoms-chips">
                            {item.symptoms.map((s) => (
                              <span key={s.id} className="symptom-chip">
                                {s.name}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.notes && <p className="screening-notes-preview">{item.notes}</p>}
                      </td>

                      <td>
                        <div className="record-actions">
                          {item.status === 'AGUARDANDO' && (
                            <button
                              type="button"
                              className="button success-quiet"
                              title="Marcar como Atendido"
                              onClick={() => void handleQuickStatusChange(item.id, 'ATENDIDO')}
                              disabled={updatingStatusId === item.id}
                            >
                              <Icon name="check" size={15} />
                              Atender
                            </button>
                          )}

                          <button
                            type="button"
                            className="button quiet"
                            aria-label={`Editar triagem de ${patientDisplayName}`}
                            onClick={() => setEditing(item)}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="button danger-quiet"
                            aria-label={`Excluir triagem de ${patientDisplayName}`}
                            onClick={() => setDeleting(item)}
                          >
                            <Icon name="trash" size={16} />
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {creating && (
        <ScreeningDialog
          service={service}
          patientsService={patientsService}
          onClose={() => setCreating(false)}
          onSaved={created}
          onExpired={onExpired}
        />
      )}

      {editing && (
        <ScreeningDialog
          screening={editing}
          service={service}
          patientsService={patientsService}
          onClose={() => setEditing(null)}
          onSaved={updated}
          onExpired={onExpired}
        />
      )}

      {deleting && (
        <ConfirmDeleteDialog
          kind="triagem"
          recordName={`Triagem de ${patientsMap[deleting.patientId]?.nome ?? deleting.patientId}`}
          recordDetail={`Data: ${formatDatetime(deleting.screeningDate)} | Status: ${screeningStatusLabels[deleting.status]}`}
          onDelete={() => service.deleteScreening(deleting.id)}
          onDeleted={deleted}
          onClose={() => setDeleting(null)}
          onExpired={onExpired}
        />
      )}
    </>
  )
}
