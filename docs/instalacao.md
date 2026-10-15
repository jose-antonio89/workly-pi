# Executar o Workly

Requisitos: Node.js 24, npm e MongoDB acessível.

## Backend

Na pasta `backend`, execute `npm ci`. Copie `.env.example` para `.env`, sem sobrescrever uma configuração existente. Preencha `JWT_SECRET` com uma chave longa e aleatória e configure `MONGO_URI`. Mantenha `AUTO_SEED=false` para iniciar sem dados de demonstração.

Execute `npm run prepare:assets` para preparar as imagens padrão, sem alterar o banco. Depois, execute `npm run dev`. A API inicia na porta 3000.

## Frontend

Na pasta `frontend`, execute `npm ci`. Copie `.env.example` para `.env.local` e execute `npm run dev`. Abra `http://localhost:5173`. Não abra o arquivo HTML diretamente.

## Verificação

Execute `npm test` dentro de `backend` e de `frontend`. No frontend, execute também `npm run build` e `npm run test:assets`.

O README principal preserva a documentação acadêmica original. Esta versão não inclui pagamentos reais, recuperação de senha por e-mail, login social nem autenticação em duas etapas. Os testes locais não substituem uma validação completa com MongoDB real.
