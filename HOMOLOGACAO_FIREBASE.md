# toAki — Homologação real com Firebase separado

## Situação e proteção do original

- Projeto original: `toaki-cf058`.
- Preview atual (Fase A/B): `https://toaki-cf058--fase-a-go3l94zk.web.app`. Seu Hosting é separado, **mas o Authentication do projeto é compartilhado**.
- **Proibido utilizar o Firebase original para ensaios com dados de pessoas, clientes ou empresas reais.**
- Novo cadastro de usuários no preview original e solicitações empresariais foram bloqueados deliberadamente até a homologação independente.
- O novo backend `operarEmpresaHomologacao` **falha explicitamente** se o projeto em execução for `toaki-cf058` ou se o ID não puder ser identificado.
- A branch de testes `feature/fase-a-base-react` e o PR #4 continuam separados. Não aplicar merge nem deploy em `main` sem o aceite final.

## Criar o Firebase de homologação (necessário para testar com pessoas reais)

1. No Firebase Console, criar **um novo projeto Firebase**, com ID diferente de `toaki-cf058`. Exemplo ilustrativo: `toaki-homologacao-123` (usar o ID real que estiver disponível).
2. Registrar um aplicativo Web dentro desse novo projeto e copiar a configuração **Web SDK pública** (API key, authDomain, projectId, appId, messagingSenderId, storageBucket). Não confundir a API Key pública com a chave JSON privada de Admin SDK.
3. Habilitar Firebase Authentication por e-mail/senha, Firestore, Hosting e o plano de faturamento necessário às Cloud Functions. Configurar domínios autorizados do Auth para o domínio do preview do projeto novo.
4. Ativar política de senha mínima no servidor (12 caracteres, modo Enforce se disponível), controle de cotas, alertas de custo e proteção contra abuso; dar permissão mínima à conta de serviço de deploy.
5. Construir o Vite com `VITE_TOAKI_ENV=homologacao` e todas as variáveis `VITE_FIREBASE_*` apontando para **esse** projeto de homologação. Se a configuração estiver incompleta ou usar `toaki-cf058`, o aplicativo não permitirá cadastros operacionais ou de novos testadores.
6. Usar `firebase.homologacao.json` para publicar as regras `firestore.homologacao.rules`, as funções e o Hosting **somente** no projeto novo. Exemplo operacional (após conferir o projeto selecionado e autorizar a publicação):
   ```powershell
   npm.cmd install
   npm.cmd run build
   firebase.cmd deploy --config firebase.homologacao.json --project ID_HOMOLOGACAO_REAL --only firestore,functions,hosting
   ```
   **Não execute** esse comando com o projeto `toaki-cf058`.
7. Prover um primeiro administrador de homologação por SDK confiável, com `role=admin_toaki`, e-mail confirmado e MFA. Nunca atribuir cargo por simples edição no navegador.
8. Criar a empresa real em homologação e aprovar a solicitação com revisão documental. A aprovação cria a empresa e assina a claim `empresa_id` para o proprietário. Usuários da empresa devem entrar novamente para renovar os tokens.
9. Só depois convidar testadores. Informar que é homologação, obter autorização para tratamento de dados, evitar dados sensíveis desnecessários e fornecer canal de suporte e limpeza ao fim do piloto.

## O que já existe no código para dados reais

- `functions/operacao-politica.cjs`: valida nomes, placas, telefones, endereços, destinatários e NF; rejeita alteração de cargo, status, campos desconhecidos ou pedidos fora do esquema.
- `functions/operacoes.cjs`: Cloud Function com login e e-mail verificado, vínculo ativo com empresa, autorização de gestor ou vendedor, reserva única de placa e NF, criação transacional e auditoria. **Não foi publicada.**
- `src/lib/operacaoEmpresa.ts`: cliente tipado, leitura limitada por empresa e gravação via Cloud Function, bloqueado fora da homologação.
- `src/pages/EmpresaOperacao.tsx`: primeiros formulários reais de clientes, entregadores, veículos e NFs na conta empresarial, visíveis somente se homologação estiver configurada e usuário com vínculo ativo.
- `firestore.homologacao.rules`: regras deny-by-default. Permite leitura somente a funcionários autorizados. Escritas operacionais só via backend confiável.
- Ainda não estão concluídos: edição, cancelamento e entrega real, GPS, comprovante autêntico, convites de funcionários, pagamento e exportação fiscal.

## Cenários de testes com pessoas reais

- Login e cadastro de cliente no Firebase independente; recuperação de senha e verificação de e-mail.
- Tentativa de acesso sem login à empresa e tentativa de cliente ver empresa alheia — **devem ser negadas**.
- Aprovação empresarial documentada e reentrada no aplicativo para atualizar cargo.
- Gestor cadastra cliente, entregador e veículo; operação precisa aparecer somente na empresa autorizada.
- Vendedor cria nota vinculada a um cliente e não consegue alterar funcionários ou conceder papel administrativo.
- Duplicidade de placa e NF na mesma empresa **deve ser bloqueada**. Outra empresa não pode ler seus documentos.
- Auditoria das operações deve manter responsável, horário e registro referenciado.
- Se qualquer teste afetar o Firebase original, **interromper e investigar antes de prosseguir**.

## Publicação

O GitHub Actions atual `firebase-preview-fase-a.yml` só publica Hosting no Preview Channel do projeto original. Não publica regras de Firestore ou Functions. Portanto, a implantação de homologação é uma etapa independente, condicionada à criação de novo projeto, configuração Web correta e autorização de deploy.

> Observação: a nova versão do painel **Minha conta** já usa o Firebase Authentication conectado para consultar e atualizar nome e enviar redefinição de senha quando solicitado; ainda não é um ambiente isolado para testes externos. Ao migrarmos o app para a homologação, essas operações passarão a atuar nas contas de teste independentes.
