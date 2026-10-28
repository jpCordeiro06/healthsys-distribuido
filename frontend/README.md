# Frontend — HealthSys

Interface web de login e gerenciamento de usuários desenvolvida com React, TypeScript e Vite.

## Executar

Use Node.js 22.12+ ou Node 24. Na raiz do repositório:

```bash
cd frontend
npm ci
npm run dev -- --port 5175 --strictPort
```

Abra [http://localhost:5175](http://localhost:5175). A opção `--strictPort` impede que o Vite escolha outra porta quando a 5175 está ocupada. Sem os argumentos de porta, `npm run dev` continua usando a porta padrão 5173.

## Funcionalidades

- Login com e-mail e senha, saída e tratamento de sessão expirada.
- Listagem paginada e cadastro de usuários com nome, e-mail, perfil e senha inicial.
- Validação dos formulários e mensagens de carregamento, erro e lista vazia.
- Layout adaptado para desktop e celular.
- Demonstração explícita com usuários fictícios, sem chamadas à API.

Em desenvolvimento, clique em **Explorar demonstração** para testar. Os cadastros ficam em memória e são descartados ao sair ou recarregar. No build de produção, o botão só aparece se `VITE_ENABLE_DEMO=true` for definido antes da construção.

## Organização e integração

| Arquivo                               | Responsabilidade                               |
| ------------------------------------- | ---------------------------------------------- |
| `src/App.tsx`                         | Sessão e estrutura da área de usuários         |
| `src/pages/LoginPage.tsx`             | Formulário de login e entrada na demonstração  |
| `src/pages/UsersPage.tsx`             | Listagem, paginação e abertura do cadastro     |
| `src/components/CreateUserDialog.tsx` | Formulário de cadastro de usuário              |
| `src/api.ts`                          | Cliente HTTP comum e formato dos erros         |
| `src/services/auth.ts`                | Chamada de login e leitura da sessão retornada |
| `src/services/users.ts`               | Endpoints e respostas de usuários              |
| `src/services/demo.ts`                | Serviço de usuários fictícios, isolado da API  |
| `src/types.ts`                        | Formatos de usuário, sessão e paginação        |
| `src/styles.css`                      | Estilos da interface                           |

As telas recebem um `UsersService` com as operações `listUsers` e `createUser`. A mesma interface é implementada pela API e pela demonstração, mantendo os formulários independentes da fonte dos dados.

O endereço padrão é `http://localhost:8080/api/v1`. Para alterá-lo, copie `.env.example` para `.env.local`, ajuste `VITE_API_BASE_URL` e reinicie o Vite.

| Operação                                  | Contrato esperado                                                                   |
| ----------------------------------------- | ----------------------------------------------------------------------------------- |
| `POST /auth/login`                        | Recebe `email`, `senha`; retorna `accessToken`, `tokenType`, `expiresIn`, `usuario` |
| `GET /users?page=0&size=10&sort=nome,asc` | Retorna paginação com `content`, `page`, `size`, totais, `first`, `last`            |
| `POST /users`                             | Recebe `nome`, `email`, `senha`, `perfil`; retorna o usuário criado                 |

A referência é [`docs/api/openapi.yaml`](../docs/api/openapi.yaml). As requisições autenticadas enviam `Authorization: Bearer <token>`. A sessão fica em memória; recarregar exige novo login. Sair descarta a sessão local, pois o contrato atual não define um endpoint de revogação. Senhas, tokens e cadastros não são gravados em `localStorage` ou `sessionStorage`.

O cliente valida o formato das respostas de login e listagem de usuários. Falhas de rede, autenticação ou formato da resposta são exibidas na interface. O modo de demonstração é ativado pelo botão **Explorar demonstração**.

Para executar o frontend conectado à API, configure `VITE_API_BASE_URL` e utilize uma API compatível com os contratos acima. A API deve permitir a origem `http://localhost:5175` no CORS.

## Validar

```bash
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

Os testes usam a porta 5173, definida em `playwright.config.ts`; reserve essa porta para o HealthSys ao executá-los. Em um Linux sem as bibliotecas do navegador, pode ser necessário `npx playwright install --with-deps chromium`.

Os testes cobrem usuários em demonstração, validação, duplicidade, JWT, paginação, erros da API, expiração e uso no celular. As respostas HTTP são simuladas e não comprovam a integração com os serviços reais.
