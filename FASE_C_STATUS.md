# toAki — Fase C (incremento inicial) — App do entregador + GPS seguro

**Estado:** código de teste em branch; sem deploy de Cloud Functions, Firestore ou Hosting. Os PRs #4/#5/#6 e o Preview original permanecem protegidos.

## O que foi implementado no código

1. Backend `functions/rastreamento.cjs` (Firebase Functions V2, região southamerica-east1):
   - `criarConviteEntregadorPiloto`: gestor cria convite de uso único com token aleatório longo, hash persistido e validade de 24 horas.
   - `aceitarConviteEntregadorPiloto`: usuário autenticado e com e-mail confirmado aceita o convite e recebe vínculo/papel `entregador` por Admin SDK. Não pode escolher o próprio cargo. O mesmo convite pode ser reenviado pelo próprio recebedor após falha de atualização de claims.
   - `iniciarEntregaPiloto`: empresa inicia NF pendente com entregador que vinculou seu aplicativo; cria tarefa privada para a conta do motoboy.
   - `enviarGpsEntregaPiloto`: salva localização **somente** da NF atribuída, em rota, com empresa e vínculo ativos, precisão de até 200m e no máximo uma atualização a cada 10s pelo backend; registra posição atual e histórico técnico.
   - `concluirEntregaPiloto`: encerra uma entrega própria e impede novos envios de GPS; remove a última posição do pedido.
2. Aplicativo web/PWA no caminho `/entregador`: cadastro por convite, lista das próprias entregas, permissão de GPS somente após botão explícito, Pausar, mensagem de última atualização, conclusão. Pausa ao ocultar a página, sem rastreamento oculto.
3. Painel operacional já existente: botão gerar convite no cadastro de entregadores, selecionar aplicativo conectado, iniciar rota e abrir a última posição da NF no mapa.
4. Testes unitários de validação de convites, latitude/longitude, precisão, status e taxa; testes de interface para login, consentimento e celular.

## Privacidade, segurança e limites

- A arquitetura usa o **mesmo Firebase Blaze `toaki-cf058`**, mas continua **desabilitada por padrão**, protegida por `TOAKI_PILOTO_NO_ORIGINAL`, `TOAKI_PILOTO_EMPRESAS`, permissões e vínculo por empresa.
- Nunca publicar as Functions antes de verificar regras instaladas, autorização da primeira empresa, backups, faturamento, links e teste emulators.
- O GPS não é iniciado ao entrar no app nem após aceitar um convite; só começa quando o motorista escolhe uma entrega em rota e toca no botão.
- A versão PWA usa `navigator.geolocation.watchPosition`, que necessita HTTPS/permissão e funciona apenas enquanto a página está ativa/visível. **Não garante rastreamento em segundo plano nem com a tela apagada.** O aplicativo Android dedicado com serviço de localização em primeiro plano e notificação permanente é a próxima implementação para continuidade de rota.
- Coordenadas são dados pessoais. Guardar histórico no mínimo necessário; os documentos possuem `expira_em` para TTL, mas o recurso de expiração automática do Firestore precisa ser habilitado e validado antes de uso real.
- A posição mais recente é visível à empresa autorizada; não existe página pública de cliente nesse incremento.
- Não existe comprovante de entrega autêntico, foto/assinatura, ETA, planejamento de múltiplas paradas ou integração com mapa de rotas. O botão de concluir do piloto **não substitui** comprovante formal.

## Sequência antes de iniciar testes reais

1. Validar CI completo (npm test, Emulator, build TypeScript, Playwright) e revisar permissões/segurança de convite.
2. Backup e conferência das regras realmente implantadas no Firestore original; testar autorização de gerente, outra empresa, cliente e motoboy, inclusive revogação de vínculos e convites usados.
3. Provisionar um administrador e empresa piloto revisados, ligar flags **somente** no ambiente de backend e construir Preview piloto com variáveis aprovadas. Nenhum deploy no canal live.
4. Sob autorização explícita do responsável, publicar só Firestore Rules e Functions após revisão. Testar em aparelhos reais o recebimento de convite, atribuição, GPS, painel e parada.
5. Próxima subfase: link público por token de curta duração e escopo de NF, revogação/expiração e visualização protegida do cliente.
6. Próxima subfase: comprovante fotográfico, assinatura e histórico consistente; em seguida, app Android nativo de entregador para rastreamento confiável em segundo plano.
7. Depois: mapa real, atualizações em tempo real, previsão de chegada e relatórios.

**A Fase C não é considerada concluída nem implantada; este é o primeiro incremento de integração entre empresa, motoboy e GPS.**
