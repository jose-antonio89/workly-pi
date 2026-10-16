# Executar o Workly

Requisitos: Node.js 24, npm e MongoDB acessível. O frontend usa React e Vite; o backend usa Express e MongoDB.

## Backend

Na pasta `backend`, execute `npm ci`. Copie `.env.example` para `.env`, sem sobrescrever uma configuração existente. Preencha `JWT_SECRET` com uma chave longa e aleatória e configure `MONGO_URI`. Mantenha `AUTO_SEED=false` para iniciar sem dados de demonstração.

Execute `npm run prepare:assets` para preparar as imagens padrão, sem alterar o banco. Depois, execute `npm run dev`. A API inicia na porta 3000.

## Frontend

Na pasta `frontend`, execute `npm ci`. Copie `.env.example` para `.env.local` e execute `npm run dev`. Abra `http://localhost:5173`. Não abra o arquivo HTML diretamente.

## Verificação

Execute `npm test` dentro de `backend` e de `frontend`. No frontend, execute também `npm run build` e `npm run test:assets`.

Os testes de integração usam bases descartáveis `workly_test_*`, separadas do banco da aplicação. Deixe o MongoDB local disponível. Para exigir sua disponibilidade, defina `WORKLY_EXIGIR_MONGO=1` no ambiente do processo de teste.

Os dois testes reais de backup e restauração também precisam de MongoDB Database Tools 100.3 ou mais recente (`mongodump` e `mongorestore`) no PATH. Sem essas ferramentas, esses dois testes são pulados e informam o motivo. A validação local com a versão 100.19.1 passou. O teste de link simbólico de arquivo pode não executar se o Windows negar sua criação; o teste informa essa limitação por diagnóstico.

## Funcionalidades e limites

A aplicação inclui catálogo, perfil, contratação, negociação de valor, entrega e pedido de ajuste, avaliações, chat e notificações internas. Conversas encerradas preservam o histórico em modo de leitura.

A recuperação de senha possui tokens e fluxo de redefinição, mas o envio em produção depende de implementar um canal de e-mail. Sem ele, a solicitação responde como indisponível. A opção de gerar um link no console é exclusiva de desenvolvimento local e está explicada no `.env.example`.

Esta versão não processa pagamentos reais e não inclui login social nem autenticação em duas etapas. O README principal preserva a documentação acadêmica original; requisitos e ideias ali descritos não significam que todas as integrações estejam implementadas.

## Dados locais e Git

As pastas `backend/uploads/` e `backend/backups/`, os arquivos `.env` e as configurações locais das ferramentas de desenvolvimento são ignorados pelo Git. Fotos enviadas pelos usuários e dados do banco não acompanham o código. Prepare os assets padrão ao instalar uma cópia nova.

Antes de publicar, confira `git status` e o conteúdo do commit. Ignorar um arquivo não remove cópias que já tenham sido publicadas no histórico.

## Operação do backend

- [Índice de contratos e prevenção de duplicados](../backend/docs/indice-contratos.md).
- [Exclusão de conta e recuperação após interrupções](../backend/docs/exclusao-de-conta.md).
- [Backup e restauração](../backend/docs/backup-e-restore.md). A retenção de backups é manual; não há limpeza automática.
