import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../api'
import { PatientDialog } from '../components/PatientDialog'
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog'
import { Icon } from '../components/Icon'
import { profileLabels, type Page, type Session, type Patient, type PatientsService } from '../types'

interface Props {
  session: Session
  service: PatientsService
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

export function PatientsPage({ session, service, onExpired }: Props) {
  const [page, setPage] = useState(0)
  const [refresh, setRefresh] = useState(0)
  const [data, setData] = useState<Page<Patient> | null>(null)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Patient | null>(null)
  const [deleting, setDeleting] = useState<Patient | null>(null)
  const [notice, setNotice] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const loading = data === null && error === ''

  useEffect(() => {
    heading.current?.focus()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    void service
      .listPatients(page, controller.signal)
      .then((result) => {
        if (active) setData(result)
      })
      .catch((error: unknown) => {
        if (!active) return
        if (error instanceof ApiError && error.status === 401) {
          onExpired()
          return
        }
        setError(
          error instanceof Error && error.message
            ? error.message
            : 'Não foi possível carregar os pacientes.',
        )
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [service, page, refresh, onExpired])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 6500)
    return () => window.clearTimeout(timer)
  }, [notice])

  function reload(nextPage = page) {
    setData(null)
    setError('')
    setPage(nextPage)
    setRefresh((value) => value + 1)
  }

  function created() {
    setCreating(false)
    reload(0)
    setNotice('Paciente cadastrado com sucesso.')
  }

  function deleted() {
    setDeleting(null)
    reload(page > 0 && data?.content.length === 1 ? page - 1 : page)
    setNotice('Paciente excluído com sucesso.')
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">GESTÃO DE CADASTROS</span>
          <h1 ref={heading} tabIndex={-1}>
            Pacientes<span className="heading-dot">.</span>
          </h1>
          <p className="muted">Consulte, cadastre e edite os pacientes da unidade.</p>
        </div>
        <button type="button" className="button primary" onClick={() => setCreating(true)}>
          <Icon name="plus" size={18} />
          Novo paciente
        </button>
      </div>
      {session.mode === 'demo' && (
        <div className="demo-banner">
          <span className="demo-badge">DEMONSTRAÇÃO</span>
          <p>
            Você está explorando dados fictícios. Os cadastros são temporários e não são enviados à
            API.
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
            <Icon name="cross" size={24} />
          </span>
          <div>
            <span className="summary-label">Pacientes cadastrados</span>
            <strong className="summary-number">
              {loading ? '…' : data ? data.totalElements.toLocaleString('pt-BR') : '—'}
            </strong>
          </div>
          <span className="summary-caption">Total de registros</span>
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
      <section className="records-card" aria-labelledby="patients-title" aria-busy={loading}>
        <div className="records-header">
          <div>
            <h2 id="patients-title">Lista de pacientes</h2>
            <p>Cadastros organizados por nome</p>
          </div>
          <button
            type="button"
            className="button quiet"
            disabled={loading}
            onClick={() => reload()}
          >
            <Icon name="refresh" size={16} />
            <span>Atualizar</span>
          </button>
        </div>
        {loading ? (
          <div className="table-state" role="status">
            <span className="spinner teal" />
            <h3>Carregando pacientes</h3>
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
        ) : data?.content.length ? (
          <div className="table-scroll" tabIndex={0} role="region" aria-label="Tabela de pacientes">
            <table className="patients-table">
              <caption className="sr-only">Pacientes cadastrados</caption>
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">CPF</th>
                  <th scope="col">Nascimento</th>
                  <th scope="col">Sexo</th>
                  <th scope="col">Telefone</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((patient) => (
                  <tr key={patient.id}>
                    <th scope="row">
                      <div className="person-cell">
                        <span className="avatar small" aria-hidden="true">
                          {initials(patient.nome)}
                        </span>
                        <span>{patient.nome}</span>
                      </div>
                    </th>
                    <td>{patient.cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')}</td>
                    <td>{patient.dataNascimento.split('-').reverse().join('/')}</td>
                    <td>{patient.sexo}</td>
                    <td>{patient.telefone || '—'}</td>
                    <td>
                      <div className="record-actions">
                        <button type="button" className="button quiet" aria-label={`Editar ${patient.nome}`} onClick={() => setEditing(patient)}>
                          Editar
                        </button>
                        <button type="button" className="button danger-quiet" aria-label={`Excluir paciente ${patient.nome}`} onClick={() => setDeleting(patient)}>
                          <Icon name="trash" size={16} />
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-state">
            <span className="state-icon">
              <Icon name="cross" size={28} />
            </span>
            <h3>Vamos cadastrar seu primeiro paciente?</h3>
            <p>Adicione um paciente para vê-lo nesta lista.</p>
            <button type="button" className="button secondary" onClick={() => setCreating(true)}>
              <Icon name="plus" size={16} />
              Cadastrar paciente
            </button>
          </div>
        )}
        {data && (
          <div className="pagination">
            <p>
              {data.totalElements === 0
                ? 'Nenhum registro'
                : `${data.number * data.size + 1}–${data.number * data.size + data.content.length} de ${data.totalElements} registros`}
            </p>
            <div className="pagination-controls">
              <button
                type="button"
                className="icon-button previous"
                aria-label="Página anterior"
                disabled={data.first}
                onClick={() => reload(page - 1)}
              >
                <Icon name="chevron" size={17} />
              </button>
              <span>
                Página {data.totalPages === 0 ? 0 : data.number + 1} de {data.totalPages}
              </span>
              <button
                type="button"
                className="icon-button"
                aria-label="Próxima página"
                disabled={data.last}
                onClick={() => reload(page + 1)}
              >
                <Icon name="chevron" size={17} />
              </button>
            </div>
          </div>
        )}
      </section>
      <p className="workspace-footnote">
        <Icon name="shield" size={15} />
        {session.mode === 'demo'
          ? 'Ambiente de demonstração • Apenas dados fictícios'
          : 'Acesso restrito à equipe autorizada'}
      </p>
      {deleting && (
        <ConfirmDeleteDialog
          kind="paciente"
          recordName={deleting.nome}
          recordDetail={deleting.cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')}
          onDelete={() => service.deletePatient(deleting.id)}
          onDeleted={deleted}
          onClose={() => setDeleting(null)}
          onExpired={onExpired}
        />
      )}
      {editing && (
        <PatientDialog
          key={editing.id}
          patient={editing}
          service={service}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
            setNotice('Paciente atualizado com sucesso.')
          }}
          onExpired={onExpired}
        />
      )}
      {creating && (
        <PatientDialog
          service={service}
          onClose={() => setCreating(false)}
          onSaved={created}
          onExpired={onExpired}
        />
      )}
    </>
  )
}
