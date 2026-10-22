# toAki — Site empresarial: veículos, motoristas e NFs vinculados

**Data:** 22/10/2026
**Base:** `feature/fase-b-site-firebase-real` (PR #8)
**Situação:** desenvolvimento em branch, sem implantação no Firebase original.

## Fluxo operacional implementado em código

1. Empresa aprovada abre o site com a mesma conta do Firebase Authentication.
2. Cadastra moto/veículo (placa e categoria). A gravação é feita por Cloud Function autorizada e registrada no Firestore da empresa.
3. Cadastra motorista e seleciona veículo já registrado, pesquisando pela placa.
4. Cadastra cliente por nome e endereço completo com CEP.
5. Ao criar NF, busca cliente por nome, motorista por nome e moto por placa. Seleciona **registros reais por ID** (não simples texto digitado), e o endereço do cliente é sugerido como destino. O motorista pode trazer sua moto vinculada automaticamente; não se permite vínculo inconsistente.
6. As listas usam `onSnapshot` do Firestore para aparecerem em outras sessões/dispositivos autorizados. A busca de cada lista filtra os dados consultados.
7. Gestores podem editar registros e desativar cadastros sem vínculos; campos críticos de NF e placa não podem ser trocados arbitrariamente.
8. Gestores e vendedores autorizados podem editar NF pendente e progredir status `pendente -> em_rota -> entregue` ou cancelar (com histórico do servidor).

## Proteções

- Os dados são separados em `empresas/{empresaId}/...`, sujeitos a verificação de conta/e-mail, papel e funcionário ativo, empresa aprovada e allowlist de piloto.
- Veículo, cliente e motorista selecionados são lidos **dentro da transação do Firestore**; servidor recusa referências inexistentes, inativas ou incompatíveis.
- Atualização de status, edição, desativação e auditoria são feitas **somente por Cloud Function**. Firestore Rules bloqueiam escrita direta do navegador.
- Desativação de cliente, motorista ou veículo é negada quando houver vínculo com NFs ou outros cadastros, preservando referências e histórico.
- UI não exibe nomes/placas fictícias como registros operacionais.
- O painel continua com limite inicial de 50 NFs e as listas do formulário consultam até 100 registros; paginação e busca server-side são pendentes para escala.
- Entrada de dados não garante localização GPS: mapa no painel usa o endereço; GPS em movimento depende de fase posterior Flutter.

## Para considerar funcionalidade realmente disponível

- Conferir a configuração atual **efetivamente implantada** do Firestore e das Functions, com backup.
- Confirmar administrador `admin_toaki` emitido pelo servidor, empresa piloto autorizada, CNPJ, proprietário e políticas IAM.
- Revisar o plano de custo Blaze, transações, leitura de múltiplas coleções e limites.
- Rodar CI, emuladores, teste negativo de empresa diferente, persistência após sair e entrar, atualização em outra aba e transições.
- Somente com confirmação da segurança e aprovação explícita do responsável publicar Rules/Functions e Preview operacional. Hosting live não é usado.
- Entregar um link de Preview **confirmado**, não inferido, para o responsável validar.
- Cadastros atuais demonstrativos em `sessionStorage` não migram automaticamente para o Firestore.

## Próxima ordem após esta entrega

Ativar ambiente piloto de forma controlada e validar cadastro real com dois acessos; conectar comprovantes reais, links cliente, histórico/relatórios completos e planos; validar e depois publicar o site completo. Só depois seguir Flutter e WebAdmin completo. O PR #7 permanece em espera.
