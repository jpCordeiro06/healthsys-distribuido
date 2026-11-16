# Serviço de Triagem

Serviço responsável pelo gerenciamento de triagens (`Screening`), classificações de risco (`RiskClassification`) e sintomas (`Symptom`).

## Endpoints

### Classificações de Risco
- `GET /api/v1/risk-classifications`
- `GET /api/v1/risk-classifications/{id}`
- `POST /api/v1/risk-classifications`
- `PUT /api/v1/risk-classifications/{id}`
- `DELETE /api/v1/risk-classifications/{id}`

### Sintomas
- `GET /api/v1/symptoms`
- `GET /api/v1/symptoms/{id}`
- `POST /api/v1/symptoms`
- `PUT /api/v1/symptoms/{id}`
- `DELETE /api/v1/symptoms/{id}`

### Triagens
- `GET /api/v1/screenings`
- `GET /api/v1/screenings/{id}`
- `POST /api/v1/screenings`
- `PUT /api/v1/screenings/{id}`
- `PATCH /api/v1/screenings/{id}/status`
- `DELETE /api/v1/screenings/{id}`
- `POST /api/v1/screenings/{id}/symptoms/{symptomId}`
- `DELETE /api/v1/screenings/{id}/symptoms/{symptomId}`
