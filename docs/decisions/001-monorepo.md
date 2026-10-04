# ADR 001: Monorepo para a fase acadêmica

- Status: aceita
- Data: 2026-10-04

## Decisão

Manter frontend, microsserviços, infraestrutura e documentação em um único repositório durante o projeto.

## Motivos

- Simplifica clonagem e execução pela equipe.
- Permite um único Docker Compose e uma única CI.
- Facilita alterações coordenadas nos contratos durante as oito semanas.

## Consequências

- A CI deve separar backend e frontend.
- Cada serviço mantém limites de domínio e persistência próprios.
- O histórico poderá crescer, mas isso é aceitável no escopo acadêmico.
