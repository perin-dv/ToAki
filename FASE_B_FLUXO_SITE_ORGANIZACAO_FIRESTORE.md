# toAki — fluxo do site e organização legível do Firebase

**Escopo:** site empresarial (Fase B). Não inclui publicação do aplicativo de motoboy, rastreamento GPS ao vivo ou comprovante efetivo.

## Fluxo do site, na ordem
1. **Empresa autorizada:** usuário autenticado com vínculo ativo no Firestore.
2. **Clientes:** cadastrar nome, contato e endereço completo por CEP. Dados apenas da empresa.
3. **Veículos:** cadastrar placa e categoria.
4. **Entregadores:** cadastrar nome, contato e, se aplicável, veículo. Este cadastro **ainda não conecta a conta móvel/GPS**.
5. **Pedidos / NFs:** cadastrar número, cliente, entregador opcional, veículo e endereço de destino.
6. **Aguardando saída:** o registro entra com status interno `pendente`. A empresa pode vincular o entregador antes de avançar.
7. **Registrar saída (sem GPS):** a empresa atualiza para `em_rota`. Isso registra o status, **não liga GPS**.
8. **Link do cliente:** gestor pode gerar um convite privado com validade e resgate por conta verificada.
9. **Entrega registrada (sem comprovante):** a empresa altera status para `entregue`; comprovante real depende da etapa seguinte.
10. **Histórico, relatórios e consulta do cliente:** a empresa consulta NFs e auditoria; o cliente vê apenas entregas vinculadas ao próprio UID.

## Navegação hierárquica do Firestore
A documentação usa rótulos explicativos. Os nomes de coleção e os campos abaixo permanecem tecnicamente estáveis para não quebrar regras e acessos.

- **Empresas** (`empresas`)
  - **Empresa piloto Soma** (`empresa_teste_soma`)
    - **Clientes** (`clientes`): novos documentos `cliente_nome_sobrenome_sufixo` com `titulo_registro = Cliente — Nome`.
    - **Veículos** (`veiculos`): novos documentos `veiculo_ABC1D23` com `titulo_registro = Veículo — Moto · placa ABC1D23`.
    - **Entregadores** (`entregadores_vinculados`): novos documentos `entregador_nome_sobrenome_sufixo`, com nome visível.
    - **Notas fiscais** (`pedidos`): novos documentos `nf_000123` com `titulo_registro = NF 000123 — Cliente`. Campos: `numero_nf`, `destinatario_nome`, `entregador_nome`, `veiculo_placa`, `endereco_entrega`, `situacao_legivel`.
    - **Reservas de NF e placa:** preservam a unicidade por empresa e ganham título descritivo em novos registros.
    - **Histórico** (`historico`): eventos com `titulo_registro` legível. ID técnico mantido para evitar colisões.
    - **Links de rastreamento** (`links_rastreamento`): token de convite armazenado **apenas como hash**, nunca segredo legível.
    - **Comprovantes** (`comprovantes`): módulo de leitura; implementação segura de foto/assinatura ainda pendente.
    - **Funcionários** (`funcionarios`): IDs de autenticação Firebase permanecem técnicos por requisito de segurança.
- **Clientes autenticados** (`clientes/{uid}/entregas`): espelho privado de NF vinculado por backend, sem escrita direta pelo cliente.
- **Entregadores autenticados** (`entregadores/{uid}`): reservado para posterior vinculação da conta móvel e tarefa GPS.

## Compatibilidade e proteções
- **Nenhum documento existente será renomeado ou migrado.** IDs antigos continuam válidos; títulos legíveis já são usados pela interface.
- **Novos registros** usam IDs pesquisáveis. Nomes de pessoas recebem sufixo aleatório para não colidir; o sufixo não é documento de identificação.
- Campos técnicos `*_id`, `uid` e `status` são necessários para autorização, integridade, histórico e regras do Firestore. O painel apresenta os valores compreensíveis em português.
- Nenhum nome, status ou função privilegiada enviados pelo navegador são aceitos como fonte confiável pelo backend.
- Não mover subcoleções nem alterar `firestore.rules` nesta etapa.
- Usar **somente dados fictícios** na empresa `empresa_teste_soma`. Sem teste com dados reais de clientes ou motoboys.
- `main` protegida; publicar Functions e Preview **somente após revisão, CI e autorização**. Nunca atualizar Hosting live.

## Antes da Fase C — integração motoboy
Validar com dados de teste: cliente e veículo aparecem pelos nomes, NF por número; atribuição persiste; edição preserva IDs; transições de status exibem histórico; convite autentica o cliente; status do espelho atualiza; regras impedem leitura entre empresas. Só então adicionar o vínculo da conta do motoboy, GPS autorizado, status ao vivo e comprovante real.
