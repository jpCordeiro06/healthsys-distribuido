# HealthSys Distribuído - Guia de Ambiente

## Pré-requisitos

Para executar o projeto localmente, é necessário ter instalado:

- Docker
- Docker Compose
- Git

## Iniciando os services

Para construir as imagens e iniciar todos os serviços:

```bash
docker compose -f infra/docker-compose.yml up --build
```

Para iniciar os serviços em segundo plano:

```bash
docker compose -f infra/docker-compose.yml up --build -d
```

## Acessos

Após a inicialização, o frontend estará disponível em:

```text
http://localhost:3000
```

Os serviços backend utilizam as seguintes portas:

| Serviço                | Porta |
| ---------------------- | ----: |
| API Gateway            |  8080 |
| User Service           |  8081 |
| Patient Service        |  8082 |
| Medical Record Service |  8083 |
| Triage Service         |  8084 |
| Notification Service   |  8085 |

## Parando os serviços

Para parar os containers:

```bash
docker compose -f infra/docker-compose.yml down
```

Para visualizar os containers em execução:

```bash
docker compose -f infra/docker-compose.yml ps
```

Para visualizar os logs:

```bash
docker compose -f infra/docker-compose.yml logs
```

Para visualizar os logs de um serviço específico:

```bash
docker compose -f infra/docker-compose.yml logs api-gateway
```

## Estrutura da infraestrutura

Os arquivos de infraestrutura estão localizados no diretório `infra/`:

```text
infra/
├── docker-compose.yml
├── Dockerfile.api-gateway
├── Dockerfile.user-service
├── Dockerfile.patient-service
├── Dockerfile.medical-record-service
├── Dockerfile.triage-service
├── Dockerfile.notification-service
├── Dockerfile.frontend
└── README.md
```

O Docker Compose cria uma rede interna chamada `healthsys-network`, permitindo a comunicação entre os containers do projeto.
