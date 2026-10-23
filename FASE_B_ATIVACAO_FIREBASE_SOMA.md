# Fase B — Ativação Firebase da Soma sem alterar Hosting live

## Estado confirmado antes desta mudança

- A Soma fictícia `empresa_teste_soma` foi criada e sua conta foi vinculada conforme log de provisionamento [#39896869428](https://github.com/perin-dv/ToAki/actions/runs/39896869428): `provisionamento_confirmado`, `contaAssociada=true`.
- Os testes do PR #17 de login, cadastro e vínculo automático passaram, e ele está integrado na `main`. Não é necessário repetir o cadastro da Soma.
- O diagnóstico remoto [#39895572137](https://github.com/perin-dv/ToAki/actions/runs/39895572137) concluiu que as regras publicadas diferem do repositório e **não contêm a exceção Soma**. Listar as Functions retornou 403 e não comprova existência nem ausência de endpoints.
- Produção Hosting `live` deve permanecer intacta. O código está pronto em PR e não deve ser confundido com deploy.

## Ativação manual e restrita

O workflow `.github/workflows/firebase-ativar-fase-b-soma.yml` só pode ser iniciado **manualmente** pelo proprietário do repositório a partir da `main`. Não roda com segredos em PR.

Ordem de execução:
1. Valida projeto `toaki-cf058`, instala dependências, roda testes e compila a interface sem credencial.
2. Com a service account GitHub já existente, lê o **Ruleset remoto atual** (não o arquivo do repositório). O script `scripts/ativar-regras-soma.cjs` só consegue alterar o retorno de `funcionario(empresaId)` para admitir a conta pré-autorizada (`toaki_sandbox_tester=true`, `empresa_id=empresa_teste_soma`) sem e-mail confirmado, mantendo consulta de funcionário ativo. Se regras remotas forem inesperadas, multiarquivo ou ambíguas, aborta.
3. Testa essa versão REMOTA + exceção mínima no Firestore Emulator; se qualquer teste de isolamento e escrita negada falhar, aborta **antes de qualquer deploy**.
4. Publica **somente** `operarEmpresaHomologacao` e `alterarRegistroEmpresaPiloto`. Os flags no runtime são `TOAKI_PILOTO_NO_ORIGINAL=habilitado` e `TOAKI_PILOTO_EMPRESAS=empresa_teste_soma`. Nenhuma outra empresa é permitida a operar nesse estágio; funções existentes não são deletadas.
5. Cria Ruleset imutável a partir da regra remota modificada e atualiza unicamente o Release `cloud.firestore`; verifica a publicação após a mudança. A versão remota anterior fica identificada no log para rollback. Se outro operador alterar o Release antes, aborta.
6. Somente se todo o processo passar, publica **Hosting Preview `fase-b-web`**, nunca Hosting `live` e sem alterar a landing principal.

A ativação pode falhar com `firebase_rules_sem_permissao` ou erro IAM de Cloud Functions, porque a permissão de listagem retornou 403. **Não conceder roles IAM automaticamente**, não ignorar falhas, não tentar substituir as regras por `firestore.rules` local.

## Limitações e segurança

- As contas normais de outras empresas continuam exigindo e-mail verificado e aprovação administrativa; a dispensa de verificação é exclusiva para a Soma fictícia. Nunca usar CNPJ de terceiros.
- A aprovação de cadastro empresarial real (`analisarCadastroEmpresa`) não é implantada por esse workflow; exige revisão do operador `admin_toaki` e política de autorização individual dos CNPJs. O formulário salva pedidos no próprio Firebase e mostra estado automaticamente.
- Não há backup adicional do Firestore de dados. Esta etapa só altera regras do serviço e duas funções selecionadas quando explicitamente acionada. Sem autorização para mexer em coleção de clientes reais.
- O teste integrado com a sua sessão **depende** de abrir o Preview atualizado com o seu login; não há senha, token ou UID expostos no CI. Gravações em produção não são simuladas pelo teste de emulador.

## Aceite no site após execução confirmada

1. Abrir o Preview `fase-b-web` e entrar com a conta já vinculada.
2. O topo deve exibir **Soma — Testes** sem pedir CNPJ ou confirmar e-mail.
3. Cadastrar moto fictícia, entregador fictício vinculado à moto, cliente fictício e NF fictícia.
4. Recarregar a página, sair e entrar novamente. Todos os registros devem reaparecer no Firestore.
5. Conferir alteração de status e histórico, duplicação de placa/NF, bloqueio de empresa diferente e de gravação direta pelo navegador.
6. Não marcar Fase B como concluída antes desses testes efetivos.
