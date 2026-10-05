# HealthSys Distribuído - Guia de Ambiente

## Pré-requisitos

Para executar o projeto localmente, é necessário ter instalado:

- Docker
- Docker Compose
- Git

## Configuração do ambiente

Antes de iniciar os serviços, configure as variáveis de ambiente.

Crie um arquivo `.env` na raiz do projeto com:

```env
POSTGRES_DB=healthsys
POSTGRES_USER=healthsys
POSTGRES_PASSWORD=healthsys

MONGO_DATABASE=healthsys
```

O arquivo `.env.example` contém um modelo dessas configurações.

## Iniciando os serviços

Para construir as imagens e iniciar todos os serviços:

```bash
docker compose -f infra/docker-compose.yml up --build
```

Para iniciar os serviços em segundo plano:

```bash
docker compose -f infra/docker-compose.yml up --build -d
```

O ambiente é composto pelos serviços da aplicação e pelos seguintes componentes de infraestrutura:

- PostgreSQL
- MongoDB
- Redis
- Apache Kafka

O Docker Compose também configura volumes persistentes para os serviços de infraestrutura e healthchecks para PostgreSQL, MongoDB, Redis e Kafka.

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

Os serviços de infraestrutura utilizam:

| Serviço    | Porta |
| ---------- | ----: |
| PostgreSQL |  5432 |
| MongoDB    | 27017 |
| Redis      |  6379 |
| Kafka      |  9092 |

## Verificando os serviços

Para visualizar o estado dos containers:

```bash
docker compose -f infra/docker-compose.yml ps
```

Os serviços PostgreSQL, MongoDB, Redis e Kafka possuem healthchecks configurados.

Para visualizar os logs:

```bash
docker compose -f infra/docker-compose.yml logs
```

Para visualizar os logs de um serviço específico:

```bash
docker compose -f infra/docker-compose.yml logs api-gateway
```

## Parando os serviços

Para parar e remover os containers:

```bash
docker compose -f infra/docker-compose.yml down
```

Os volumes persistentes não são removidos pelo comando acima.

## Estrutura da infraestrutura

Os arquivos de infraestrutura estão localizados no diretório `infra/`:

```text
infra/
├── .env.example
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

Também são criados volumes persistentes para:

```text
postgres_data
mongodb_data
redis_data
kafka_data
```
