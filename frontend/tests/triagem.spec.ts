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
  {
    id: 'patient-2',
    nome: 'Mariana Costa',
    cpf: '98765432100',
    dataNascimento: '1992-08-15',
    sexo: 'Feminino',
    telefone: '(11) 97777-6666',
  },
]

const mockRiskClassifications = [
  { id: 'rc-1', name: 'Emergência (Vermelho)', priorityLevel: 1, active: true },
  { id: 'rc-2', name: 'Muito Urgente (Laranja)', priorityLevel: 2, active: true },
  { id: 'rc-3', name: 'Urgente (Amarelo)', priorityLevel: 3, active: true },
]

const mockSymptoms = [
  { id: 'sym-1', name: 'Febre alta (> 39°C)', active: true },
  { id: 'sym-2', name: 'Dor no peito', active: true },
  { id: 'sym-3', name: 'Falta de ar', active: true },
]

async function signIn(page: Page) {
  await page.route(`${api}/auth/login`, (route) =>
    route.fulfill({
      json: {
        accessToken: 'triage-test-token',
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
        totalElements: 2,
        totalPages: 1,
        first: true,
        last: true,
      },
    }),
  )
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill(mockUser.email)
  await page.getByLabel('Senha', { exact: true }).fill('Senha123')
  await page.getByRole('button', { name: 'Entrar na plataforma' }).click()
  await page.getByRole('link', { name: 'Triagem', exact: true }).click()
}

test('demo triage supports navigation, queue filters, screening creation, and status updates', async ({
  page,
}) => {
  await page.goto('/triage')
  await expect(page).toHaveURL(/\/login$/)
  await page.getByRole('button', { name: 'Explorar demonstração' }).click()

  await page.getByRole('link', { name: 'Triagem', exact: true }).click()
  await expect(page).toHaveURL(/\/triage$/)
  await expect(page.getByRole('link', { name: 'Triagem', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.locator('.breadcrumb strong')).toHaveText('Triagem')
  await expect(page.getByRole('heading', { name: 'Triagem.', exact: true })).toBeVisible()

  // Verify demo initial screenings
  await expect(page.getByText('Ana Exemplo')).toBeVisible()
  await expect(page.getByText('Muito Urgente (Laranja)')).toBeVisible()

  // Test status filter tabs
  await page.getByRole('tab', { name: 'Aguardando' }).click()
  await expect(page.getByText('Ana Exemplo')).toBeVisible()

  await page.getByRole('tab', { name: 'Atendidos' }).click()
  await expect(page.getByText('Bruno Exemplo')).toBeVisible()

  await page.getByRole('tab', { name: 'Todos' }).click()

  // Create new screening
  await page.getByRole('button', { name: 'Nova triagem' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Nova Triagem' })).toBeVisible()

  await dialog.getByLabel(/Paciente/).selectOption({ label: 'Ana Exemplo (CPF: 52998224725)' })
  await dialog.getByLabel(/Classificação de Risco/).selectOption({ label: 'Prioridade 1: Emergência (Vermelho)' })
  await dialog.getByLabel('Dor no peito').check()
  await dialog.getByLabel(/Observações/).fill('Paciente com suspeita de infarto agudo.')
  await dialog.getByRole('button', { name: 'Cadastrar triagem' }).click()

  await expect(dialog).not.toBeVisible()
  await expect(page.getByRole('status')).toContainText('Triagem cadastrada com sucesso.')
  await expect(page.getByText('Emergência (Vermelho)')).toBeVisible()
  await expect(page.getByText('Paciente com suspeita de infarto agudo.')).toBeVisible()
})

test('API mode sends JWT token and handles screening creation and status update', async ({
  page,
}) => {
  let createdScreening: unknown = null
  let statusUpdated = false

  await page.route(`${api}/risk-classifications**`, (route) =>
    route.fulfill({ json: mockRiskClassifications }),
  )
  await page.route(`${api}/symptoms**`, (route) =>
    route.fulfill({ json: mockSymptoms }),
  )
  await page.route(`${api}/screenings**`, (route) => {
    expect(route.request().headers().authorization).toBe('Bearer triage-test-token')
    const method = route.request().method()

    if (method === 'GET') {
      const url = new URL(route.request().url())
      const statusParam = url.searchParams.get('status')
      const list = createdScreening ? [createdScreening] : []
      if (statusParam === 'ATENDIDO' && !statusUpdated) {
        return route.fulfill({ json: [] })
      }
      return route.fulfill({ json: list })
    }

    if (method === 'POST') {
      const body = route.request().postDataJSON()
      expect(body.patientId).toBe('patient-1')
      expect(body.riskClassificationId).toBe('rc-1')
      createdScreening = {
        id: 'new-screening-uuid',
        patientId: body.patientId,
        doctorId: null,
        riskClassification: mockRiskClassifications[0],
        status: 'AGUARDANDO',
        screeningDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: body.notes,
        symptoms: [mockSymptoms[1]],
      }
      return route.fulfill({ status: 201, json: createdScreening })
    }

    if (method === 'PATCH') {
      statusUpdated = true
      createdScreening = {
        ...(createdScreening as Record<string, unknown>),
        status: 'ATENDIDO',
      }
      return route.fulfill({ json: createdScreening })
    }

    return route.fulfill({ status: 200, json: {} })
  })

  await signIn(page)
  await expect(page.getByRole('heading', { name: 'Triagem.', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Nova triagem' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel(/Paciente/).selectOption({ label: 'Carlos Silva (CPF: 12345678901)' })
  await dialog.getByLabel(/Classificação de Risco/).selectOption({ label: 'Prioridade 1: Emergência (Vermelho)' })
  await dialog.getByLabel('Dor no peito').check()
  await dialog.getByLabel(/Observações/).fill('Paciente com dor no peito intensa.')
  await dialog.getByRole('button', { name: 'Cadastrar triagem' }).click()

  await expect(dialog).not.toBeVisible()
  await expect(page.getByRole('status')).toContainText('Triagem cadastrada com sucesso.')
  await expect(page.getByText('Carlos Silva')).toBeVisible()
  await expect(page.getByText('Emergência (Vermelho)')).toBeVisible()

  // Quick attend button
  await page.getByRole('button', { name: 'Atender' }).click()
  await expect(page.getByRole('status')).toContainText('Status da triagem alterado para Atendido.')
})
