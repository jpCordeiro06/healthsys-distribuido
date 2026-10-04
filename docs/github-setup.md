# Publicação e configuração no GitHub

## 1. Criar o repositório

No GitHub, crie um repositório chamado `healthsys-distribuido`. Não adicione README, `.gitignore` ou licença na interface, pois esses arquivos já existem no projeto.

## 2. Publicar a estrutura

Substitua `SUA-ORGANIZACAO` pelo usuário ou organização da equipe:

```bash
git init
git add .
git commit -m "chore(repo): cria estrutura inicial do projeto"
git branch -M main
git remote add origin https://github.com/SUA-ORGANIZACAO/healthsys-distribuido.git
git push -u origin main

git switch -c develop
git push -u origin develop
```

## 3. Configurar o repositório

Em **Settings > General**:

- Defina `develop` como branch padrão enquanto o projeto estiver em construção.
- Habilite exclusão automática da branch após o merge.
- Use merge por squash para manter o histórico curto.

Em **Settings > Branches**, proteja `main` e `develop`:

- Exigir pull request antes do merge.
- Exigir pelo menos uma aprovação.
- Exigir a aprovação da conversa resolvida.
- Exigir os checks `Backend` e `Frontend`.
- Impedir force push e exclusão.

## 4. Primeiras issues sugeridas

1. Definir contratos REST e eventos do MVP.
2. Implementar autenticação JWT no serviço de usuários.
3. Implementar cadastro básico de pacientes.
4. Implementar modelo inicial de prontuário no MongoDB.
5. Implementar triagem e evento de conclusão.
6. Consumir evento de triagem no serviço de notificações.
7. Criar navegação e autenticação do frontend.
