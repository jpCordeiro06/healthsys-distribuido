# HealthSys Distribuído - Guia de Ambiente

## Pré-requisitos

Para executar o projeto localmente, é necessário ter instalado:

- Docker
- Docker Compose
- Git

## Configuração do ambiente

Antes de iniciar os serviços, configure as variáveis de ambiente.

Crie um arquivo `infra/.env` (a partir de `infra/.env.example`) com:

```env
POSTGRES_DB=healthsys
POSTGRES_USER=healthsys
POSTGRES_PASSWORD=healthsys

MONGO_DATABASE=healthsys
```

O arquivo `.env.example` contém um modelo dessas configurações.

Antes de iniciar o Compose, gere o par RSA local conforme o
[README do user-service](../services/user-service/README.md#chaves-rsa-locais).
O `user-service` assina os tokens com `secrets/private.pem`. Os serviços validam
com o mesmo `secrets/public.pem`, montado como secret e carregado pelo `configtree`
do Spring. Assim, o Compose não depende da cópia da chave pública em
`HEALTHSYS_SECURITY_JWT_PUBLIC_KEY` no `.env`; essa variável continua disponível
para executar serviços diretamente fora do Compose.

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

## Desenvolvimento dos serviços Java

O Compose usa a etapa `development` dos seis Dockerfiles Java e monta o
repositório em `/workspace`. Edite os arquivos normalmente na sua IDE:
o contêiner verifica os fontes e recursos a cada dois segundos, recompila as
alterações com Gradle e o Spring Boot DevTools reinicia a aplicação.
O reinício usa o arquivo `.reloadtrigger`, atualizado pelo script somente após
uma compilação bem-sucedida, para evitar carregar um conjunto incompleto de classes.
Erros de compilação aparecem nos logs; salve a correção para tentar novamente.

Os fontes são montados somente para leitura. Os resultados da compilação e
o cache do projeto ficam em `/tmp` dentro de cada contêiner; cada serviço possui
um volume próprio para o cache de dependências Gradle. Assim, os serviços não
disputam os mesmos arquivos de build e não geram arquivos no host.
Alterações nos scripts Gradle ou nas dependências exigem reiniciar o serviço;
alterações nos Dockerfiles ou no script de inicialização exigem `up --build`.
O frontend continua sendo servido pelo Nginx.

## Imagem de produção

A última etapa de cada Dockerfile Java, `production`, contém somente o JRE 17
Alpine e o JAR executável. O DevTools é uma dependência `developmentOnly` e não
é incluído nesse JAR. Para gerar, por exemplo, a imagem da triagem, execute na
raiz do repositório:

```bash
docker build --target production -f infra/Dockerfile.triage-service -t healthsys-triage:prod .
```

O build sem `--target` também seleciona a etapa final de produção.

## Avaliar o ambiente de produção localmente

Use `docker-compose.prod.yml` sozinho, sem combiná-lo com o Compose de
desenvolvimento. O projeto `healthsys-prod` tem rede, contêineres e volumes
próprios, permitindo executar os dois ambientes ao mesmo tempo.

O arquivo reutiliza `infra/.env`. As chaves `secrets/private.pem` (PKCS#8) e
`secrets/public.pem` (X.509) devem existir; veja a geração no
[README do user-service](../services/user-service/README.md#chaves-rsa-locais).
Para usar outros arquivos, configure `JWT_PRIVATE_KEY_FILE` e `JWT_PUBLIC_KEY_FILE`
com caminhos absolutos. As chaves entram como secrets em `/run/secrets`, sem
serem copiadas para as imagens. Os serviços recebem a mesma chave pública pelo
`configtree` do Spring.

Na raiz do repositório:

```bash
docker compose -f infra/docker-compose.prod.yml build
docker compose -f infra/docker-compose.prod.yml up -d
docker compose -f infra/docker-compose.prod.yml ps
docker compose -f infra/docker-compose.prod.yml logs -f
```

Frontend: `http://localhost:13000`. API: `http://localhost:18080/api/v1`.
As portas podem ser alteradas com `PROD_FRONTEND_PORT` e `PROD_API_PORT`.
Somente frontend e gateway publicam portas, vinculadas ao host local; os bancos
e demais serviços são acessados pela rede interna. O frontend usa `/api/v1` na
mesma origem, encaminhado pelo Nginx ao gateway.

As imagens Java executam `java -jar`, sem Gradle, fontes, caches de desenvolvimento
ou DevTools. Cada serviço Java tem limite de 512 MiB de memória, com até 60%
destinados ao heap. Não há recarga automática: alterações exigem novo build e `up -d`.
Para consultar os tamanhos locais das imagens da aplicação:

```bash
docker compose -f infra/docker-compose.prod.yml images
docker image ls --filter 'reference=healthsys/*:production'
```

Tamanhos medidos no build local de 04/11/2026 (MB decimais):

| Imagem | Tamanho |
| --- | ---: |
| `healthsys/api-gateway:production` | 223,3 MB |
| `healthsys/user-service:production` | 246,1 MB |
| `healthsys/patient-service:production` | 246,1 MB |
| `healthsys/medical-record-service:production` | 213,1 MB |
| `healthsys/triage-service:production` | 213,1 MB |
| `healthsys/notification-service:production` | 213,1 MB |
| `healthsys/frontend:production` | 62,6 MB |

Nesse ambiente foram verificados login e listagem paginada via Nginx e gateway,
navegação direta em `/users` e retorno 400 para ordenação inválida sem stack trace.
O JAR do `user-service` foi inspecionado e não contém DevTools nem chaves PEM.

O tamanho exibido é descompactado e inclui camadas compartilhadas; a soma não
representa o espaço adicional real em disco nem o tamanho de download do registry.

Para parar esse ambiente preservando seus dados:

```bash
docker compose -f infra/docker-compose.prod.yml down
```

Esse ambiente serve para avaliar os artefatos de produção localmente. Ele mantém
o cadastro inicial do administrador e a criação/atualização automática das tabelas
da aplicação. Uma implantação pública ainda exige configurar credenciais próprias,
TLS, migrações e a infraestrutura persistente apropriada.

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
