# toAki — Fase B: banco persistente em um único Firebase

## Decisão de arquitetura (22/10/2026)

Usar o projeto **toaki-cf058** já existente. Não é necessário criar um segundo projeto.
**Isto não significa publicar regras e funções no projeto original automaticamente.**

O site Preview continua uma demonstração com `sessionStorage` até serem cumpridos os requisitos deste documento. Firebase Hosting Preview isola somente os arquivos do site, **não** o Auth, Firestore ou Cloud Functions.

## Incremento entregue nesta branch

- Backend de operações passa a reconhecer `piloto` **somente** quando três condições independentes estiverem presentes: configuração de backend `TOAKI_PILOTO_NO_ORIGINAL=habilitado`; empresa já aprovada com `ambiente: "piloto"` e `status: "ativa"`; ID da empresa incluído na lista exata `TOAKI_PILOTO_EMPRESAS`.
- Continuam obrigatórios: usuário autenticado com e-mail verificado, vínculo ativo `empresas/{empresaId}/funcionarios/{uid}`, papel autorizado por tipo, validação de campos, transação, unicidade de placa/NF e auditoria.
- Dados criados pela função recebem o marcador `ambiente_operacao`. Nenhum usuário pode atribuir cargos, criar uma empresa aprovada ou alterar o ambiente de uma empresa pelo formulário.
- Frontend pode ser compilado para piloto, porém o painel original **permanece em modo demonstrativo** por padrão. A rota empresarial somente mostra a operação quando `VITE_TOAKI_ENV=piloto` e `VITE_TOAKI_PILOTO_NO_ORIGINAL=habilitado`.
- Adicionados testes para verificar bloqueio por padrão, empresa não autorizada, marcador ausente e lista de autorização exata.

## Fases para ativação — ainda pendentes

1. Avaliar regras em Firestore Emulator e validar que um usuário não lê dados de outra empresa e que gravações diretas do navegador continuam bloqueadas.
2. Verificar as regras implantadas no projeto existente e realizar backup dos dados atuais; nunca sobrescrevê-las sem revisão. Observar que as regras de código não são automaticamente publicadas pelo Hosting Preview.
3. Criar **um tenant piloto autorizado** via backend administrativo confiável, com CNPJ verificado, empresa marcada `ambiente:"piloto"`, proprietário e papéis de acesso já conferidos. Não aceitar que o próprio usuário atribua a si privilégio.
4. Configurar `TOAKI_PILOTO_NO_ORIGINAL=habilitado` e `TOAKI_PILOTO_EMPRESAS=empresa_XXXXXXXXXXXXXX` **somente na Cloud Function** depois de revisar a implantação. No projeto original, todas as outras empresas continuam bloqueadas nesse endpoint.
5. Testar integração com Firebase Emulator e, após aprovação explícita da publicação, implantar Function e regras de maneira controlada. Não executar deploy do canal Hosting `live` e não fazer merge em `main` sem aprovação.
6. Para exibir o painel real no Preview, compilar apenas a versão de testes com `VITE_TOAKI_ENV=piloto` e `VITE_TOAKI_PILOTO_NO_ORIGINAL=habilitado`. Sem ambos, a versão atual continua fictícia.
7. Confirmar uma gravação com retorno de ID, ler o registro no Firestore, sair e entrar com a mesma conta, e negar o acesso com uma conta de outra empresa. Repetir para cliente, entregador, veículo e NF.

**Importante:** a solicitação de novas empresas via CNPJ no frontend atual permanece restrita ao fluxo de homologação anterior. Preparar o onboarding e a aprovação de piloto no projeto existente será o próximo incremento; não contornar a aprovação com uma permissão pública.

## Ainda não implementado

- Ativação do piloto no Firebase real, implantação do backend, aprovação da primeira empresa ou migração dos dados simulados.
- Persistência do dashboard fictício (ele mantém `sessionStorage`).
- Edição, cancelamento de NF, atribuição de rotas, GPS, comprovantes reais, assinatura e cobrança.

## Conclusão

Esta etapa prepara a compatibilidade com **um Firebase somente**, de forma reversível e desabilitada por padrão. Até o deploy controlado das Functions, nenhuma gravação empresarial real é permitida pelo novo fluxo.

## Fase B — aprovação empresarial no mesmo Firebase (novo incremento)

**Situação:** código preparado e pendente de implantação. O plano Blaze do projeto original foi confirmado pelo responsável. Isso não significa que as Functions estejam publicadas ou que o backend operacional já esteja liberado.

### Mudanças do incremento

- `analisarCadastroEmpresa` agora exige, antes de aprovar e atribuir permissões em `toaki-cf058`, habilitação explícita `TOAKI_PILOTO_NO_ORIGINAL=habilitado` e inclusão do identificador `empresa_<CNPJ>` em `TOAKI_PILOTO_EMPRESAS`.
- A empresa aprovada recebe `ambiente:"piloto"` de um administrador autenticado pelo backend. O frontend não pode atribuir a si esse marcador.
- O formulário de CNPJ passa a admitir o modo piloto do projeto original, mas somente num build explicitamente configurado; sem isso, a solicitação segue bloqueada.
- `firebase.piloto.json` contém **somente Firestore e Functions**, sem configuração de Hosting, para reduzir risco de publicar no canal live.
- Testes de segurança verificam aprovação não autorizada, lista de empresas permitidas e ausência de Hosting nessa configuração.

### Verificações obrigatórias antes de ativar (NÃO executadas)

1. Confirmar no Console do Firebase as regras **efetivamente implantadas**, as empresas existentes, quem tem acesso administrativo e os custos/limites. Backup antes de mudar qualquer regra.
2. Validar no Firestore Emulator os testes de isolamento e negação de escrita direta.
3. Provisionar um administrador `admin_toaki` por meio confiável, com e-mail verificado, evitando a autoatribuição de privilégios.
4. Verificar identidade e autorização documental da primeira empresa, calcular o identificador interno `empresa_<CNPJ>`, configurar no backend a habilitação `TOAKI_PILOTO_NO_ORIGINAL=habilitado` e a lista `TOAKI_PILOTO_EMPRESAS` somente para o CNPJ aprovado. Não divulgar essas configurações como se fossem uma autorização concedida ao navegador.
5. Revisar diffs das regras atuais x regras existentes, funções e migração; com autorização específica, implantar **apenas** Functions e Firestore. A configuração `firebase.piloto.json` não inclui Hosting. O comando de implantação deve usar `--project toaki-cf058`, o escopo `--only firestore:rules,functions:analisarCadastroEmpresa,functions:operarEmpresaHomologacao` e aprovação operacional antes de executar.
6. Publicar somente um build de **Preview** com `VITE_TOAKI_ENV=piloto`, `VITE_TOAKI_PILOTO_NO_ORIGINAL=habilitado` e, se o endpoint de aprovação estiver validado, `VITE_ENABLE_ADMIN_APPROVAL=true`. Nenhum desses valores substitui validação no servidor.
7. Solicitar cadastro com e-mail verificado, conferir análise no admin, testar que outro usuário não aprova, e finalmente gravar/consultar os quatro tipos de registro. Testar persistência após novo login e negar leitura entre empresas.

### Proteções adicionais

- O PR desta etapa continua em **rascunho** e parte do PR #5. Não fazer merge nos branches principais.
- Não ativar o backend no Firebase existente antes de conferir Auth, rules implantadas, backups, papéis e permissões IAM.
- O piloto deve começar com dados autorizados e de preferência fictícios; evitar documentos fiscais verdadeiros até homologação concluída.
- Sem confirmação explícita da publicação, não afirmar que há cadastros persistentes na versão online.
