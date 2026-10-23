# toAki — Sandbox fictício “Soma” sem CNPJ

## Finalidade

O responsável quer usar as contas Firebase Authentication já existentes para testar os vínculos de veículos, motoristas, clientes e NFs, sem depender de um CNPJ verdadeiro. **Nunca usar CNPJ de empresa de terceiros ou representar a Soma como empresa juridicamente cadastrada neste sandbox.**

O ID técnico de teste é `empresa_teste_soma` (não é um CNPJ). A interface apresenta aviso de dados fictícios; o registro só pode ter `tipo_registro: "empresa_teste"`, `modo_teste: true`, `cnpj: null`, `ambiente: "piloto"` e `status: "ativa"`.

## Segurança operacional

- `autorizarAprovacaoEmpresa` continua a aceitar **apenas `empresa_<CNPJ>`**, com habilitação da empresa real e sem autoaprovação.
- Para `empresa_teste_soma`, a operação exige simultaneamente `TOAKI_PILOTO_NO_ORIGINAL=habilitado`, `TOAKI_PILOTO_EMPRESAS=empresa_teste_soma`, projeto `toaki-cf058` e os marcadores de sandbox verificados no documento `empresas/empresa_teste_soma`.
- Cada operação continua a verificar identidade Firebase com claim exclusiva de sandbox (ou e-mail verificado em empresas reais), associação `empresas/empresa_teste_soma/funcionarios/{uid}` ativa e cargo permitido, com registro de histórico, transações e validações de referências. **O navegador não pode provisionar empresa, conceder claims ou se tornar gestor sozinho.**
- Firestore Rules atuais permanecem com escrita empresarial pelo navegador negada.
- Testes exigem dados fictícios: não importar notas fiscais, CPFs, endereços residenciais ou dados de clientes reais.
- O ID de teste não é aceito como CNPJ na BrasilAPI e não deve preencher `cnpjs_reservados`.

## Provisionamento manual e reversível

O workflow `.github/workflows/firebase-soma-sandbox.yml` deve ser revisado e incorporado na `main` **sem execução automática**.

Tem dois modos:
1. **verificar**: lê unicamente conta do Firebase Authentication e existência do tenant e vínculo no Firestore, não escreve nada.
2. **provisionar**: exige escolha explícita da operação e texto `PROVISIONAR_SOMA_TESTE`; após conferir projeto, conta existente ativa, cargos prévios, proprietário e dados sem CNPJ, sem exigir e-mail verificado, cria apenas a empresa fictícia e a associação ao primeiro usuário em transação; em seguida emite `role: dono_empresa, empresa_id: empresa_teste_soma` no Firebase Authentication. Se uma permissão não estiver disponível, falha sem tentar alterar IAM.

A conta indicada pelo responsável não aparece no código público. O workflow exige configurá-la uma única vez em **GitHub → Settings → Secrets and variables → Actions**, como secret `TOAKI_EMAIL_PROPRIETARIO_SOMA`. Não enviar senha, token nem UID em comentários ou logs.

**Segunda conta:** a identidade ainda é desconhecida. Não adicionar qualquer conta arbitrária. Identificar e confirmar a segunda conta por mecanismo administrativo autorizado antes de vincular um funcionário; não presumir automaticamente que seja a segunda ou última conta da lista.

## Dependências de ativação

- Execução anterior [39852772280](https://github.com/perin-dv/ToAki/actions/runs/39852772280): acesso aos metadados do Firestore `ok`; consulta às Cloud Functions `403 sem_permissao`. Isto não prova que as Functions estão ausentes ou impossibilitadas de deploy.
- Preview [39855708742](https://github.com/perin-dv/ToAki/actions/runs/39855708742) publicado em `fase-b-web`, somente interface de testes. Não alterou Rules, Functions ou Auth Claims.
- **Nada do sandbox foi provisionado nem as Functions publicadas** enquanto não houver execução manual autenticada e aprovação explícita do backend. Merge do código não é deploy.
- Antes de ativar CRUD via Cloud Functions no projeto original, confirmar IAM, backup, custo e configurar allowlist exclusiva do sandbox no runtime das Functions. A publicação do backend deve ser revisada isoladamente e não deve alterar Hosting live.
- Caso a credencial GitHub usada para Hosting não consiga consultar Firebase Auth (`getUserByEmail`) ou não tenha Firestore write, registrar o erro e revisar permissões no Console; jamais pedir chave JSON no chat.

## Próximo teste de aceite

Autenticar com a conta existente, atualizar claims no painel, conferir aviso **Soma — Ambiente de Testes**, cadastrar placa fictícia, motorista fictício, cliente fictício e NF fictícia, recarregar e relogar, confirmar persistência, negar escrita direta no navegador e verificar isolamento de outros usuários.

## Correção do diagnóstico após erro do GitHub Actions

Foi reportada uma execução manual que passou por setup, testes e autenticação da credencial mas **falhou na etapa de consulta da conta**. A imagem mostra a etapa, porém não inclui o código de erro do log; portanto não é possível afirmar com segurança se faltou o secret do e-mail, se o e-mail não está verificado, se a conta não existe ou se a service account não tem permissão Firebase Auth.

A rotina agora informa de forma sanitizada:
- `secret_email_soma_ausente_ou_invalido`: conferir em **Settings → Secrets and variables → Actions** a existência de `TOAKI_EMAIL_PROPRIETARIO_SOMA` com o e-mail exato da conta existente, sem colar dados no log.
- `conta_nao_encontrada`: conferir se o usuário já existe **no projeto Firebase correto**; jamais criar outro usuário automaticamente.
- `email_nao_verificado`: erro histórico corrigido: a Soma de testes não exige e-mail verificado. Isso continua obrigatório em operações de empresas reais.
- `sem_permissao_firebase` ou `falha_firebase_auth`: solicitar revisão **das permissões existentes**, sem conceder IAM automaticamente ou usar nova chave pessoal.
- `conta_ja_vinculada_outra_empresa`, `papel_existente_incompativel` e `empresa_teste_conflito`: bloquear alteração de vínculos preexistentes.

A execução de `verificar` é **somente leitura**. A de `provisionar` continua dependente da confirmação explícita e controles. Nenhum cadastro foi afirmado como criado após a falha, e nenhum deploy do backend foi executado.

## Correção: e-mail livre na Soma fictícia

O responsável já definiu que **não deve haver confirmação de e-mail para contas de testes**. A exigência anterior causou falha `email_nao_verificado` no workflow `verificar`; foi removida **somente do tenant `empresa_teste_soma`**.

- `verificar` agora informa `emailConfirmado: false`, sem tratar isso como falha. A conta deve existir, estar habilitada e não ter vínculo conflitante.
- `provisionar` após confirmação manual cria/vincula apenas o sandbox Soma e emite claim `toaki_sandbox_tester: true` para o usuário exato selecionado por secret privado, **sem editar o atributo `emailVerified`** do Firebase Authentication.
- Firestore Rules foram adaptadas **somente no código** para aceitar conta não verificada quando `empresaId == empresa_teste_soma`, a claim `toaki_sandbox_tester == true` e `empresa_id` coincidem, e existe associação ativa em `empresas/empresa_teste_soma/funcionarios/{uid}`. Sem a claim, membros de teste não acessam dados, e as empresas reais continuam exigindo verificação.
- Os dois callables operacionais aplicam a mesma condição para a identidade antes de consultar registros, e continuam validando tenant piloto, allowlist e papel.
- **Atenção:** o merge de código não publica Rules, Functions nem Hosting. Até uma implantação separada, autorizada e confirmada, o Preview continuará usando a configuração remota anterior. Nenhuma conta foi alterada automaticamente.
