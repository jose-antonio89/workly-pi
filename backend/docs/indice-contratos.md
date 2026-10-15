# Proteção contra contratos duplicados

O banco garante que um cliente tenha no máximo **um contrato ativo por serviço** com o índice único parcial
`contrato_ativo_unico_por_cliente_servico` na coleção `contratos`:

- chaves: `{ cliente: 1, servico: 1 }`, `unique: true`;
- filtro parcial: `status` em `pendente`, `proposta_pendente`, `proposta_aceita`, `em_andamento`, `entregue`.

Contratos `cancelado`, `concluido` e `encerrado` não ocupam o par, então o cliente pode contratar de novo.

## Como a API usa o índice

- Na inicialização, a API procura duplicações, instala os índices (sem depender do `autoIndex`) e confere se o
  índice existe **exatamente** com a definição acima.
- Se algo falhar (duplicações antigas, índice com definição diferente, erro do banco), a API continua no ar para
  consultas, mas **novos pedidos e propostas recebem 503** com uma mensagem genérica. Os detalhes aparecem só no
  log do servidor, começando por `ATENÇÃO: proteção contra contratos duplicados indisponível`.
- Enquanto estiver bloqueada, a API tenta reinstalar no máximo uma vez por minuto, quando chega um novo pedido.
  Com a proteção ativa, ela revalida o índice a cada 5 minutos e o reinstala se tiver sido removido.
- Nenhum registro é alterado ou apagado automaticamente.

## Resolver duplicações manualmente

1. Veja os conflitos no log da API ou rode a instalação avulsa, que lista os pares e os IDs:

   ```bash
   node src/scripts/indices.js
   ```

   Saída de exemplo: `cliente 6ad0… / serviço 6ad0…: 6ad1…, 6ad1…`. O comando termina com código 1 enquanto houver
   conflito.

2. Para cada par, decida com as pessoas envolvidas qual contrato continua ativo. Faça um backup antes
   (`npm run backup`).

3. Encerre os demais **sem apagá-los**, por exemplo marcando como cancelados no `mongosh`:

   ```js
   db.contratos.updateOne(
     { _id: ObjectId('<id do contrato duplicado>'), status: { $in: ['pendente', 'proposta_pendente'] } },
     { $set: { status: 'cancelado' } }
   )
   ```

   Contratos em andamento ou entregues exigem combinar a solução com cliente e freelancer antes de mudar o status.

4. Rode de novo `node src/scripts/indices.js` até aparecer `Índices de contrato instalados e verificados.`
   A API em execução libera os pedidos sozinha em até um minuto; reiniciar também resolve.

## Índice com definição diferente

Se já existir um índice com o mesmo nome ou as mesmas chaves e outra configuração, a instalação falha e a criação
continua bloqueada. Confira com `db.contratos.getIndexes()`, remova manualmente o índice incorreto
(`db.contratos.dropIndex('<nome>')`) e rode `node src/scripts/indices.js` novamente.
