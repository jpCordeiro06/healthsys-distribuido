# Módulo de Segurança Compartilhada

O módulo `shared:security` configura o Spring Security como um resource server stateless para os serviços MVC. Ele valida JWTs assinados com RSA usando a chave pública configurada, verifica os timestamps padrão do token e exige um claim `perfil` com um destes valores: `ADMIN`, `MEDICO`, `ENFERMEIRO` ou `RECEPCAO`.

O claim `perfil` é convertido em uma autoridade Spring com o prefixo `ROLE_`. Proteja os métodos dos controllers com `@PreAuthorize`, por exemplo:

```java
@PreAuthorize("hasAnyRole('ADMIN', 'MEDICO')")
```

Por padrão, todas as rotas exigem autenticação. Adicione rotas sem autenticação somente por meio de `healthsys.security.public-paths`; o serviço de usuários configura `/api/v1/auth/login` para esse fim. A rota `/actuator/health` permanece pública para os healthchecks dos containers. Falhas de autenticação e autorização usam o formato de erro da API: `{ "codigo", "mensagem", "campos" }`.

## Configuração da chave pública

Configure `HEALTHSYS_SECURITY_JWT_PUBLIC_KEY` no ambiente de cada serviço. O valor pode ser uma chave pública RSA em PEM ou sua representação DER codificada em Base64. A chave privada correspondente deve permanecer somente no componente que emite os tokens e nunca deve ser enviada ao repositório.

Para converter uma chave pública RSA em PEM para Base64 DER:

```bash
openssl pkey -pubin -in jwt-public.pem -outform DER | base64 -w 0
```

O serviço falha ao iniciar se a chave pública estiver ausente ou inválida; assim, não executa silenciosamente sem validar os tokens.