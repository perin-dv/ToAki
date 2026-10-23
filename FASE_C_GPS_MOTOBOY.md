# toAki — Fase C (início): GPS do motoboy no aparelho

## Objetivo aprovado
Rastreamento ao vivo de entregas para empresas e clientes, preservando interface branca profissional, menu lateral preto e marca laranja. Modelo híbrido PWA para motoboy e painel web para empresa.

## O que está implementado nesta branch
- Rota mobile `/motoboy` **protegida pelo Firebase Authentication** e por `role=entregador` das claims assinadas. Sem login ou cargo, a tela não é liberada.
- Após login de um entregador autorizado, acesso direcionado para `/motoboy`; há atalho no `/inicio` desse perfil.
- Botão explícito **Ativar GPS neste aparelho** com `navigator.geolocation.watchPosition`, alta precisão, atualização local contínua e tratamento de permissão negada, timeout e indisponibilidade.
- Validação da precisão aproximada (até 200 metros) e idade da leitura (até 60 segundos); exibição de latitude, longitude, horário e precisão.
- Botão **Desligar GPS** e limpeza de `watchPosition` ao sair da tela, fechar componente, sair da conta ou colocar o app em segundo plano. No PWA o navegador pode pausar o GPS ao bloquear a tela.
- Abertura voluntária da posição no Google Maps (informa que os dados são compartilhados com o Google quando o usuário abre).
- Nenhum dado de localização é enviado ao Firestore, a APIs externas ou a clientes automaticamente. A UI destaca que o recurso é **prévia local do GPS**, não rastreamento em tempo real publicado.

## Proteção de produção
Esta branch não altera `firestore.rules`, Cloud Functions, Hosting, dados, claims, permissões de terceiros nem landing principal. Não foi feito deploy. GPS não funciona em produção até um Preview revisado e implantação autorizada.

**Importante:** ainda não há associação confiável entre um login de entregador (`uid`) e os cadastros `empresas/{empresaId}/entregadores_vinculados/{id}`. Esses registros possuem nome/telefone/veículo, mas não comprovam a identidade do entregador. NÃO permitir gravação de GPS ao confiar apenas em nome ou número de celular.

## Próxima etapa — rastreamento real
1. Preparar convite ou vínculo administrado entre a conta `entregador` no Firebase Auth e o cadastro de motorista autorizado na empresa (`uid` sem autoatribuição).
2. Vincular o motorista às NFs com status `em_rota`, usando atribuição validada pelo servidor.
3. Adicionar documento de localização separado por empresa e entregador, com escrita exclusiva da conta do motoboy enquanto existe entrega ativa; validar campos, precisão, atualização máxima e timestamp por regras **testadas no emulador**.
4. Implementar leitura em tempo real no painel empresarial por `onSnapshot` e link do cliente com escopo limitado à própria entrega (nunca compartilhar toda a frota).
5. Adicionar opção de parar compartilhamento ao concluir/cancelar a rota, com política de retenção, consentimento e bloqueio da localização quando não há pedido ativo.
6. Validar tudo em ambiente de Preview; não mexer em Hosting `live`.

## Estado e validação
- Código disponível em branch separada `feature/fase-c-gps-motoboy-inicial`; não houve merge para `main`.
- `tests/gps-motoboy.test.cjs` adiciona testes estáticos de controle de acesso, consentimento e ausência de transmissão automática.
- Testes e compilação **ainda não executados** nesta branch, para não consumir GitHub Actions inadvertidamente. Rodar localmente `npm test` e `npm run build` antes do PR.
- Nenhuma função, regra ou GPS foi publicada.

## Pendência anterior da Fase B
O último deploy tentado, GitHub Actions [#40001069587](https://github.com/perin-dv/ToAki/actions/runs/40001069587), foi bloqueado por falta de `iam.serviceAccounts.ActAs` na conta `toaki-cf058@appspot.gserviceaccount.com` para a credencial de implantação. A resolução de IAM é independente da criação desta interface. Não repetir esse workflow enquanto houver bloqueio.
