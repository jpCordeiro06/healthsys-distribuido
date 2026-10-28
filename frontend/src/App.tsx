import { useCallback, useEffect, useState } from 'react'
import { createUsersService } from './services/users'
import { Brand } from './components/Brand'
import { Icon } from './components/Icon'
import { LoginPage } from './pages/LoginPage'
import { UsersPage } from './pages/UsersPage'
import { createDemoSession, createDemoUsersService, demoEnabled } from './services/demo'
import { profileLabels, type UsersService, type Session } from './types'

function App() {
  const [auth, setAuth] = useState<{ session: Session; users: UsersService } | null>(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (window.location.hash.startsWith('#/')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [])

  const expireSession = useCallback(() => {
    setAuth(null)
    setNotice('Sua sessão expirou. Entre novamente para continuar.')
  }, [])

  useEffect(() => {
    const expiresAt = auth?.session.expiresAt
    if (!expiresAt) return
    let timer: number
    function schedule() {
      const remaining = expiresAt! - Date.now()
      if (remaining <= 0) {
        expireSession()
        return
      }
      timer = window.setTimeout(schedule, Math.min(remaining, 2_147_483_647))
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [auth, expireSession])

  function signIn(session: Session) {
    if (!session.accessToken) return
    setNotice('')
    setAuth({ session, users: createUsersService(session.accessToken) })
  }

  function openDemo() {
    if (!demoEnabled) return
    setNotice('')
    setAuth({ session: createDemoSession(), users: createDemoUsersService() })
  }

  function signOut() {
    setAuth(null)
    setNotice('Você saiu da plataforma.')
  }

  if (!auth) return <LoginPage notice={notice} onLogin={signIn} onDemo={openDemo} />
  const { session, users } = auth

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
          <a href="#main-content" className="nav-link active" aria-current="page">
            <Icon name="users" />
            <span>Usuários</span>
            <Icon name="chevron" size={15} />
          </a>
        </nav>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Área de trabalho</span>
            <Icon name="chevron" size={13} />
            <strong>Usuários</strong>
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
              onClick={signOut}
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          <UsersPage session={session} service={users} onExpired={expireSession} />
        </main>
        <footer className="app-footer">
          <span>HealthSys Distribuído</span>
          <span>Gestão hospitalar</span>
        </footer>
      </div>
    </div>
  )
}

export default App
