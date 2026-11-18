# Serviço de Prontuários (medical-record-service)

Microserviço responsável pela gestão dos prontuários eletrônicos de pacientes, histórico médico, exames laboratoriais e diagnósticos clínicos, utilizando **MongoDB** para persistência não-relacional flexível e escalável conforme a arquitetura do HealthSys.

## Funcionalidades
- **Prontuário Clínico (`medical_records`)**: Registro e consulta de prontuários associados ao identificador único do paciente.
- **Exames Médicos (`medical_exams`)**: Cadastro, atualização e listagem de solicitações de exames com status de resultado.
- **Resultados de Exames (`exam_results`)**: Registro de laudos detalhados, resumo dos exames e validação médica.
- **Diagnósticos Médicos (`diagnoses`)**: Registro de hipóteses e conclusões diagnósticas, com validação médica.
- **Eventos Assíncronos (Apache Kafka)**:
  - Consumo do tópico `pacientes.cadastrado` para criação automática e idempotente do prontuário inicial.
  - Publicação no tópico `prontuario.exame-registrado` notificando serviços externos sobre novas solicitações.
- **Validação síncrona via gRPC**: Verificação de existência do paciente no `patient-service` antes de operações de prontuário.

## Banco de Dados (MongoDB)
- `medical_records`: Documentos de prontuário com `patientId` indexado univocamente.
- `medical_exams`: Documentos de exames indexados por `medicalRecordId`, `patientId` e `doctorId`.
- `exam_results`: Documentos de resultados indexados por `medicalExamId`.
- `diagnoses`: Documentos de diagnósticos indexados por `medicalRecordId`, `patientId` e `doctorId`.
- `processed_events`: Registro de `eventId` para garantia de processamento *at-least-once* idempotente.
