# Serviço de Pacientes

Microsserviço responsável pelo cadastro e gerenciamento de pacientes. Implementado com Java 17, Spring Boot, Spring Data JPA e PostgreSQL.

## Endpoints

Todos os endpoints de pacientes exigem um JWT válido, conforme a configuração de segurança compartilhada.

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/v1/patients` | Cadastra paciente e retorna `201 Created` |
| `GET` | `/api/v1/patients` | Lista pacientes com paginação (`page`, `size`) e ordenação (`sort`) |
| `GET` | `/api/v1/patients/{patientId}` | Consulta paciente por UUID |
| `PUT` | `/api/v1/patients/{patientId}` | Atualiza os dados do paciente |
| `DELETE` | `/api/v1/patients/{patientId}` | Exclui paciente e retorna `204 No Content` |

### Exemplo de corpo JSON

```json
{
  "nome": "Joao da Silva",
  "dataNascimento": "1985-04-12",
  "sexo": "M",
  "telefone": "+55 85 99999-0000"
}
```

`nome`, `dataNascimento` e `sexo` são obrigatórios. `telefone` é opcional. A data deve estar no formato ISO `AAAA-MM-DD` e não pode estar no futuro.

### Paginação e ordenação

- `GET /api/v1/patients?page=0&size=20`
- `GET /api/v1/patients?page=0&size=10&sort=nome,asc`
- `GET /api/v1/patients?page=0&size=10&sort=dataNascimento,desc`

O tamanho da página deve ficar entre 1 e 100. Campos de ordenação permitidos: `nome`, `dataNascimento` e `sexo`.

## Execução

Com a infraestrutura configurada em `infra/.env`, inicie o PostgreSQL e o serviço a partir da raiz do repositório:

```bash
docker compose --env-file infra/.env -f infra/docker-compose.yml up --build patient-service
```

O serviço fica disponível em `http://localhost:8082`; pela API Gateway, use `http://localhost:8080/api/v1/patients`.

A chave pública RSA usada para validar o JWT deve estar configurada em `HEALTHSYS_SECURITY_JWT_PUBLIC_KEY`. Em ambiente local, a propriedade `ddl-auto` usa `update` para criar/atualizar a tabela. Em produção, prefira migrações versionadas e `ddl-auto: validate`.
