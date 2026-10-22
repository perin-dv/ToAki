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

## Continuidade do desenvolvimento da web — 22/10/2026

Novo incremento (PR #9, branch `feature/fase-b-busca-vinculos-crud`, baseado no PR #8):

- Busca em tempo real de clientes pelo nome, motoristas pelo nome e motos pela placa, com seleção por referência Firestore da empresa.
- Motorista vinculado a veículo; NF vinculada a cliente, motorista e veículo, com sugestão do endereço registrado do cliente.
- Edição de cadastros, desativação de registros não referenciados, atualização auditada da situação das entregas.
- Backend transacional confere associações e nega referências inexistentes, inativas, inconsistentes ou de outra empresa.
- As listas consultam o Firestore em tempo real; status e alterações também são auditados pelo servidor.
- **Ainda não implantado no projeto Firebase nem publicado no Hosting live.** A empresa piloto, administrador confiável, Rules e Functions precisam ser verificados e autorizados antes do teste real.
- Manter PR #7 (protótipo motoboy) em espera. Flutter somente após a web.
- Critérios de escala (busca remota/paginação acima de 100 registros) e conclusão de comprovantes, links, relatórios e cobrança continuam pendentes.

Documentação detalhada: `WEB_CADASTROS_VINCULADOS.md`.

## Revisão de continuidade — relatórios, assinatura e acesso (22/10/2026)

Incrementos do PR #9 ainda não implantados:
- Relatórios de NFs reais via `empresas/{empresaId}/pedidos`: filtros, resumo explicitamente limitado a 100 documentos consultados e exportação CSV.
- Consulta de planos `publicado=true` e assinaturas `empresa_id=... ` diretamente do Firestore, respeitando cargo de gestor. **Não existe checkout/pagamento integrado ainda.**
- Botão para atualizar permissões depois da aprovação administrativa, usando token renovado do Firebase Auth sem precisar desconectar a conta.
- Cadastros de motos, motoristas, clientes e NFs continuam a depender de ativação segura do backend no Firebase atual.
- **Pendente para implantação:** acesso administrativo autenticado às configurações remotas, estado das coleções, backup, empresa piloto, liberação de Functions e teste real. Não publicar live nem considerar pronto por CI isolado.
