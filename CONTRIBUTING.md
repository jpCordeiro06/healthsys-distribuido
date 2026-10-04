# Guia de contribuição

## Branches

- `main`: versão estável e demonstrável.
- `develop`: integração da sprint atual.
- `feat/<issue>-<descricao>`: nova funcionalidade.
- `fix/<issue>-<descricao>`: correção.
- `docs/<issue>-<descricao>`: documentação.
- `chore/<issue>-<descricao>`: infraestrutura ou manutenção.

Não envie commits diretamente para `main` ou `develop`.

## Commits

Use o padrão Conventional Commits:

```text
feat(patient): adiciona cadastro de paciente
fix(gateway): corrige rota de prontuarios
docs(readme): detalha execucao local
chore(ci): adiciona build do frontend
```

## Pull requests

- Mantenha um objetivo por PR.
- Relacione a issue com `Closes #123` quando aplicável.
- Atualize testes e documentação.
- Não inclua segredos, senhas reais, arquivos `.env` ou dados de pacientes.
- Aguarde a CI e pelo menos uma aprovação.

## Definição de pronto

- Código compila e testes passam.
- O serviço inicia localmente.
- Contratos de API/eventos foram documentados.
- Logs não expõem dados clínicos ou credenciais.
- O PR contém instruções para testar.
