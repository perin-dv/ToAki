# toAki — Roadmap oficial de continuidade

Decisão confirmada em 22/10/2026: primeiro concluir o site web integrado ao Firebase; depois mapa real; somente após validação completa desenvolver o aplicativo Flutter do motoboy e, por último, completar o WebAdmin.

## Regras
- Preservar identidade toAki e layout aprovado.
- Projeto Firebase Blaze existente: toaki-cf058.
- Dados demonstrativos não podem aparecer como reais. A versão atual de /inicio ainda usa sessionStorage e mapa fictício.
- Manter demonstração isolada em /demonstracao; converter /inicio em painel operacional real.
- Não fazer merge em main/develop nem publicar Hosting live, Functions ou Rules sem verificação e autorização.
- PR #7 do motoboy fica em espera; o aplicativo definitivo será Flutter.

## Sequência web
1. Home /inicio com consultas reais e estados vazios, nunca contadores fictícios.
2. Aprovar empresa, validar funcionários e separar permissões por empresa.
3. CRUD persistente de clientes, veículos, entregadores e notas fiscais.
4. Atribuição de NFs, alterações seguras de status e auditoria.
5. Mapa com endereços verdadeiros; nenhuma posição GPS falsa.
6. Comprovantes, histórico, relatórios, links para clientes, planos e cobrança.
7. Testes end-to-end, homologação, revisão de segurança e publicação autorizada.
8. Flutter para motoboy e, depois, WebAdmin completo.

## Critério de concluído
Cadastrar, editar, consultar e reabrir sessão mantendo dados Firestore; usuário de outra empresa não acessa nada; funcionamento desktop e celular comprovado; nenhuma simulação operacional apresentada como real. Cada etapa deve registrar resultado do CI, pendências e próximo passo.
