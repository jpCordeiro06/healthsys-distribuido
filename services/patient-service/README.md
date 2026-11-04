# Serviço de Pacientes

Microsserviço responsável pelo cadastro e gerenciamento de pacientes, alergias e histórico de vacinação. Implementado com Java 17, Spring Boot, Spring Data JPA e PostgreSQL.

Todos os endpoints abaixo exigem um JWT válido, conforme a configuração de segurança compartilhada.

## Pacientes

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/v1/patients` | Cadastra paciente, podendo incluir alergias e vacinas iniciais |
| `GET` | `/api/v1/patients` | Lista pacientes com paginação e ordenação |
| `GET` | `/api/v1/patients/{patientId}` | Consulta paciente, incluindo alergias e vacinas |
| `PUT` | `/api/v1/patients/{patientId}` | Atualiza dados do paciente; listas enviadas substituem as respectivas listas atuais |
| `DELETE` | `/api/v1/patients/{patientId}` | Exclui paciente e seus registros de alergias e vacinas |

### Exemplo de cadastro

```json
{
  "nome": "Joao da Silva",
  "cpf": "529.982.247-25",
  "dataNascimento": "1985-04-12",
  "sexo": "M",
  "telefone": "+55 85 99999-0000",
  "alergias": [
    {
      "alergeno": "Dipirona",
      "reacao": "Urticaria",
      "observacoes": "Relato do paciente"
    }
  ],
  "vacinas": [
    {
      "vacina": "Hepatite B",
      "dose": "1a dose",
      "dataAplicacao": "2026-01-15",
      "lote": "ABC123",
      "proximaDose": "2026-02-15"
    }
  ]
}
```

`nome`, `cpf`, `dataNascimento` e `sexo` são obrigatórios. O CPF aceita pontuação, mas é armazenado somente com 11 dígitos. São verificados os dois dígitos verificadores e sequências repetidas são rejeitadas. Um CPF já cadastrado retorna `409 Conflict`; a unicidade também é garantida no banco de dados. `telefone`, `alergias` e `vacinas` são opcionais.

Na atualização (`PUT`), se `alergias` ou `vacinas` forem omitidas ou enviadas como `null`, a lista correspondente é preservada. Se uma lista for enviada (inclusive vazia), ela substitui integralmente os registros existentes daquela categoria. Para alterações pontuais, use os endpoints próprios abaixo.

## Alergias

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/v1/patients/{patientId}/allergies` | Registra alergia |
| `GET` | `/api/v1/patients/{patientId}/allergies` | Lista alergias do paciente |
| `PUT` | `/api/v1/patients/{patientId}/allergies/{allergyId}` | Atualiza alergia |
| `DELETE` | `/api/v1/patients/{patientId}/allergies/{allergyId}` | Exclui alergia |

Corpo de exemplo:

```json
{
  "alergeno": "Amoxicilina",
  "reacao": "Manchas na pele",
  "observacoes": "Reação relatada pelo paciente"
}
```

`alergeno` é obrigatório. `reacao` e `observacoes` são opcionais.

## Vacinas

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/v1/patients/{patientId}/vaccines` | Registra vacina aplicada |
| `GET` | `/api/v1/patients/{patientId}/vaccines` | Lista vacinas do paciente |
| `PUT` | `/api/v1/patients/{patientId}/vaccines/{vaccineId}` | Atualiza registro de vacina |
| `DELETE` | `/api/v1/patients/{patientId}/vaccines/{vaccineId}` | Exclui registro de vacina |

Corpo de exemplo:

```json
{
  "vacina": "Influenza",
  "dose": "Dose anual",
  "dataAplicacao": "2026-04-10",
  "lote": "INF2026A",
  "proximaDose": "2027-04-10"
}
```

`vacina`, `dose` e `dataAplicacao` são obrigatórios. `lote` e `proximaDose` são opcionais. Datas usam o formato ISO `AAAA-MM-DD`; a data de aplicação não pode estar no futuro e a próxima dose não pode anteceder a aplicação.

## Paginação e ordenação

- `GET /api/v1/patients?page=0&size=20`
- `GET /api/v1/patients?page=0&size=10&sort=nome,asc`
- `GET /api/v1/patients?page=0&size=10&sort=dataNascimento,desc`

O tamanho da página deve ficar entre 1 e 100. Campos permitidos para ordenação: `nome`, `cpf`, `dataNascimento` e `sexo`.

## Persistência e migração

O CPF é armazenado normalizado e possui restrição de unicidade no PostgreSQL. Alergias e vacinas são entidades relacionadas ao paciente por chave estrangeira (1:N); ao excluir um paciente, seus registros relacionados também são excluídos.

**Atenção ao banco já existente:** a coluna `cpf` é obrigatória no modelo. Se a tabela `patients` já contém pacientes cadastrados antes desta versão, faça backup e migre os dados antes de iniciar a nova versão. O procedimento é: adicionar `cpf` inicialmente permitindo `NULL`, preencher cada registro com o CPF real e validado do paciente, criar a restrição de unicidade e, por fim, tornar a coluna `NOT NULL`. Não invente CPFs para os registros existentes. Em banco local descartável, pode recriar o volume do PostgreSQL; isso apaga os dados locais.

## Execução

Com a infraestrutura configurada em `infra/.env`, inicie o serviço a partir da raiz do repositório:

```bash
docker compose --env-file infra/.env -f infra/docker-compose.yml up --build patient-service
```

O serviço fica disponível em `http://localhost:8082`; pela API Gateway, use `http://localhost:8080/api/v1/patients`.

A chave pública RSA usada para validar o JWT deve estar configurada em `HEALTHSYS_SECURITY_JWT_PUBLIC_KEY`. Em ambiente local, `ddl-auto` usa `update`; em produção, prefira migrações versionadas e `ddl-auto: validate`.
