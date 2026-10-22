# toAki — Primeira empresa no Preview Fase B

## Resultado remoto confirmado em 22/10/2026
Execução manual [39852772280](https://github.com/perin-dv/ToAki/actions/runs/39852772280), na `main`, **sucesso**.
- Credencial do GitHub Actions autentica no Firebase existente `toaki-cf058`.
- Consulta aos metadados raiz do Firestore: `status: ok`, `paginacaoIncompleta: false`.
- Coleções consultadas e NÃO identificadas na raiz: `solicitacoes_cadastro_empresas`, `empresas`, `usuarios`, `clientes`, `entregadores`, `planos`, `assinaturas` e `auditoria`. Isto **não** afirma que o Authentication não tenha contas nem que outras coleções não existam.
- Cloud Functions v2: `sem_permissao` (HTTP 403). Logo, **não foi possível confirmar se funções estão ou não implantadas**. Nenhuma mudança de IAM foi feita.

## Objetivo do workflow Preview Fase B
Arquivo `.github/workflows/firebase-preview-piloto-web.yml`:
- Execução manual na branch `main`, apenas conta GitHub da origem. Secret já existente `FIREBASE_SERVICE_ACCOUNT_TOAKI_CF058`.
- Faz build da UI real com `VITE_TOAKI_ENV=piloto` e `VITE_TOAKI_PILOTO_NO_ORIGINAL=habilitado`, mas deixa `VITE_ENABLE_ADMIN_APPROVAL=false`.
- Publica **somente Firebase Hosting Preview**, canal `fase-b-web`, expiração de 7 dias. NÃO modifica Rules, Functions, Hosting Live, Admin Claims, nem cria contas ou empresas.
- O build piloto habilita **somente a interface** de solicitação empresarial: a gravação ocorre com o usuário autenticado e e-mail verificado, após confirmar o formulário, porque as Rules remotas informadas pelo responsável já autorizam criar `solicitacoes_cadastro_empresas/{uid}`.
- **O backend de cadastros continua bloqueado:** uma flag de front-end não libera autorização de empresas; Functions exigem allowlist, empresa piloto aprovada, cargo adequado e ambiente habilitado no servidor. Não alegar uso operacional pronto.

## Procedimento após aprovação deste workflow
1. Integrar a automação na `main` **sem executar publicações automáticas**.
2. Rodar manualmente GitHub Actions **Preview Fase B — solicitação empresarial no Firebase** na `main`.
3. Confirmar no log que o deploy é do canal `fase-b-web`, coletar a URL publicada pela CLI e verificar o login com conta já existente e e-mail verificado.
4. Solicitar cadastro de uma empresa real **somente com CNPJ que o responsável pode representar**. Não registrar CNPJ sem autorização. Se a pessoa já tem conta, usar login, não criar outra.
5. Conferir Firestore `solicitacoes_cadastro_empresas/{uid}` e a permissão de leitura pelo próprio usuário. A solicitação não aprova a empresa.
6. Resolver o **403 nas Functions** e verificar se o deploy de backend está disponível; revisar previamente backups, billing, regras existentes e a identidade de um `admin_toaki` concedido por administrador confiável.
7. Autorizar uma empresa piloto específica (allowlist `TOAKI_PILOTO_EMPRESAS=empresa_<CNPJ>`), publicar exclusivamente Functions aprovadas após auditoria, aprovar solicitação com checagem documental, validar isolamento entre empresas.
8. Repetir o teste real de CRUD moto → motorista → cliente → NF e persistência após relogin. Só depois considerar Hosting live.

## Proteções
Não publicar `firebase deploy` completo, não sobrescrever `firestore.rules` nem habilitar claims de admin pela interface. Não criar uma empresa diretamente pelo navegador; apenas solicitar cadastro. **Nenhum deploy confirmado até a execução manual do workflow e a verificação dos logs.**
