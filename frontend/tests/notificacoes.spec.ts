import { expect, test, type Page } from '@playwright/test'

const api = 'http://localhost:8080/api/v1'

const mockUser = {
  id: 'user-admin',
  nome: 'Administrador Teste',
  email: 'admin@example.invalid',
  perfil: 'ADMIN',
}

const mockPatients = [
  {
    id: 'patient-1',
    nome: 'Carlos Silva',
    cpf: '12345678901',
    dataNascimento: '1985-04-10',
    sexo: 'Masculino',
    telefone: '(11) 98888-7777',
  },
]

const mockChannels = [
  { id: 'chan-1', name: 'Email', description: 'Envio por email', active: true },
  { id: 'chan-2', name: 'WebSocket', description: 'Tempo real', active: true },
]

const mockNotifications = [
  {
    id: 'notif-1',
    senderId: null,
    receiverId: 'user-admin',
    type: 'TRIAGE_ALERT',
    title: 'Alerta Crítico de Triagem',
    message: 'Paciente em estado grave necessita de atendimento imediato.',
    sentAt: new Date().toISOString(),
    readAt: null,
    isRead: false,
    isUrgent: true,
    channel: mockChannels[1],
  },
]

async function signIn(page: Page) {
  await page.route(`${api}/auth/login`, (route) =>
    route.fulfill({
      json: {
        accessToken: 'notif-test-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        usuario: mockUser,
      },
    }),
  )
  await page.route(`${api}/users?**`, (route) =>
    route.fulfill({
      json: {
        content: [mockUser],
        number: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
      },
    }),
  )
  await page.route(`${api}/patients?**`, (route) =>
    route.fulfill({
      json: {
        content: mockPatients,
        number: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
      },
    }),
  )
  await page.route(`${api}/notification-channels?**`, (route) =>
    route.fulfill({
      json: mockChannels,
    }),
  )
  await page.route(`${api}/notifications?**`, (route) =>
    route.fulfill({
      json: mockNotifications,
    }),
  )

  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill(mockUser.email)
  await page.getByLabel('Senha', { exact: true }).fill('Senha123')
  await page.getByRole('button', { name: 'Entrar na plataforma' }).click()
  await page.getByRole('link', { name: 'Notificações', exact: true }).click()
}

test('demo notifications supports navigation, tabs, view and creation flow', async ({ page }) => {
  await page.goto('/notifications')
  await expect(page).toHaveURL(/\/login$/)
  await page.getByRole('button', { name: 'Explorar demonstração' }).click()

  await page.getByRole('link', { name: 'Notificações', exact: true }).click()
  await expect(page).toHaveURL(/\/notifications$/)
  await expect(page.getByRole('link', { name: 'Notificações', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.locator('.breadcrumb strong')).toHaveText('Notificações')
  await expect(page.getByRole('heading', { name: 'Central de Notificações' })).toBeVisible()

  // Verify demo notification content
  await expect(page.getByText('ALERTA DE RISCO - Paciente Prioritário (LARANJA)')).toBeVisible()

  // Test channels tab
  await page.getByRole('tab', { name: /Canais de Envio/i }).click()
  await expect(page.getByText('WebSocket')).toBeVisible()
  await expect(page.getByText('Email')).toBeVisible()

  // Go back to all notifications tab
  await page.getByRole('tab', { name: 'Todas as Notificações' }).click()
  await expect(page.getByText('ALERTA DE RISCO - Paciente Prioritário (LARANJA)')).toBeVisible()

  // Open notification modal
  await page.getByRole('button', { name: 'Nova Notificação' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Nova Notificação' })).toBeVisible()

  await page.getByLabel(/Título da Notificação/i).fill('Aviso de Teste Automatizado')
  await page.getByLabel(/Mensagem \/ Conteúdo/i).fill('Mensagem enviada com sucesso no teste.')
  await page.getByRole('button', { name: 'Enviar Notificação' }).click()

  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByText('Aviso de Teste Automatizado')).toBeVisible()
})

test('authenticated notifications renders correctly', async ({ page }) => {
  await signIn(page)
  await expect(page).toHaveURL(/\/notifications$/)
  await expect(page.getByText('Alerta Crítico de Triagem')).toBeVisible()
})
