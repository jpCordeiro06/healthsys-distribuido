import { expect, test, type Page } from '@playwright/test'

const api = 'http://localhost:8080/api/v1'
const user = {
  id: 'test-user',
  nome: 'Equipe Teste',
  email: 'equipe@example.invalid',
  perfil: 'ADMIN',
}
const newUser = {
  nome: 'Ana Equipe',
  email: 'ana@example.invalid',
  senha: 'SenhaFicticia123',
  perfil: 'RECEPCAO',
}
const pageOf = (content: unknown[], page = 0, totalElements = content.length) => ({
  content,
  page,
  size: 10,
  totalElements,
  totalPages: Math.ceil(totalElements / 10),
  first: page === 0,
  last: (page + 1) * 10 >= totalElements,
})

async function enterCredentials(page: Page) {
  await page.goto('/')
  await page.getByLabel('E-mail', { exact: true }).fill(user.email)
  await page.getByLabel('Senha', { exact: true }).fill('SenhaFicticia123')
  await page.getByRole('button', { name: 'Entrar na plataforma' }).click()
}

async function signIn(page: Page, expiresIn = 3600) {
  await page.route(`${api}/auth/login`, (route) =>
    route.fulfill({
      json: {
        accessToken: 'test-access-token',
        tokenType: 'Bearer',
        expiresIn,
        usuario: user,
      },
    }),
  )
  await enterCredentials(page)
}

async function fillUser(page: Page, email = newUser.email) {
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Nome completo').fill(newUser.nome)
  await dialog.getByLabel('E-mail').fill(email)
  await dialog.getByLabel('Perfil de acesso').selectOption(newUser.perfil)
  await dialog.getByLabel('Senha inicial').fill(newUser.senha)
}

async function saveUser(page: Page) {
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Cadastrar usuário', exact: true })
    .click()
}

test('demo creates users, validates passwords, rejects duplicate emails and resets on logout', async ({
  page,
}) => {
  let calls = 0
  page.on('request', (request) => {
    if (request.url().startsWith(api)) calls++
  })
  await page.goto('/#/users')
  await expect(page).toHaveURL(/\/$/)
  await page.getByRole('button', { name: 'Explorar demonstração' }).click()
  await expect(page.getByRole('heading', { name: 'Usuários.', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Pacientes', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Novo usuário' }).click()
  await expect(page.getByLabel('Nome completo')).toBeFocused()
  await fillUser(page)
  await page.getByLabel('Senha inicial').fill('curta')
  await saveUser(page)
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByLabel('Senha inicial').fill(newUser.senha)
  await saveUser(page)
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('rowheader', { name: /Ana Equipe/ })).toBeVisible()
  await expect(page.getByRole('status')).toHaveText('Usuário cadastrado com sucesso.')
  await page.getByRole('button', { name: 'Novo usuário' }).click()
  await fillUser(page)
  await saveUser(page)
  await expect(page.getByText('Este e-mail já está em uso.', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Novo usuário' })).toBeFocused()
  await page.getByRole('button', { name: 'Sair da plataforma' }).click()
  await page.getByRole('button', { name: 'Explorar demonstração' }).click()
  await expect(page.getByRole('rowheader', { name: /Alex Demo/ })).toBeVisible()
  await expect(page.getByText(newUser.nome, { exact: true })).not.toBeVisible()
  expect(calls).toBe(0)
})

test('API mode sends JWT and the user payload, paginates and handles field errors', async ({
  page,
}) => {
  const records = Array.from({ length: 11 }, (_, i) => ({
    ...user,
    id: `initial-${i}`,
    nome: `Registro ${i}`,
  }))
  const observedPages: string[] = []
  let attempts = 0
  await page.route(`${api}/users**`, (route) => {
    expect(route.request().headers().authorization).toBe('Bearer test-access-token')
    if (route.request().method() === 'POST') {
      expect(route.request().postDataJSON()).toEqual(newUser)
      attempts++
      if (attempts === 1)
        return route.fulfill({
          status: 400,
          json: {
            codigo: 'VALIDACAO',
            mensagem: 'Existem campos inválidos.',
            campos: { nome: ['Revise o nome informado.'] },
          },
        })
      const created = {
        id: 'created-user',
        nome: newUser.nome,
        email: newUser.email,
        perfil: newUser.perfil,
      }
      records.unshift(created)
      return route.fulfill({ status: 201, json: created })
    }
    const current = new URL(route.request().url()).searchParams.get('page') ?? '0'
    observedPages.push(current)
    const offset = Number(current) * 10
    return route.fulfill({
      json: pageOf(records.slice(offset, offset + 10), Number(current), records.length),
    })
  })
  await signIn(page)
  await expect(page.getByText('Página 1 de 2')).toBeVisible()
  await page.getByRole('button', { name: 'Próxima página' }).click()
  await expect(page.getByText('Página 2 de 2')).toBeVisible()
  await page.getByRole('button', { name: 'Novo usuário' }).click()
  await fillUser(page)
  await saveUser(page)
  await expect(page.getByText('Revise o nome informado.')).toBeVisible()
  await expect(page.getByLabel('Nome completo')).toHaveAttribute('aria-invalid', 'true')
  await saveUser(page)
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('rowheader', { name: /Ana Equipe/ })).toBeVisible()
  await expect(page.getByText('Página 1 de 2')).toBeVisible()
  expect(observedPages).toContain('1')
  expect(observedPages.at(-1)).toBe('0')
  expect(
    await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } })),
  ).toEqual({ local: {}, session: {} })
})

test('invalid credentials stay on login and a 401 ends the authenticated session', async ({
  page,
}) => {
  await page.route(`${api}/auth/login`, (route) =>
    route.fulfill({
      status: 401,
      json: {
        codigo: 'CREDENCIAIS_INVALIDAS',
        mensagem: 'Credenciais inválidas.',
        campos: {},
      },
    }),
  )
  await enterCredentials(page)
  await expect(page.getByRole('alert')).toHaveText('E-mail ou senha inválidos.')
  await page.unroute(`${api}/auth/login`)
  await page.route(`${api}/users**`, (route) =>
    route.fulfill({
      status: 401,
      json: { codigo: 'NAO_AUTENTICADO', mensagem: 'Token expirado.', campos: {} },
    }),
  )
  await signIn(page)
  await expect(page.getByRole('status')).toHaveText(
    'Sua sessão expirou. Entre novamente para continuar.',
  )
  await expect(page.getByRole('button', { name: 'Entrar na plataforma' })).toBeVisible()
})

test('403 preserves the session; server and network failures can be retried without demo fallback', async ({
  page,
}) => {
  await page.route(`${api}/users**`, (route) =>
    route.fulfill({
      status: 403,
      json: { codigo: 'ACESSO_NEGADO', mensagem: 'Acesso negado para este perfil.', campos: {} },
    }),
  )
  await signIn(page)
  await expect(page.getByRole('alert')).toHaveText('Acesso negado para este perfil.')
  await expect(page.getByRole('button', { name: 'Sair da plataforma' })).toBeVisible()
  await page.unroute(`${api}/users**`)
  await page.route(`${api}/users**`, (route) =>
    route.fulfill({ status: 502, contentType: 'text/html', body: '<html>Bad gateway</html>' }),
  )
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('alert')).toContainText('Não foi possível concluir')
  await page.unroute(`${api}/users**`)
  await page.route(`${api}/users**`, (route) => route.abort('failed'))
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('alert')).toContainText('Não foi possível conectar')
  await page.unroute(`${api}/users**`)
  await page.route(`${api}/users**`, (route) => route.fulfill({ json: pageOf([]) }))
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('heading', { name: 'Vamos cadastrar sua equipe?' })).toBeVisible()
  await expect(page.getByText('DEMONSTRAÇÃO', { exact: true })).not.toBeVisible()
})

test('session expires using expiresIn without waiting for another API call', async ({ page }) => {
  await page.clock.install()
  await page.route(`${api}/users**`, (route) => route.fulfill({ json: pageOf([]) }))
  await signIn(page, 2)
  await expect(page.getByRole('heading', { name: 'Usuários.', exact: true })).toBeVisible()
  await page.clock.fastForward(2100)
  await expect(page.getByRole('status')).toContainText('Sua sessão expirou')
})

test('mobile user dialog fits the screen, restores focus and supports the skip link', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Explorar demonstração' }).click()
  await expect(page.getByRole('rowheader', { name: /Alex Demo/ })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await page.getByRole('button', { name: 'Novo usuário' }).click()
  const bounds = await page.getByRole('dialog').boundingBox()
  expect(bounds!.width).toBeLessThanOrEqual(390)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Novo usuário' })).toBeFocused()
  await page.getByRole('link', { name: 'Pular para o conteúdo' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
})

test('incompatible API contracts show clear errors without replacing data by a demo', async ({
  page,
}) => {
  await page.route(`${api}/auth/login`, (route) =>
    route.fulfill({
      json: { accessToken: 'test-access-token', tokenType: 'Bearer', expiresIn: 3600 },
    }),
  )
  await enterCredentials(page)
  await expect(page.getByRole('alert')).toHaveText(
    'A resposta de login não corresponde ao contrato da API.',
  )
  await page.unroute(`${api}/auth/login`)
  await page.route(`${api}/users**`, (route) => route.fulfill({ json: [user] }))
  await signIn(page)
  await expect(page.getByRole('alert')).toHaveText(
    'A resposta de usuários não segue o contrato paginado da API.',
  )
  await expect(page.getByRole('button', { name: 'Sair da plataforma' })).toBeVisible()
  await expect(page.getByText('DEMONSTRAÇÃO', { exact: true })).not.toBeVisible()
})
