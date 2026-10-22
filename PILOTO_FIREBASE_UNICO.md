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
