# Frontend

Aplicação React + TypeScript criada com Vite. As chamadas de API devem usar `VITE_API_BASE_URL`, apontando para o API Gateway; o valor padrão é `http://localhost:8080/api/v1`.

```bash
npm install
npm run dev
```

O gateway libera CORS para o endereço servido pelo Compose (`http://localhost:3000`) e para o servidor Vite (`http://localhost:5173`).
