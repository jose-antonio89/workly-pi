# Backup e restore

Os scripts usam as ferramentas oficiais do MongoDB (`mongodump` e `mongorestore`, do **MongoDB Database Tools**,
instalado à parte e com suporte a `--config`, versão 100.3 ou mais nova) e copiam a pasta `backend/uploads/`.
A base vem de `MONGO_URI` no `backend/.env`. Não há rota na API para isso: só linha de comando.

## Fazer um backup

```bash
cd backend
npm run backup                         # grava em backend/backups/workly-backup-AAAAMMDD-HHMMSS/
npm run backup -- --saida /outra/pasta # outra pasta de destino
```

A pasta gerada contém:

- `dump/<base>/`: saída do `mongodump --gzip` (dados, índices e opções de cada coleção);
- `uploads/`: cópia dos arquivos enviados (fotos de perfil e imagens de serviço). Links simbólicos não são copiados
  e ficam listados no manifesto;
- `manifesto.json`: gravado por último. Registra o formato e a versão, o início e o fim do dump, a base de origem
  (sem credenciais), a versão do `mongodump`, as coleções com contagem, índices e validadores, o SHA-256 de cada
  arquivo do dump e de cada upload, e quantas contas já estavam removidas. Sem manifesto, a pasta não é um
  backup válido.

### Consistência

- Um dump de uma base enquanto a aplicação grava **não é consistente** entre coleções. `--oplog` só funciona no
  dump da instância inteira de um replica set e não é usado aqui.
- O mesmo vale para os uploads copiados com a aplicação no ar.
- Para um backup confiável, pare as gravações (ou coloque a aplicação em manutenção) durante o backup, ou use um
  snapshot do volume. Os scripts não presumem consistência.

### Guarda dos arquivos

O backup contém **hashes de senha, e-mails, CPFs, telefones, dados de pagamento, mensagens e fotos**.

- Guarde em local com acesso restrito e criptografado, fora do repositório. `backend/backups/` já está no
  `.gitignore`.
- Não envie por e-mail nem compartilhe a pasta.
- **Não há exclusão automática de backups:** a limpeza é manual, por conta de quem opera. Apague os antigos com
  segurança, porque cópias antigas mantêm dados de contas que pediram exclusão.

## Restaurar

O restore é **destrutivo** e substitui as coleções do backup na base de destino.

```bash
cd backend
npm run restore -- backups/workly-backup-AAAAMMDD-HHMMSS --confirmar <nome-da-base> --manutencao-confirmada
```

| Opção | Para quê |
|---|---|
| `--confirmar <nome-da-base>` | Obrigatória. O nome precisa ser igual ao da base em `MONGO_URI`. |
| `--manutencao-confirmada` | Obrigatória. Declara que a aplicação está parada ou em manutenção, sem gravações na base de destino. **Isso é responsabilidade de quem opera**: o script não tem como verificar. |
| `--incluir-uploads` | Também restaura as imagens. Só cria os arquivos que faltam: **nunca sobrescreve nem apaga**. Recusa caminhos absolutos, com `..`, links simbólicos e qualquer caminho que, resolvido, fique fora de `backend/uploads/`. |
| `--permitir-reintroducao-excluidos` + `--confirmar-reintroducao "REINTRODUZIR CONTAS EXCLUIDAS"` | Exceção à regra de contas excluídas (abaixo). As duas juntas, com o texto exato. |

### Proteções, na ordem em que são verificadas

1. **Base de destino:** só bases `workly_test_*`. Para qualquer outra (inclusive a base local `workly`), defina
   `WORKLY_RESTORE_BASE_LIBERADA=<nome exato da base>` só para aquele comando.
2. **Confirmações:** `--confirmar` com o nome certo e `--manutencao-confirmada`.
3. **Manifesto:** formato e versão conhecidos, datas coerentes, coleções e contagens válidas, caminhos seguros e o
   SHA-256 de cada arquivo do dump conferido. Arquivo alterado, faltando ou extra recusa o restore. Com
   `--incluir-uploads`, os uploads também são conferidos antes de qualquer gravação.
4. **Contas excluídas depois do backup:** veja a seção seguinte.
5. **Base temporária:** o `mongorestore` grava primeiro em `<base>_rtmp_<carimbo>` (`--nsFrom`/`--nsTo`). Ali o
   script confere as coleções, as contagens do manifesto, os índices (inclusive únicos e parciais), os validadores
   e opções, e lê um documento de cada coleção. Se algo não bater, a base temporária é descartada e **o destino não
   é alterado**.

### Contas excluídas ou anonimizadas depois do backup

Restaurar um backup anterior a uma exclusão traria de volta os dados pessoais que foram anonimizados. **Restaurar
não preserva exclusões posteriores.** Por isso o restore é recusado por padrão quando:

- alguma conta da base atual foi removida, teve a exclusão confirmada ou entrou em exclusão (`removidoEm`,
  `exclusaoConfirmadaEm`, `removendoDesde`) **a partir do início do backup**;
- não há informação suficiente para decidir: manifesto sem data confiável, conta removida sem data de exclusão ou
  exclusão em andamento;
- depois de restaurar na base temporária, alguma conta hoje excluída aparece lá sem estar anonimizada (conferência
  exata pelos IDs, que não depende de relógio).

A exceção exige `--permitir-reintroducao-excluidos` **e** `--confirmar-reintroducao "REINTRODUZIR CONTAS EXCLUIDAS"`.
Use só com uma decisão registrada. Depois, as exclusões precisam ser refeitas manualmente pelo fluxo de exclusão.

O mesmo vale para as imagens: com `--incluir-uploads`, fotos apagadas na anonimização **voltam** se estiverem no
backup.

### A troca de coleções não é atômica

Depois da conferência, cada coleção é trocada uma por vez:

1. a coleção atual é renomeada para `<coleção>_pre_restore_<carimbo>`;
2. a coleção restaurada é movida da base temporária para o destino.

As cópias `*_pre_restore_*` **nunca são apagadas automaticamente**. Confira a aplicação e apague-as manualmente
quando tiver certeza. Coleções do destino que não estão no backup ficam como estavam.

Se algo falhar no meio da troca, o script **para** e informa:

- quais coleções já foram trocadas;
- em qual coleção e etapa falhou;
- quais não foram tocadas (as cópias delas continuam na base temporária);
- os comandos `mongosh` para voltar ao estado anterior. Para cada coleção trocada, renomeia a restaurada para
  `*_restaurada_*` e a `*_pre_restore_*` de volta ao nome original.

Nada é apagado nesse caso. A renomeação entre bases (`renameCollection`) exige um usuário com permissão
administrativa e não funciona em clusters fragmentados.

## Credenciais e logs

- A URI nunca vai nos argumentos dos processos. Ela é gravada num arquivo YAML temporário (`uri:`), criado com
  permissão só para o dono, passado com `--config` e apagado ao fim, mesmo em caso de erro. Os processos rodam sem
  shell.
- Qualquer `usuário:senha@` de URI e a própria senha são trocados por `***` nas mensagens, inclusive na saída
  repassada das ferramentas. O conteúdo dos documentos nunca é escrito no console.

## Testes

`npm test` roda os testes de backup e restore só em bases `workly_test_*` e pastas temporárias. Os testes de ida e
volta com as ferramentas reais (`test/backupRestoreIntegracao.test.js`) são **pulados com aviso** quando `mongodump` ou
`mongorestore` não estão no PATH.
