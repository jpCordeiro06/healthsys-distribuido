import { useState, type FormEvent } from 'react'
import { ApiError } from '../api'
import { login } from '../services/auth'
import { Brand } from '../components/Brand'
import { Icon } from '../components/Icon'
import { demoEnabled } from '../services/demo'
import type { Session } from '../types'

interface Props {
  notice: string
  onLogin: (session: Session) => void
  onDemo: () => void
}

export function LoginPage({ notice, onLogin, onDemo }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      onLogin(await login(email.trim(), password))
    } catch (error) {
      setError(
        error instanceof ApiError ? error.message : 'Não foi possível entrar. Tente novamente.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-story" aria-label="HealthSys">
        <Brand />
        <div className="story-content">
          <span className="eyebrow story-eyebrow">
            <span className="status-dot" /> GESTÃO HOSPITALAR
          </span>
          <h1>
            Gestão hospitalar.
            <br />
            <span>
              Usuários e acessos
              <br />
              em um só lugar.
            </span>
          </h1>
          <p>Consulte e organize os usuários e os perfis de acesso da instituição.</p>
          <div className="care-graphic" aria-hidden="true">
            <div className="care-orbit orbit-one" />
            <div className="care-orbit orbit-two" />
            <div className="care-cross">
              <Icon name="cross" size={58} />
            </div>
            <div className="care-tag tag-users">
              <span className="mini-icon">
                <Icon name="users" />
              </span>
              <span>
                Usuários<strong>Gestão de cadastros</strong>
              </span>
              <span className="tiny-check">
                <Icon name="check" size={14} />
              </span>
            </div>
            <div className="care-tag tag-access">
              <span className="mini-icon">
                <Icon name="shield" />
              </span>
              <span>
                Acesso<strong>Perfis da equipe</strong>
              </span>
            </div>
          </div>
        </div>
        <p className="story-footer">
          HealthSys Distribuído <span>Gestão hospitalar</span>
        </p>
      </section>
      <section className="login-panel" aria-labelledby="login-title">
        <div className="mobile-brand">
          <Brand />
        </div>
        <span className="login-topnote">
          <Icon name="shield" size={16} /> Acesso da equipe
        </span>
        <div className="login-form-wrap">
          <span className="eyebrow">BEM-VINDO AO HEALTHSYS</span>
          <h2 id="login-title">Acesse sua conta</h2>
          <p className="muted">Entre com suas credenciais para continuar.</p>
          {notice && (
            <div className="notice" role="status">
              {notice}
            </div>
          )}
          <form onSubmit={(event) => void submit(event)} className="login-form">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="voce@hospital.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                maxLength={254}
                disabled={busy}
              />
            </div>
            <div className="field">
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={busy}
              />
            </div>
            {error && (
              <div className="error-box" role="alert">
                {error}
              </div>
            )}
            <button type="submit" className="button primary login-submit" disabled={busy}>
              {busy ? 'Entrando…' : 'Entrar na plataforma'}
              {busy ? <span className="spinner" /> : <Icon name="arrow" size={18} />}
            </button>
          </form>
          <p className="access-help">Precisa de acesso? Fale com o administrador da sua equipe.</p>
          {demoEnabled && (
            <div className="demo-entry">
              <div className="demo-divider">
                <span>CONHEÇA A INTERFACE</span>
              </div>
              <button
                type="button"
                className="button secondary demo-button"
                onClick={onDemo}
                disabled={busy}
              >
                Explorar demonstração
                <Icon name="arrow" size={17} />
              </button>
              <p>Dados fictícios. Nenhuma conexão com a API.</p>
            </div>
          )}
        </div>
        <p className="login-footer">Acesso exclusivo à equipe autorizada.</p>
      </section>
    </main>
  )
}
