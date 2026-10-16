# Exclusão de conta

> Preservar o histórico da outra parte é uma **regra técnica do projeto**. Este documento não afirma
> conformidade com a LGPD ou com qualquer outra norma; essa análise ainda precisa ser feita.

## O que acontece

Excluir a conta **anonimiza** o registro em vez de apagá-lo:

- Removido: nome (vira "Usuário removido"), e-mail, CPF, senha, telefone, foto própria, dados de pagamento, links,
  biografia e preferências. E-mail e CPF viram marcadores únicos, liberando os valores reais para um novo cadastro.
- Retirado: os serviços da conta saem do catálogo (exclusão lógica) e os favoritos ligados a eles são apagados.
- Preservado: contratos concluídos ou cancelados, avaliações e mensagens. Nas notificações de outras pessoas que
  citavam a conta (mensagem enviada ou avaliação escrita por ela), o nome é trocado por "Usuário removido".
  As notificações da própria conta são apagadas.
- Bloqueios: a senha atual é obrigatória e contratos ativos (incluindo entregas aguardando confirmação) impedem a
  exclusão.

## Fases e recuperação após queda do processo

Não há transação do MongoDB (o servidor local não é um replica set), então a exclusão não é atômica. A consistência
vem de duas fases e de uma conclusão que pode ser repetida:

1. **Verificação (reversível):** `removendoDesde` marca a conta enquanto contratos ativos são procurados. Novos pedidos
   envolvendo a conta são recusados ou desfeitos. Se o processo cair aqui, a marca expira em 5 minutos e a conta volta
   ao normal, porque nada destrutivo aconteceu.
2. **Confirmação (sem volta):** uma única gravação define `exclusaoConfirmadaEm` e invalida as sessões. A partir daí a
   conta não faz login, não aparece no perfil público e não participa de contratos, mesmo com a marca expirada.
3. **Conclusão (idempotente):** cancela contratos ativos que uma corrida tenha deixado, retira serviços, limpa
   favoritos, anonimiza notificações, apaga a foto e, por último, anonimiza o usuário.

A recuperação (`recuperarExclusoesPendentes`) conclui exclusões confirmadas e cancela (sem apagar) contratos ativos
ligados a contas encerradas. Ela roda:

- na inicialização da API;
- a cada 10 minutos com a API no ar;
- manualmente: `node src/scripts/recuperarExclusoes.js`.

Rodar várias vezes não muda o resultado.

**Janelas que restam:** entre a queda e a próxima recuperação, um contrato gravado durante a exclusão pode continuar
ativo por até 10 minutos (ou até a API voltar). E, se a verificação demorar mais que 5 minutos, a marca expira e um
pedido pode ser aceito; nesse caso a conclusão o cancela.

## Backups e restauração

Guia completo: [`backup-e-restore.md`](backup-e-restore.md).

- `npm run backup` usa `mongodump` e grava uma cópia completa (base e uploads) em `backend/backups/`. Essa cópia
  contém os dados das contas **como estavam no momento do backup**.
- **Restaurar um backup anterior a uma exclusão traz de volta os dados pessoais que foram anonimizados** (e as fotos,
  se os uploads forem restaurados), além de contratos e serviços no estado antigo. Restaurar **não preserva**
  exclusões posteriores.
- Por isso o `npm run restore` recusa por padrão qualquer restauração que possa reintroduzir contas excluídas depois
  do backup, inclusive quando não há informação suficiente para decidir. A exceção exige duas confirmações
  explícitas. Nesse caso, as exclusões posteriores precisam ser refeitas manualmente.
- O restore também pode trazer índices antigos: na inicialização a API verifica o índice de contratos e bloqueia
  novos pedidos se ele não estiver correto (veja `indice-contratos.md`).
- Por quanto tempo os backups devem ser guardados ainda não está definido.
