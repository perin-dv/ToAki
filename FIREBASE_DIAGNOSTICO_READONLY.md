# toAki — Diagnóstico Firebase sem modificar produção

## Motivo
O plugin Firebase não está conectado na sessão. O GitHub Actions da Fase A já conseguiu autenticar no projeto `toaki-cf058` para publicar Hosting Preview, mas isso **não prova** permissões de leitura no banco e nas Functions.

## Conteúdo
- `scripts/diagnostico-firebase-readonly.cjs`: script Node.js 22 com APIs nativas e assinatura JWT OAuth2, sem instalações externas.
- `.github/workflows/firebase-diagnostico-readonly.yml`: executa **exclusivamente manualmente, em main**, e só lê metadados.
- `.github/workflows/validar-diagnostico.yml`: valida segurança e sintaxe no pull request **sem acesso ao segredo**.

Metadados consultados:
1. Firestore API `documents:listCollectionIds`: endpoint **somente leitura**, embora utilize HTTP POST, para consultar nomes das coleções de raiz; a saída reporta apenas existência booleana de uma lista fixa, nunca nomes desconhecidos, IDs ou dados de documentos.
2. Cloud Functions API `GET .../functions`: reporta apenas existência booleana de três Functions esperadas; nunca mostra configurações ou segredos.
3. Permissão insuficiente gera `sem_permissao` em vez de tentar alterar IAM ou pedir novas chaves.

O workflow usa a credencial `FIREBASE_SERVICE_ACCOUNT_TOAKI_CF058` já prevista no GitHub, compara o `project_id` com `toaki-cf058`, grava-a em arquivo temporário de permissão restrita e a apaga ao terminar.

## Limitações e autorização
- **Este PR não habilita coleta nem executa diagnóstico no Firebase**. O GitHub exige o workflow na branch padrão para a execução manual; o PR precisa ser analisado e explicitamente aprovado para merge em `main`.
- A inclusão do workflow **não publica** Hosting, Functions, Firestore Rules nem altera dados.
- Somente após merge **expressamente autorizado**, executar pelo GitHub Actions → “Diagnosticar Firebase (somente leitura, sem deploy)” → Run workflow → main.
- **Não usar** `pull_request_target` ou qualquer gatilho com secret em código de PR. O workflow guarda `contents:read` e exige ref `main`.
- Em caso de falha de permissões, não aumentar automaticamente o acesso da credencial já usada para Hosting; revisar IAM com o proprietário.
- Resultado não confirma usuário admin, estrutura interna da empresa, backups ou conformidade de dados; esses itens exigem verificação própria antes de qualquer deploy.

## Estado
Preparado e testável em PR independente, sem publicação e sem merge. Não modifica os PRs de desenvolvimento da web e preserva o Preview aprovado.
