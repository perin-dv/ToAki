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
