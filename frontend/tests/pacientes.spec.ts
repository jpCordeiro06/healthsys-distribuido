import { expect, test, type Page } from '@playwright/test'

const api = 'http://localhost:8080/api/v1'
const patient = {
  id: 'patient-1', nome: 'Ana Teste', cpf: '52998224725',
  dataNascimento: '1990-05-12', sexo: 'Feminino', telefone: '(85) 99999-0000',
}
const pageOf = (content: unknown[], page = 0, total = content.length) => ({
  content, page, size: 10, totalElements: total, totalPages: Math.ceil(total / 10),
  first: page === 0, last: (page + 1) * 10 >= total,
})

async function signIn(page: Page) {
  await page.route(`${api}/auth/login`, (route) => route.fulfill({ json: {
    accessToken: 'patient-test-token', tokenType: 'Bearer', expiresIn: 3600,
    usuario: { id: 'admin', nome: 'Administrador', email: 'admin@example.invalid', perfil: 'ADMIN' },
  } }))
  await page.route(`${api}/users?**`, (route) => route.fulfill({ json: { ...pageOf([]), number: 0 } }))
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill('admin@example.invalid')
  await page.getByLabel('Senha', { exact: true }).fill('SenhaFicticia123')
  await page.getByRole('button', { name: 'Entrar na plataforma' }).click()
  await page.getByRole('link', { name: 'Pacientes', exact: true }).click()
}

async function fillPatient(page: Page) {
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Nome completo').fill(patient.nome)
  await dialog.getByLabel(/^CPF/).fill(patient.cpf)
  await dialog.getByLabel('Data de nascimento').fill(patient.dataNascimento)
  await dialog.getByLabel(/^Sexo/).selectOption(patient.sexo)
  await dialog.getByLabel('Telefone').fill(patient.telefone)
}

test('demo patients support navigation, CPF validation, creation and editing across pages', async ({ page }) => {
  await page.goto('/patients')
  await expect(page).toHaveURL(/\/login$/)
  await page.getByRole('button', { name: 'Explorar demonstração' }).click()
  await page.getByRole('link', { name: 'Pacientes', exact: true }).click()
  await expect(page).toHaveURL(/\/patients$/)
  await expect(page.getByRole('link', { name: 'Pacientes', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(page.locator('.breadcrumb strong')).toHaveText('Pacientes')
  await expect(page.getByRole('rowheader', { name: /Ana Exemplo/ })).toBeVisible()
  await page.getByRole('button', { name: 'Novo paciente' }).click()
  await fillPatient(page)
  await page.getByLabel(/^CPF/).fill('11111111111')
  await page.getByRole('button', { name: 'Cadastrar paciente', exact: true }).click()
  await expect(page.getByText('Informe um CPF válido.')).toBeVisible()
  await page.getByLabel(/^CPF/).fill(patient.cpf)
  await page.getByRole('button', { name: 'Cadastrar paciente', exact: true }).click()
  await expect(page.getByText('Este CPF já está em uso.', { exact: true })).toBeVisible()
  await page.getByLabel(/^CPF/).fill('39053344705')
  await page.getByRole('button', { name: 'Cadastrar paciente', exact: true }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.getByRole('button', { name: 'Editar Ana Teste', exact: true }).click()
  await expect(page.getByLabel('Data de nascimento')).toHaveValue(patient.dataNascimento)
  await page.getByLabel('Nome completo').fill('Ana Atualizada')
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.getByRole('link', { name: 'Usuários', exact: true }).click()
  await page.getByRole('link', { name: 'Pacientes', exact: true }).click()
  await expect(page.getByRole('rowheader', { name: /Ana Atualizada/ })).toBeVisible()
  await page.getByRole('button', { name: 'Editar Ana Atualizada', exact: true }).click()
  await page.getByLabel(/^Sexo/).selectOption('Outro')
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByLabel('Especifique o sexo').fill('Personalizado')
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.getByRole('button', { name: 'Editar Ana Atualizada', exact: true }).click()
  await expect(page.getByLabel(/^Sexo/)).toHaveValue('Outro')
  await expect(page.getByLabel('Especifique o sexo')).toHaveValue('Personalizado')
  await page.getByLabel(/^Sexo/).selectOption('Masculino')
  await expect(page.getByLabel('Especifique o sexo')).toHaveCount(0)
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: /Ana Atualizada/ }) })).toContainText('Masculino')
})

test('patient API normalizes pagination, sends JWT and saves patient details without replacing clinical history', async ({ page }) => {
  let records = Array.from({ length: 11 }, (_, i) => ({ ...patient, id: `patient-${i}`, nome: `Paciente ${i}` }))
  await page.route(`${api}/patients**`, (route) => {
    expect(route.request().headers().authorization).toBe('Bearer patient-test-token')
    const method = route.request().method()
    if (method === 'POST' || method === 'PUT') {
      const input = route.request().postDataJSON()
      expect(input).not.toHaveProperty('alergias')
      expect(input).not.toHaveProperty('vacinas')
      if (method === 'POST') {
        expect(input).toEqual({ ...patient, id: undefined })
        const created = { ...input, id: 'new-patient' }
        records = [created, ...records]
        return route.fulfill({ status: 201, json: created })
      }
      expect(route.request().url()).toBe(`${api}/patients/new-patient`)
      records[0] = { ...records[0], ...input }
      return route.fulfill({ json: records[0] })
    }
    const url = new URL(route.request().url())
    expect(url.searchParams.get('sort')).toBe('nome,asc')
    const current = Number(url.searchParams.get('page'))
    return route.fulfill({ json: pageOf(records.slice(current * 10, current * 10 + 10), current, records.length) })
  })
  await signIn(page)
  await expect(page.getByText('Página 1 de 2')).toBeVisible()
  await page.getByRole('button', { name: 'Próxima página' }).click()
  await expect(page.getByText('Página 2 de 2')).toBeVisible()
  await page.getByRole('button', { name: 'Novo paciente' }).click()
  await fillPatient(page)
  await page.getByRole('button', { name: 'Cadastrar paciente', exact: true }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByText('Página 1 de 2')).toBeVisible()
  await page.getByRole('button', { name: 'Editar Ana Teste', exact: true }).click()
  await page.getByLabel('Telefone').fill('(85) 98888-0000')
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByText('(85) 98888-0000', { exact: true })).toBeVisible()
})

test('patient errors can be retried and an expired JWT redirects to login', async ({ page }) => {
  let failed = true
  await page.route(`${api}/patients**`, (route) => failed
    ? route.fulfill({ status: 502, body: 'Bad gateway' })
    : route.fulfill({ json: pageOf([]) }))
  await signIn(page)
  await expect(page.getByRole('heading', { name: 'Não foi possível carregar' })).toBeVisible()
  failed = false
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('heading', { name: 'Vamos cadastrar seu primeiro paciente?' })).toBeVisible()
  await page.unroute(`${api}/patients**`)
  await page.route(`${api}/patients**`, (route) => route.fulfill({ status: 401, json: {} }))
  await page.getByRole('button', { name: 'Atualizar' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('status')).toContainText('Sua sessão expirou')
})
