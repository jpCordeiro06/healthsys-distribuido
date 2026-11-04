import { NavLink, Outlet, useLocation } from 'react-router'
import { Brand } from './Brand'
import { Icon } from './Icon'
import { profileLabels, type Session } from '../types'

interface Props {
  session: Session
  onSignOut: () => void
}

export function AppLayout({ session, onSignOut }: Props) {
  const { pathname } = useLocation()
  const title = pathname === '/patients' ? 'Pacientes' : 'Usuários'
  return (
    <div className="app-layout">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('main-content')?.focus()
        }}
      >
        Pular para o conteúdo
      </a>
      <aside className="sidebar" aria-label="Menu principal">
        <Brand />
        <span className="sidebar-caption">ÁREA DE TRABALHO</span>
        <nav>
          <NavLink to="/users" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Icon name="users" />
            <span>Usuários</span>
            <Icon name="chevron" size={15} />
          </NavLink>
          <NavLink to="/patients" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Icon name="cross" />
            <span>Pacientes</span>
            <Icon name="chevron" size={15} />
          </NavLink>
        </nav>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Área de trabalho</span>
            <Icon name="chevron" size={13} />
            <strong>{title}</strong>
          </div>
          <div className="account-menu">
            <span className={`connection-label ${session.mode === 'demo' ? 'demo' : ''}`}>
              <span className="status-dot" />
              {session.mode === 'demo' ? 'Modo demonstração' : 'Sessão autenticada'}
            </span>
            <span className="account-divider" />
            <span className="avatar account-avatar" aria-hidden="true">
              {session.usuario.nome.slice(0, 1).toUpperCase()}
            </span>
            <div className="account-text">
              <strong>{session.usuario.nome}</strong>
              <span>{profileLabels[session.usuario.perfil] ?? session.usuario.perfil}</span>
            </div>
            <button
              type="button"
              className="icon-button logout-button"
              aria-label="Sair da plataforma"
              title="Sair"
              onClick={onSignOut}
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>HealthSys Distribuído</span>
          <span>Gestão hospitalar</span>
        </footer>
      </div>
    </div>
  )
}
