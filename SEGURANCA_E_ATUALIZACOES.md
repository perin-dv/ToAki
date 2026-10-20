# toAki — politica de alteracoes e seguranca

## Branches
- `main`: codigo aprovado, destinado a producao. Nunca alterar diretamente.
- `develop`: integracao e testes. Mudancas novas via branches `feature/...` ou `fix/...`.
- Puxe revisoes via Pull Request. Verifique diferencas, compile e teste ANTES de fazer merge.
- Nao conectar deploy automatico ao `develop`. Publicar `main` somente apos aprovacao.

## Controles que precisam ser habilitados pelo proprietario no GitHub
Settings > Rules > Rulesets > New branch ruleset:
- Nome: `protecao-main`; status `Active`; alvo `main`.
- Require a pull request before merging (0 aprovacoes obrigatorias quando ha um unico mantenedor).
- Require status checks to pass before merging: selecione `Validar frontend` APOS o check aparecer em um PR.
- Require conversation resolution before merging.
- Block force pushes.
- Restrict deletions.
- Do not allow bypassing (sem bypass, quando possivel).
- Regras precisam estar ativas e aplicadas; apenas escrever este arquivo nao as aplica.

## Protecao de dados
- Jamais versionar credenciais privadas, tokens administrativos, service-account JSON ou arquivos `.env`.
- A chave de configuracao Firebase Web nao substitui regras de autorizacao.
- Separar Firebase `toaki-cf058` de outros projetos.
- Antes de ativar Firestore/Auth: regras de acesso por empresa e por usuario, auditoria, ambientes de teste e backups.
- Permissoes do GitHub Actions minimizadas: `contents: read`.
- Preferir dependencias atualizadas, revisar Pull Requests do Dependabot.
- CI valida o build, mas nao equivale a pentest, revisao de codigo ou protecao do servidor.

## Reverter
Identifique o ultimo commit bom e reverta por Pull Request. O deploy no Firebase continua sendo uma acao manual separada.
