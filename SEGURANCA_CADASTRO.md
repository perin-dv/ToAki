# toAki — auditoria do cadastro e senhas | Fase A/B

## Estado real
- O login e criação de conta usam **Firebase Authentication**, não um banco de senhas criado por nós.
- Senha nunca é registrada no Firestore, no projeto GitHub, em logs, nem na lista de empresas.
- O indicador visual fraca/vermelho, média/amarelo, forte/verde ajuda o usuário; **não representa uma garantia de segurança**.
- O front-end exige pelo menos 12 caracteres, confirmação idêntica, bloqueia sequências triviais, informações do usuário e senhas óbvias. Senha média ou forte permite criar a conta.
- **Configurar a política de senhas no Firebase Authentication (Enforce) também é obrigatório.** Validação do navegador pode ser contornada; o servidor deve impedir senhas abaixo do mínimo. Conferir Authentication > Settings > Password policy antes de ativar cadastro real.
- O login aceita senhas antigas definidas no Firebase; não impomos retroativamente as novas regras ao entrar. Para atualizar, usar o fluxo de redefinição por e-mail do Firebase.
- A recuperação de senha usa mensagem genérica para evitar confirmação explícita da existência de e-mails.

## Segurança de empresa
- Consulta de CNPJ na BrasilAPI **não comprova propriedade** nem autorização do solicitante.
- Solicitação empresarial exige e-mail verificado, UID do próprio usuário, CNPJ validado e confirmação explícita do responsável.
- A função `functions/index.cjs` exige **admin_toaki com e-mail verificado no token**, nunca aceita concessão de privilégios declarada pelo cliente.
- A aprovação exige justificativa de no mínimo 15 caracteres e confirmação documental realizada externamente.
- O backend valida cadastro novamente, verifica o e-mail no Authentication, reserva CNPJ atomicamente (evita empresas duplicadas), cria empresa e funcionário e grava auditoria.
- Atualiza a custom claim `dono_empresa` após confirmar a operação. Se a atualização de claim falhar, a solicitação pode ser reprocessada por administrador; a empresa não é recriada.
- O solicitante comum não consegue alterar status ou permissões pelo Firestore.
- O botão de aprovação do admin fica **desligado** no preview por `VITE_ENABLE_ADMIN_APPROVAL=false`.

## Preparação antes de ativar Cloud Functions (não concluída)
1. Revisar regras de Firestore realmente implantadas no projeto e a configuração Web Firebase (valores da Web App), sem publicar chaves privadas.
2. Garantir que o operador admin tenha o papel `admin_toaki` atribuído por Admin SDK/ambiente privilegiado, nunca por e-mail fixo no cliente.
3. Proteger login de administradores com MFA, e testar Auth/claim com contas diferentes.
4. Habilitar Firebase Authentication Password Policy no modo **Enforce** para comprimento mínimo de 12; escolher limites compatíveis e revisar usuário de teste legado.
5. Considerar proteção contra abuso: Firebase App Check, monitoramento de tentativas de cadastro/login, alertas de anomalias, limites de API e auditoria dos eventos administrativos.
6. Verificar contas de serviço e permissões mínimas, inclusive o secret `FIREBASE_SERVICE_ACCOUNT_TOAKI_CF058` usado **somente** pelo GitHub Actions de Hosting. Nunca colocar JSON em `public` ou `src`.
7. Implantar/testar a Cloud Function em etapa **separada e autorizada**. O workflow de Preview publica **apenas Firebase Hosting**.
8. Habilitar `VITE_ENABLE_ADMIN_APPROVAL=true` **somente** depois do backend implantado, autorização do admin confirmada e testes de idempotência, concorrência, rejeição e auditoria.

## Atenção: Preview Hosting não é ambiente isolado para dados
O canal `fase-a` do Firebase Hosting usa outra URL e não substitui o site ao vivo. Porém, **ele compartilha o mesmo Firebase Authentication e Cloud Firestore do projeto `toaki-cf058`**. O cadastro de usuário ou uma solicitação CNPJ de testes pode criar dados reais no mesmo projeto. Para isolamento integral de dados, precisamos de um **segundo projeto Firebase dedicado a testes** com Auth/Firestore próprios.

## Critérios de validação
- [x] Verificação visual de senha fraca/média/forte; confirmação e mostrar/ocultar em front-end (código e testes automatizados; publicação depende do Actions).
- [x] Backend da aprovação **preparado em código**, com segurança e auditoria; não implantado.
- [x] Firestore rules em Git com bloqueio default-deny e testes com emulador.
- [ ] Confirmar senha forte no Firebase Authentication Server Enforce.
- [ ] Verificar configurações atuais de Auth/Firestore do projeto.
- [ ] Fazer validação real (duas contas de testes e admin) sem usar dados comerciais de clientes.
- [ ] Publicar e proteger backend após autorização independente.
