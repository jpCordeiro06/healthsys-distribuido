# Serviço de Usuários

Esqueleto reservado para usuários, perfis e autenticação. As regras e o mecanismo JWT serão implementados pela frente responsável.

## Chaves RSA locais

Antes de iniciar o serviço, execute na raiz do repositório:

```bash
mkdir -p secrets
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out secrets/private.pem
openssl pkey -in secrets/private.pem -pubout -out secrets/public.pem
```

Gere as chaves somente na primeira configuração para preservar a validade dos tokens.
A pasta `secrets/` é ignorada pelo Git e fica disponível em `/workspace/secrets`
no contêiner de desenvolvimento pelo volume `..:/workspace:ro`. O Compose define
`RSA_PRIVATE_KEY=file:/workspace/secrets/private.pem` e
`RSA_PUBLIC_KEY=file:/workspace/secrets/public.pem`, independentemente do diretório
de trabalho do Gradle. `RsaKeyConfig` abre esses recursos e converte a chave privada
PKCS#8 e a pública X.509 em objetos RSA usados na assinatura e validação dos tokens.
Na execução local, use a raiz do repositório
como diretório de trabalho ou configure `RSA_PRIVATE_KEY` e `RSA_PUBLIC_KEY`
com caminhos como `file:/caminho/absoluto/private.pem` e `file:/caminho/absoluto/public.pem`.
Em produção, disponibilize os arquivos no contêiner e configure esses caminhos.
