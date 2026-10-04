# HealthSys Distribuído

Repositório inicial da plataforma acadêmica de gestão hospitalar distribuída.

Esta versão contém somente a estrutura necessária para que cada frente da equipe possa iniciar o desenvolvimento na semana 3.

## Estrutura

```text
healthsys-distribuido/
├── .github/             # CI, templates de issues e pull requests
├── docs/                # decisões e documentação do projeto
├── frontend/            # esqueleto React + TypeScript
├── infra/               # espaço reservado para Docker e infraestrutura
└── services/            # esqueletos dos serviços Spring Boot
```

## Serviços preparados

| Serviço | Responsabilidade prevista | Porta local |
| --- | --- | ---: |
| `api-gateway` | Entrada e roteamento da aplicação | 8080 |
| `user-service` | Usuários e autenticação | 8081 |
| `patient-service` | Cadastro de pacientes | 8082 |
| `medical-record-service` | Prontuários eletrônicos | 8083 |
| `triage-service` | Triagem médica | 8084 |
| `notification-service` | Notificações | 8085 |

Os serviços possuem apenas a classe principal, configuração mínima e dependências básicas. Bancos, mensageria, regras de negócio, autenticação e integração serão adicionados pelas respectivas frentes.

## Pré-requisitos

- Git
- Java 17 ou superior
- Node.js 20.19 ou superior

## Validar o backend

No Windows:

```powershell
.\gradlew.bat clean build
```

No Linux ou macOS:

```bash
./gradlew clean build
```

## Validar o frontend

```bash
cd frontend
npm install
npm run build
```

## Estratégia de branches

- `main`: versões estáveis.
- `develop`: integração das tarefas da sprint.
- `feat/<issue>-<descricao>`: funcionalidades.
- `fix/<issue>-<descricao>`: correções.
- `docs/<issue>-<descricao>`: documentação.
- `chore/<issue>-<descricao>`: configuração e manutenção.

O trabalho deve entrar em `develop` por pull request. A branch `main` deve receber apenas versões revisadas e demonstráveis.

Consulte [CONTRIBUTING.md](CONTRIBUTING.md) para as regras de contribuição e [docs/github-setup.md](docs/github-setup.md) para a configuração inicial do GitHub.

## CI

O workflow `.github/workflows/ci.yml` executa o build do backend e do frontend em pushes e pull requests para `main` e `develop`. Ele não realiza deploy.

## Próximos responsáveis

- Arquitetura: consolidar serviços, integrações e diagramas.
- Requisitos: definir MVP, perfis e casos de uso.
- Banco de dados: implementar modelos e scripts.
- Docker e ambiente: adicionar Dockerfiles e Docker Compose em `infra/`.
- Desenvolvimento: implementar as regras de negócio e a interface.
