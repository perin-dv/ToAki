# Fase A — Entregas técnicas

## Primeira implementação em branch `feature/fase-a-base-react`
- React 19 + TypeScript + Vite, componentes isolados e rotas.
- Login por e-mail/senha, criação de conta cliente, verificação de e-mail, recuperação de senha e logout via Firebase Authentication (funcionam apenas após habilitar E-mail/senha no console).
- Guardas de rota baseadas em **custom claims atribuídas por backend confiável**. Nunca permitir escolher `admin_toaki` ou `dono_empresa` na interface.
- Portal do cliente sem dados fictícios; a vinculação entre cliente e NF virá de backend seguro em fase posterior.
- Consulta informativa de CNPJ por BrasilAPI. Solicitação de cadastro em `solicitacoes_cadastro_empresas` com título legível, aguardando verificação. A aprovação ainda NÃO está implementada.
- Firestore com regras iniciais default-deny; um usuário verificado só pode criar/ler **sua própria solicitação**, sem atualizar/aprovar.
- Página `/demonstracao` preserva mapa e notas **fictícios**, separados das áreas autenticadas.
- Layout híbrido e logo oficial.

## Passos pendentes no console Firebase (não foram executados)
1. Firebase Console > Authentication > Sign-in method > ativar **E-mail/senha**.
2. Firebase Console > Firestore Database > criar banco na região aprovada; NÃO usar regras abertas para teste. Escolher ambiente de teste separado antes de armazenar dados reais.
3. Após revisão do PR e autorização, publicar **Security Rules** `firestore.rules` no projeto escolhido antes de habilitar solicitações. Não há regras em produção até o deploy.
4. Configurar domínios autorizados em Authentication e verificar e-mail de entrada/recuperação.
5. Não atribuir custom claims manualmente no navegador. Depois faremos processo administrativo com Cloud Functions/Admin SDK e auditoria.

## Limitações desta entrega
- Esta fase não cria automaticamente serviços do Firebase no console.
- Login e solicitação só funcionarão quando Authentication e Firestore estiverem habilitados.
- Não existem entregas, GPS, app Android ou comprovantes reais.
- Não há concessão automática de acesso por CNPJ.
- CNPJ alfanumérico exigirá adequação e testes futuros; validação inicial cobre CNPJ numérico tradicional.
- Não há indicação de que ambiente de teste/produção esteja separado; isso precisa ser resolvido antes de operar comercialmente.

## Testes
GitHub Actions exige build TypeScript, testes estruturais e `dist/index.html`. Ao confirmar execução, atualizar os checkboxes no `PLANO_MVP.md`.
