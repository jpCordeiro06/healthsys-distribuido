import { expect, test, type Page } from '@playwright/test'

const api = 'http://localhost:8080/api/v1'
const scenarios = [
  {
    resource: 'users',
    kind: 'usuário',
    success: 'Usuário excluído com sucesso.',
    empty: 'Vamos cadastrar sua equipe?',
    demoName: 'Marina Exemplo',
    record: { id: 'user-delete', nome: 'Usuário Teste', email: 'remover@example.invalid', perfil: 'MEDICO' },
  },
  {
    resource: 'patients',
    kind: 'paciente',
    success: 'Paciente excluído com sucesso.',
    empty: 'Vamos cadastrar seu primeiro paciente?',
    demoName: 'Ana Exemplo',
    record: { id: 'patient-delete', nome: 'Paciente Teste', cpf: '52998224725', dataNascimento: '1990-05-12', sexo: 'Feminino', telefone: null },
  },
] as const

function pageOf(resource: string, content: unknown[], number = 0, total = content.length) {
  return {
    content,
    ...(resource === 'users' ? { number } : { page: number }),
    size: 10,
    totalElements: total,
    totalPages: Math.ceil(total / 10),
    first: number === 0,
    last: (number + 1) * 10 >= total,
  }
}

async function signIn(page: Page, resource: string) {
  await page.route(`${api}/auth/login`, (route) => route.fulfill({ json: {
    accessToken: 'delete-test-token', tokenType: 'Bearer', expiresIn: 3600,
    usuario: { id: 'admin', nome: 'Administrador Teste', email: 'admin@example.invalid', perfil: 'ADMIN' },
  } }))
  if (resource === 'patients') {
    await page.route(`${api}/users?**`, (route) => route.fulfill({ json: pageOf('users', []) }))
  }
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill('admin@example.invalid')
  await page.getByLabel('Senha', { exact: true }).fill('SenhaFicticia123')
  await page.getByRole('button', { name: 'Entrar na plataforma' }).click()
  if (resource === 'patients') await page.getByRole('link', { name: 'Pacientes', exact: true }).click()
}

for (const scenario of scenarios) {
  test(`${scenario.resource}: confirmation can be cancelled, sends one DELETE with JWT and returns from the last page`, async ({ page }) => {
    let records = Array.from({ length: 11 }, (_, i) => ({
      ...scenario.record, id: `${scenario.resource}-${i}`, nome: `Registro ${i + 1}`,
    }))
    const target = records[10]
    const observedPages: number[] = []
    let calls = 0
    let release: () => void = () => {}
    const pending = new Promise<void>((resolve) => { release = resolve })
    await page.route(`${api}/${scenario.resource}**`, async (route) => {
      if (route.request().method() === 'DELETE') {
        calls++
        expect(route.request().headers().authorization).toBe('Bearer delete-test-token')
        expect(route.request().url()).toBe(`${api}/${scenario.resource}/${encodeURIComponent(target.id)}`)
        expect(route.request().postData()).toBeNull()
        await pending
        records = records.filter((record) => record.id !== target.id)
        return route.fulfill({ status: 204, body: '' })
      }
      const current = Number(new URL(route.request().url()).searchParams.get('page'))
      observedPages.push(current)
      return route.fulfill({ json: pageOf(scenario.resource, records.slice(current * 10, current * 10 + 10), current, records.length) })
    })
    try {
      await signIn(page, scenario.resource)
      await page.getByRole('button', { name: 'Próxima página' }).click()
      await expect(page.getByText('Página 2 de 2')).toBeVisible()
      const trigger = page.getByRole('button', { name: `Excluir ${scenario.kind} ${target.nome}`, exact: true })
      await trigger.click()
      const dialog = page.getByRole('alertdialog', { name: `Excluir ${scenario.kind}`, exact: true })
      await expect(dialog).toContainText(target.nome)
      await expect(dialog).toContainText(scenario.resource === 'users' ? 'remover@example.invalid' : '529.982.247-25')
      await expect(dialog.getByRole('button', { name: 'Cancelar', exact: true })).toBeFocused()
      expect(calls).toBe(0)
      await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click()
      await expect(trigger).toBeFocused()
      await trigger.click()
      await page.keyboard.press('Escape')
      await expect(dialog).not.toBeVisible()
      await expect(trigger).toBeFocused()
      expect(calls).toBe(0)
      await trigger.click()
      await dialog.getByRole('button', { name: `Excluir ${scenario.kind}`, exact: true }).click()
      await expect(dialog.getByRole('button', { name: 'Excluindo…', exact: true })).toBeDisabled()
      await expect(dialog.getByRole('button', { name: 'Cancelar', exact: true })).toBeDisabled()
      await expect(dialog.getByRole('button', { name: 'Fechar confirmação de exclusão' })).toBeDisabled()
      await page.keyboard.press('Escape')
      await expect(dialog).toBeVisible()
      await expect(page.locator('tbody tr').filter({ hasText: target.nome })).toHaveCount(1)
      expect(calls).toBe(1)
      release()
      await expect(dialog).not.toBeVisible()
      await expect(page.getByRole('status')).toHaveText(scenario.success)
      await expect(page.getByText('Página 1 de 1')).toBeVisible()
      await expect(page.getByText('1–10 de 10 registros', { exact: true })).toBeVisible()
      await expect(page.getByRole('rowheader', { name: new RegExp(target.nome) })).toHaveCount(0)
      expect(observedPages.at(-1)).toBe(0)
      expect(calls).toBe(1)
    } finally {
      release()
    }
  })

  test(`${scenario.resource}: failed deletions preserve the record and can be retried until success`, async ({ page }) => {
    let exists = true
    let attempt = 0
    let loads = 0
    await page.route(`${api}/${scenario.resource}**`, (route) => {
      if (route.request().method() === 'DELETE') {
        expect(route.request().headers().authorization).toBe('Bearer delete-test-token')
        attempt++
        if (attempt === 1) return route.fulfill({ status: 403, json: { mensagem: 'Sem permissão para excluir.' } })
        if (attempt === 2) return route.fulfill({ status: 502, contentType: 'text/html', body: '<html>Bad gateway</html>' })
        if (attempt === 3) return route.abort('failed')
        exists = false
        return route.fulfill({ status: 204, body: '' })
      }
      loads++
      return route.fulfill({ json: pageOf(scenario.resource, exists ? [scenario.record] : []) })
    })
    await signIn(page, scenario.resource)
    await page.getByRole('button', { name: `Excluir ${scenario.kind} ${scenario.record.nome}`, exact: true }).click()
    const dialog = page.getByRole('alertdialog')
    const confirm = dialog.getByRole('button', { name: `Excluir ${scenario.kind}`, exact: true })
    const initialLoads = loads
    for (const message of ['Sem permissão para excluir.', 'Não foi possível concluir a solicitação.', 'Não foi possível conectar à API.']) {
      await confirm.click()
      await expect(dialog.getByRole('alert')).toContainText(message)
      await expect(confirm).toBeEnabled()
      await expect(page.locator('tbody tr').filter({ hasText: scenario.record.nome })).toHaveCount(1)
      expect(loads).toBe(initialLoads)
      expect(exists).toBe(true)
      await expect(page).toHaveURL(new RegExp(`/${scenario.resource}$`))
    }
    await confirm.click()
    await expect(dialog).not.toBeVisible()
    await expect(page.getByRole('heading', { name: scenario.empty, exact: true })).toBeVisible()
    await expect(page.getByText('Nenhum registro', { exact: true })).toBeVisible()
    await expect(page.getByText('Página 0 de 0')).toBeVisible()
    await expect(page.getByRole('status')).toHaveText(scenario.success)
    expect(attempt).toBe(4)
    expect(loads).toBeGreaterThan(initialLoads)
  })

  test(`${scenario.resource}: a 401 during deletion ends the session`, async ({ page }) => {
    await page.route(`${api}/${scenario.resource}**`, (route) => route.request().method() === 'DELETE'
      ? route.fulfill({ status: 401, json: { mensagem: 'Token expirado.' } })
      : route.fulfill({ json: pageOf(scenario.resource, [scenario.record]) }))
    await signIn(page, scenario.resource)
    await page.getByRole('button', { name: `Excluir ${scenario.kind} ${scenario.record.nome}`, exact: true }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: `Excluir ${scenario.kind}`, exact: true }).click()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('status')).toHaveText('Sua sessão expirou. Entre novamente para continuar.')
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
  })

  test(`${scenario.resource}: demo deletion fits mobile, makes no API calls and resets after logout`, async ({ page }) => {
    let calls = 0
    await page.route(`${api}/**`, (route) => {
      calls++
      return route.fulfill({ status: 500, json: {} })
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/login')
    await page.getByRole('button', { name: 'Explorar demonstração' }).click()
    if (scenario.resource === 'patients') await page.getByRole('link', { name: 'Pacientes', exact: true }).click()
    const trigger = page.getByRole('button', { name: `Excluir ${scenario.kind} ${scenario.demoName}`, exact: true })
    await trigger.click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog.getByRole('button', { name: 'Cancelar', exact: true })).toBeFocused()
    const bounds = await dialog.boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.width).toBeLessThanOrEqual(390)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await dialog.getByRole('button', { name: `Excluir ${scenario.kind}`, exact: true }).click()
    await expect(dialog).not.toBeVisible()
    await expect(page.getByRole('rowheader', { name: new RegExp(scenario.demoName) })).toHaveCount(0)
    await expect(page.locator('#main-content')).toBeFocused()
    const otherLink = scenario.resource === 'users' ? 'Pacientes' : 'Usuários'
    const ownLink = scenario.resource === 'users' ? 'Usuários' : 'Pacientes'
    await page.getByRole('link', { name: otherLink, exact: true }).click()
    await page.getByRole('link', { name: ownLink, exact: true }).click()
    await expect(page.getByRole('rowheader', { name: new RegExp(scenario.demoName) })).toHaveCount(0)
    await page.getByRole('button', { name: 'Sair da plataforma' }).click()
    await page.getByRole('button', { name: 'Explorar demonstração' }).click()
    if (scenario.resource === 'patients') await page.getByRole('link', { name: 'Pacientes', exact: true }).click()
    await expect(page.getByRole('rowheader', { name: new RegExp(scenario.demoName) })).toBeVisible()
    expect(calls).toBe(0)
  })
}
