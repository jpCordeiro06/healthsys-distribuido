import { useCallback, useEffect, useState } from 'react'
import { createUsersService } from './services/users'
import { createPatientsService } from './services/patients'
import { createTriageService } from './services/triage'
import { createNotificationsService } from './services/notifications'
import { PatientsPage } from './pages/PatientsPage'
import { TriagePage } from './pages/TriagePage'
import { NotificationsPage } from './pages/NotificationsPage'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AppLayout } from './components/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { UsersPage } from './pages/UsersPage'
import {
  createDemoSession,
  createDemoUsersService,
  createDemoPatientsService,
  createDemoTriageService,
  createDemoNotificationsService,
  demoEnabled,
} from './services/demo'
import type { UsersService, PatientsService, TriageService, NotificationsService, Session } from './types'

function App() {
  const [auth, setAuth] = useState<{
    session: Session
    users: UsersService
    patients: PatientsService
    triage: TriageService
    notifications: NotificationsService
  } | null>(null)
  const [notice, setNotice] = useState('')

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
    setAuth({
      session,
      users: createUsersService(session.accessToken),
      patients: createPatientsService(session.accessToken),
      triage: createTriageService(session.accessToken),
      notifications: createNotificationsService(session.accessToken),
    })
  }

  function openDemo() {
    if (!demoEnabled) return
    setNotice('')
    setAuth({
      session: createDemoSession(),
      users: createDemoUsersService(),
      patients: createDemoPatientsService(),
      triage: createDemoTriageService(),
      notifications: createDemoNotificationsService(),
    })
  }

  function signOut() {
    setAuth(null)
    setNotice('Você saiu da plataforma.')
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={auth ? '/users' : '/login'} replace />} />
        <Route
          path="/login"
          element={auth
            ? <Navigate to="/users" replace />
            : <LoginPage notice={notice} onLogin={signIn} onDemo={openDemo} />}
        />
        <Route
          element={auth
            ? <AppLayout session={auth.session} onSignOut={signOut} />
            : <Navigate to="/login" replace />}
        >
          <Route
            path="/users"
            element={auth && <UsersPage session={auth.session} service={auth.users} onExpired={expireSession} />}
          />
          <Route
            path="/patients"
            element={auth && <PatientsPage session={auth.session} service={auth.patients} onExpired={expireSession} />}
          />
          <Route
            path="/triage"
            element={
              auth && (
                <TriagePage
                  session={auth.session}
                  service={auth.triage}
                  patientsService={auth.patients}
                  onExpired={expireSession}
                />
              )
            }
          />
          <Route
            path="/notifications"
            element={
              auth && (
                <NotificationsPage
                  session={auth.session}
                  service={auth.notifications}
                  usersService={auth.users}
                  patientsService={auth.patients}
                  onExpired={expireSession}
                />
              )
            }
          />
        </Route>
        <Route path="*" element={<Navigate to={auth ? '/users' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
