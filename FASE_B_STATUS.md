# Fase B — Primeiro incremento demonstrável (entregadores, veículos e notas)

## Implementado nesta etapa
- Cadastro, edição e exclusão de **entregadores fictícios**; vínculo entre entregador e veículo.
- Cadastro, edição e exclusão de **veículos fictícios** (Moto, Carro, Van), validação de placa e proibição de duplicidade.
- Cadastro de **nota fiscal/pedido fictício** com número, destinatário, destino e entregador responsável.
- Regras de movimentação de status: `Aguardando coleta → Em rota → Entregue` ou `Cancelada`; não iniciar rota sem entregador.
- Busca, lista de notas, mapa **apenas ilustrativo**, contadores por status, histórico de eventos **somente fictícios** e painel de comprovantes demonstrativo.
- Regras de consistência: não excluir entregador enquanto usado por NF; não excluir veículo em uso; não duplicar numeração de NF na simulação.
- Interface responsiva para desktop e celular, sem perder login obrigatório da Fase A.
- Testes automatizados Chromium para fluxos de cadastro, atribuição, mudança de status, navegação móvel, persistência temporária e reinicialização.

## Proteção do projeto original
- Fonte: somente `feature/fase-a-base-react`, PR #4 em rascunho.
- Deploy: exclusivo do Firebase Hosting Preview Channel `fase-a`. Não usa o canal `live`.
- **NÃO** há gravações de entregadores, veículos ou NFs no Firestore, Realtime Database, Storage, Cloud Functions ou backend.
- Dados novos da simulação ficam em **`sessionStorage` do navegador**, por aba, com chave vinculada ao usuário; são fictícios, não são sincronizados.
- O botão **Reiniciar simulação** apaga os registros temporários e restaura os exemplos.
- A autenticação usa Firebase Authentication do projeto compartilhado: apenas o front-end e dados simulados estão isolados; criar contas de teste ainda pode criar usuários reais no projeto. Para isolamento total de Auth/Firestore, criar um projeto Firebase de homologação separado.

## Não considerar ainda concluído no MVP real
- B01/B02: CRUD em Firestore com permissões tenant; convites e validação de documentos ainda pendentes.
- B04/B05/B06: vínculo real de NF, empresa, filial, pedido, destinatário e múltiplas paradas; integração de ERP e autorização fiscal ainda pendentes.
- B07/B08: backend transacional para atribuição e estados, rastreio imutável e auditoria.
- GPS Android, ETA verdadeiro, comprovantes e links públicos permanecem pendentes.

## Próximo incremento sugerido
1. Separar o Firebase de homologação do projeto compartilhado.
2. Vincular empresa/filial aprovada e equipe com convites com validade.
3. Criar operações multitenant em backend seguro e as regras correspondentes com testes de isolamento.
4. Migrar os formulários demonstrativos para Firestore somente após testes e autorização de deploy de regras.

## Continuidade — piloto com o mesmo Firebase (22/10/2026)
- Decisão atual: utilizar `toaki-cf058` para um piloto controlado, sem criar novo projeto.
- Proteção preparada em branch própria; veja `PILOTO_FIREBASE_UNICO.md`.
- O backend só permitirá gravações no original com ativação manual, empresa aprovada e marcada como piloto e inclusão explícita na lista de empresas autorizadas.
- **Não foi executado deploy de Functions, alteração de regras ou migração.** A versão publicada continua com dados simulados.

## Incremento seguinte — aprovação controlada no Firebase Blaze (22/10/2026)
- Blaze confirmado pelo proprietário para o Firebase atual `toaki-cf058`.
- Preparado o caminho para solicitar cadastro empresarial no próprio projeto original, **somente em Preview habilitado manualmente**.
- O backend de aprovação administrativa recebeu proteção por ambiente, habilitação explícita e allowlist exata de empresa piloto, além das verificações já existentes.
- Foi criada `firebase.piloto.json` sem Hosting e adicionados testes para prevenir aprovação indevida.
- **Pendente:** validação CI e Firestore Emulator, conferir regras implantadas e dados atuais, administrador confiável e empresa piloto autorizada, revisão e implantação aprovada de Rules/Functions. **Sem deploy ou merge**.

## Prioridade oficial — site web antes de Flutter (22/10/2026)

Nova decisão do responsável registrada em `ROADMAP_SITE_OFICIAL.md`: terminar completamente a web, conectar Firestore e mapa real, validar, e **somente depois** fazer aplicativo Flutter para motoboy e WebAdmin completo. PR #7 de PWA/GPS motoboy colocado em espera; não integrar neste trabalho.

### Incremento preparado na branch feature/fase-b-site-firebase-real
- `/inicio` deixa de apontar para `DemoPage` e passa a `SiteOperacionalPage`. O simulador continua exclusivamente em `/demonstracao` (além de rotas isoladas de teste E2E).
- A tela operacional não usa `sessionStorage`, NFs de exemplo nem mapa SVG com marcadores inventados.
- Para empresa autorizada e ambiente operacional habilitado, NFs vêm diretamente de `empresas/{empresaId}/pedidos` via snapshot do Firestore. Contagens limitadas à amostra consultada e identificadas como tal.
- Consulta de endereço real em mapa externo ocorre após clique e é explicitamente rotulada como **mapa por endereço**, não GPS de motoboy.
- Navegação dos cadastros da web utiliza `EmpresaOperacao` real com aba inicial determinada pelo menu, preservando o design aprovado.
- Histórico, equipe e comprovantes consultam suas coleções reais, com controle de cargo; geração de comprovante continua **pendente**, não é simulada na operação.
- Usuário sem empresa autorizada recebe estado de acesso pendente, nunca visualiza entregas inventadas.

### Validações e pendências
- Testes de rota e UI preparados em `tests/site-operacional.spec.mjs`; resultado do GitHub Actions deve ser confirmado antes de dizer que passou.
- Não ocorreu implantação de Cloud Functions, Firestore Rules ou Hosting a partir desta branch.
- Próximas funcionalidades reais: cadastros empresariais e autorização piloto publicados e validados, CRUD completo e vínculos de equipe, edição/exclusão, transições de pedido, mapa definitivo com endereços geocodificados, comprovantes, links seguros para clientes, relatórios, planos e cobranças.
- Antes de qualquer deploy, consultar regras e dados atuais, backup, IAM, admin autorizado e lista de empresas piloto. `main`, `develop` e Hosting `live` continuam protegidos.
