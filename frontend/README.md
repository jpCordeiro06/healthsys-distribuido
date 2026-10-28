# Frontend — HealthSys

Primeira interface web das semanas 3–4, construída com React, TypeScript e Vite.

## Executar

Use Node.js 22.12+ (a CI usa Node 22) ou Node 24. Na raiz do repositório:

```bash
cd frontend
npm ci
npm run dev -- --port 5175 --strictPort
```

Abra [http://localhost:5175](http://localhost:5175). Usamos a porta 5175 para evitar conflito com outros projetos locais. A opção `--strictPort` faz o Vite informar um erro se essa porta estiver ocupada, em vez de escolher outra automaticamente.

O comando `npm run dev` sem os argumentos de porta continua usando a porta padrão 5173 do Vite.

O gateway atual libera CORS para `http://localhost:5173` e `http://localhost:3000`, usada pelo Compose. Para conectar a execução em `http://localhost:5175` à API real, inclua essa origem nas configurações `allowed-origins` das rotas e do Actuator em `services/api-gateway/src/main/resources/application.yml`. A demonstração funciona independentemente dessa configuração, pois não faz chamadas à API.

## O que esta versão oferece

- Tela de login com e-mail e senha.
- Navegação entre pacientes e usuários, com histórico do navegador.
- Cadastro e listagem paginada de pacientes e usuários.
- Validação dos formulários, mensagens por campo, carregamento, lista vazia e tentativa de recarregar após erros.
- Tratamento de sessão expirada (`401`) e de falta de permissão (`403`).
- Layout adaptado para desktop e celular; formulários em diálogo com foco e navegação por teclado.

Edição, exclusão, prontuários, triagem e notificações não fazem parte desta versão.

## Testar sem backend

Após iniciar o frontend com o comando acima, clique em **Explorar demonstração** na tela de login. Não é necessário informar credenciais.

O modo de demonstração usa somente dados fictícios em memória. É possível cadastrar pacientes e usuários, alternar as telas e testar mensagens de validação. Ao sair ou recarregar a página, os dados são descartados. Esse modo não faz chamadas à API e aparece identificado em todas as telas internas.

O botão fica desabilitado no build de produção por padrão. Para uma apresentação que precise dele, configure `VITE_ENABLE_DEMO=true` antes de gerar o build. As variáveis `VITE_*` são públicas e não devem receber segredos.

## Conectar à API real

As chamadas passam exclusivamente pelo API Gateway. O endereço padrão é `http://localhost:8080/api/v1`.

Para usar outro endereço, copie `.env.example` para `.env.local`, ajuste `VITE_API_BASE_URL` e reinicie o Vite. Em um build Docker, essa variável é definida no momento da construção da imagem.

| Operação           | Endpoint                                     | Dados enviados                               |
| ------------------ | -------------------------------------------- | -------------------------------------------- |
| Login              | `POST /auth/login`                           | `email`, `senha`                             |
| Listar pacientes   | `GET /patients?page=0&size=10&sort=nome,asc` | —                                            |
| Cadastrar paciente | `POST /patients`                             | `nome`, `dataNascimento`, `sexo`, `telefone` |
| Listar usuários    | `GET /users?page=0&size=10&sort=nome,asc`    | —                                            |
| Cadastrar usuário  | `POST /users`                                | `nome`, `email`, `senha`, `perfil`           |

O contrato completo está em [`../docs/api/openapi.yaml`](../docs/api/openapi.yaml). Os nomes dos campos e a paginação seguem esse contrato. A data é enviada como `AAAA-MM-DD`, e telefone vazio é enviado como `null`. O campo sexo permanece textual, pois o contrato ainda não define um conjunto fechado de opções; a equipe deve alinhar os valores usados pela instituição.

O login deve retornar `accessToken`, `tokenType: "Bearer"`, `expiresIn` em segundos e `usuario`. As demais requisições enviam `Authorization: Bearer <token>`. A sessão permanece em memória: recarregar a página exige novo login. Senhas, tokens e registros não são gravados em `localStorage` ou `sessionStorage`. Sair descarta a sessão local; o contrato atual não define um endpoint de logout/revogação.

Os perfis apresentados são os definidos pelo módulo de segurança: `ADMIN`, `MEDICO`, `ENFERMEIRO` e `RECEPCAO`. A autorização é responsabilidade do backend; uma operação negada mostra o erro sem transformar a sessão em demonstração.

### Dependências da equipe de backend

Na base desta implementação, o serviço de pacientes já possui os endpoints, mas login e usuários ainda são apenas contratos. Para validar o fluxo completo com os serviços reais, a equipe precisa:

1. Implementar autenticação e endpoints de usuários.
2. Disponibilizar um usuário inicial de teste: o cadastro de usuários já exige JWT.
3. Configurar as chaves JWT dos serviços e alinhar as permissões de cada perfil.

Não há troca automática para dados fictícios quando a API falha. Os testes automatizados abaixo simulam as respostas HTTP e não comprovam a integração com serviços reais.

## Organização

| Arquivo / pasta                         | Responsabilidade                          |
| --------------------------------------- | ----------------------------------------- |
| `src/App.tsx`                           | Sessão, navegação e estrutura interna     |
| `src/pages/LoginPage.tsx`               | Entrada real ou demonstração explícita    |
| `src/pages/RecordsPage.tsx`             | Listagem, paginação e atualização         |
| `src/components/CreateRecordDialog.tsx` | Formulários e validação                   |
| `src/api.ts`                            | Cliente HTTP, autenticação e erros da API |
| `src/services/demo.ts`                  | Fonte de dados fictícios, isolada da API  |
| `src/types.ts`                          | Tipos compartilhados do contrato          |
| `src/styles.css`                        | Identidade visual e adaptação às telas    |

A navegação usa fragmentos (`#/patients` e `#/users`), de modo que o Nginx já existente pode servir a aplicação sem uma configuração adicional de fallback de rotas.

## Validar

```bash
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

Os testes automatizados usam a porta 5173, definida em `playwright.config.ts`, independentemente da porta 5175 usada para testar a interface manualmente. Reserve a porta 5173 para o HealthSys ao executar esses testes.

Em um Linux sem as bibliotecas de navegador instaladas, o Playwright pode precisar de `npx playwright install --with-deps chromium`.

Os testes cobrem cadastro em demonstração sem chamadas de API, validação de data, e-mail duplicado, envio do JWT e do payload de paciente, paginação, erros por campo, sessão expirada, acesso negado, recuperação após erro, navegação e diálogo no celular.

### Roteiro manual para a demonstração

1. Explore a demonstração e abra **Novo paciente**.
2. Cadastre um nome fictício, nascimento no passado e sexo; deixe o telefone vazio.
3. Confira o registro e o total na lista.
4. Entre em **Usuários** e cadastre uma pessoa com e-mail fictício, perfil e senha inicial de pelo menos 8 caracteres.
5. Repita o e-mail para conferir a mensagem de duplicidade.
6. Saia e entre novamente na demonstração: os cadastros anteriores devem ter sido descartados.
