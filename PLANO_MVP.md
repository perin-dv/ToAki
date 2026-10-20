# toAki — PLANO MESTRE DO MVP

> Documento central para acompanhar o que já existe e o que ainda precisa ser construído.  
> **Atualização inicial:** 20/10/2026.  
> **Regra:** marque [x] apenas depois da implementação, teste e verificação; uma tela demonstrativa não significa função real.  
> **Fonte de verdade:** este arquivo na branch `develop`, sincronizado com `main` só após aprovação. As marcações experimentais da Fase A estão por enquanto na branch `feature/fase-a-base-react`.

## 0. Definição do produto

**Objetivo:** empresas cadastrarem notas fiscais, pedidos e entregas, associarem a motoboys próprios ou terceirizados, acompanharem suas posições em mapa e oferecerem acompanhamento e comprovante ao destinatário que comprou a peça.

**Quatro interfaces do mesmo sistema:**
- **Empresa (Web/PWA):** dono, gestor e vendedor; cadastra pedidos, equipes, veículos, rotas e vê GPS ao vivo.
- **Cliente final (Web/PWA):** mecânico, eletricista, oficina ou comprador; faz login, encontra somente suas entregas autorizadas e acompanha nota/pedido no mapa.
- **Entregador (Android/Kotlin):** faz login, recebe/aceita entregas, confirma coleta, ativa rastreamento GPS, conclui e envia comprovante.
- **Administrador toAki (Web/PWA):** aprova empresas, configura planos, controla assinaturas, monitora serviços e dá suporte limitado e auditado.

**Limites do MVP:** entregar e rastrear via celular do entregador. Transportadoras terceiras SEM acesso ao nosso aplicativo exigirão API/rastreador externo: **integração posterior**, salvo se houver acordo de integração já na fase piloto. A NF é **identificador comercial**, não um dispositivo de localização.

**Identidade:** marca oficial do usuário, preto / carvão, laranja degradê e branco; layout híbrido = barra lateral escura + painel/ mapa claro + versão responsiva. Painel empresa com mapa prioritário.

## 1. Inventário: situação real agora

- [x] Repositório GitHub `perin-dv/ToAki` criado.
- [x] Branches `main` e `develop` definidas; `main` protegida por ruleset e testes de PR.
- [x] Firebase **projeto** `toaki-cf058` criado pelo proprietário.
- [x] Firebase Hosting configurado no repositório para publicar `dist`.
- [x] Protótipo estático de painel empresa com 8 módulos, dados fictícios e mapa ilustrativo.
- [x] Logo oficial incorporada ao front-end do GitHub.
- [x] Tema híbrido na **`develop`** (menu escuro + conteúdo claro), sem merge/deploy.
- [x] GitHub Actions de build e testes mínimos configurados; os testes serão reexecutados após alterações.
- [x] Migração inicial para React + TypeScript + Vite com módulos, testada na branch `feature/fase-a-base-react` (ainda sem Merge/deploy).
- [ ] Tela de login real, contas e permissões reais.
- [ ] Cadastro real de empresa e consultas de CNPJ.
- [ ] Firestore, Realtime Database, Storage e Rules implementados.
- [ ] Rastreamento GPS Android real e mapa real.
- [ ] Consulta autenticada do cliente final e links públicos.
- [ ] Comprovantes reais, relatórios reais e assinaturas reais.
- [ ] Versão híbrida aprovada e publicada no Hosting (**não** feita neste ajuste).

## 2. Fase A — Fundamentos, cadastro e autenticação (bloqueia o restante)

### Front-end e acesso
- [x] **A01** Migrar o protótipo para React + TypeScript + Vite e separar páginas, estilos, serviços e componentes (compilação GitHub Actions aprovada; PR #4 em rascunho).
- [ ] **A02** Definir rotas `/empresa`, `/cliente`, `/admin` e fluxo de login/convite; layouts responsivos, PWA instalável para empresa e cliente.
- [ ] **A03** Integrar Firebase SDK do projeto `toaki-cf058`; separar ambientes de teste/produção antes de trabalhar com dados reais.
- [ ] **A04** Habilitar Firebase Authentication (e-mail/senha, verificação de e-mail, redefinição, logout e sessões); controlar tentativas de abuso.
- [ ] **A05** Implementar autorização no servidor/regras: papéis `admin_toaki`, `dono_empresa`, `gestor`, `vendedor`, `entregador` e `cliente`.
- [ ] **A06** Criar Firestore e suas Security Rules em *deny by default*; testes com emuladores para isolamento entre empresas.
- [ ] **A07** Criar convite de funcionário por e-mail com validade, aprovação e revogação; gestor limitado à sua empresa e filial.
- [ ] **A08** Criar logs de auditoria para criação/alteração/exclusão de empresa, usuários, pedidos, atribuição e comprovantes.

### Empresa
- [ ] **A09** Formulário de CNPJ + razão social, nome fantasia, situação cadastral, telefone, e-mail corporativo, filial e endereço.
- [ ] **A10** Validar CNPJ (incluindo padrão alfanumérico quando aplicável), consultar **BrasilAPI** para pré-preenchimento e permitir edição/confirmar dados.
- [ ] **A11** Oferecer consulta oficial da Receita Federal como conferência; lidar com indisponibilidade/limite da API.
- [ ] **A12** **Verificar vínculo do solicitante com o CNPJ**: consulta pública não autoriza automaticamente alguém a administrar uma empresa.
- [ ] **A13** Cadastro de filiais, horários, endereços e permissões segregadas.
- [ ] **A14** Auto-preenchimento opcional de CEP via ViaCEP com confirmação do número/complemento pelo usuário.

**Critério de aceite:** proprietário da empresa cria conta, confirma e-mail e cadastro, convoca vendedor; vendedor entra e vê apenas dados da empresa/filial autorizada. Um usuário de outra empresa recebe *acesso negado*.

## 3. Fase B — Entregadores, veículos, pedidos e notas fiscais

- [ ] **B01** Cadastro de motoboy, motorista e transportador: nome, contato, vínculo com empresas, status operacional.
- [ ] **B02** Cadastro de veículo: categoria, placa (opcional conforme necessidade), descrição/código interno; evitar expor dados excessivos ao cliente.
- [ ] **B03** Convite/vinculação com uma ou mais empresas; entregador só recebe suas tarefas autorizadas.
- [ ] **B04** Cadastro de NF/pedido com empresa, filial, número, série, chave de acesso **se necessário**, destinatário, endereço e observações.
- [ ] **B05** Importação de NF manual no MVP; XML e integração ERP/SEFAZ ficam para etapa posterior; **não afirmar emissão ou validação fiscal**.
- [ ] **B06** Uma rota pode ter várias entregas/notas; permitir destino e status separados por pedido.
- [ ] **B07** Atribuição, aceite e reatribuição de motorista com trilha de auditoria.
- [ ] **B08** Máquina de estados: `aguardando_atribuicao`, `aguardando_coleta`, `coletado`, `em_rota`, `entregue`, `tentativa_falhou`, `cancelado`; bloquear transições indevidas.
- [ ] **B09** Busca por número da NF+empresa+série, número do pedido, destinatário autorizado, motorista, veículo e período.
- [ ] **B10** Formulários com validação de endereço, tratamento de duplicidade e notificações da operação.

**Critério de aceite:** vendedor cria NF/pedido e atribui ao motoboy; uma NF de mesma numeração em outra empresa permanece isolada; várias NFs no mesmo veículo funcionam sem duplicidade.

## 4. Fase C — Aplicativo Android e GPS real (núcleo do negócio)

- [ ] **C01** Criar módulo Android Kotlin/Jetpack Compose em diretório separado, com a mesma identidade toAki.
- [ ] **C02** Firebase Authentication do entregador, lista de tarefas, aceitar/recusar conforme permissão e confirmar retirada.
- [ ] **C03** Integrar Google Play services Fused Location Provider ou equivalente e mostrar precisão, bateria e GPS desligado.
- [ ] **C04** Serviço de localização em primeiro plano, com notificação visível, permissões Android corretas e rastreamento **somente** durante entregas autorizadas.
- [ ] **C05** Considerar políticas Android e Play Store para localização em segundo plano, explicar claramente coleta e oferecer parada.
- [ ] **C06** Enviar posição, timestamp, velocidade/precisão quando pertinente e indicador online/offline ao Firebase Realtime Database; escrita autenticada por entregador autorizado.
- [ ] **C07** Atualização parametrizável por movimento/intervalo, protegendo bateria, franquias, spam de GPS e qualidade do sinal.
- [ ] **C08** Modo offline: fila local segura para eventos essenciais e sincronização após reconectar, sem falsificar posição.
- [ ] **C09** Tela de navegação para destino, várias paradas e status atualizado sem voltar indevidamente à home.
- [ ] **C10** Testes Android físico: tela bloqueada, rede perdida, GPS negado, bateria fraca, Android encerrando serviço, viagem real e conclusão.

**Critério de aceite:** aparelho Android em rota com tela bloqueada envia coordenadas verificáveis com consentimento operacional, e empresa vê posição e horário da última atualização. Se GPS parar, painel mostra **posição antiga + aviso**, nunca "ao vivo" falsamente.

## 5. Fase D — Painel empresa e mapa real

- [ ] **D01** Exibir mapa real (provedor a definir) com marcadores de entregadores da empresa, diferenciando conectado/desconectado.
- [ ] **D02** Buscar NF e destacar entregador responsável, pedido, destino, última atualização e rota autorizada.
- [ ] **D03** Mostrar rua/endereço aproximado a partir do GPS por geocodificação reversa com orçamento e cache, quando licenciado.
- [ ] **D04** Calcular ETA com rotas/trânsito apenas quando dados suficientes; rotular estimativa e lidar com atraso.
- [ ] **D05** Múltiplos entregadores e rotas com muitas paradas; não confundir *posição do veículo* com *previsão de uma nota*.
- [ ] **D06** Alertas por entrega atrasada, GPS desatualizado, problema relatado e tentativa sem sucesso.
- [ ] **D07** Papéis e escopos: vendedor vê entregas autorizadas; gestor vê só empresa/filial pertinente; admin toAki não acompanha GPS sem finalidade de suporte autorizada.

**Critério de aceite:** funcionário consulta a NF em poucos segundos e informa ao comprador onde está a entrega, quando houve atualização e ETA disponível.

## 6. Fase E — Portal do cliente final (acrescentado ao MVP)

- [ ] **E01** Cadastro/Login **próprio** do cliente final (e-mail + senha, verificação de e-mail e recuperação). Pode ser PF ou PJ compradora.
- [ ] **E02** Página `Minhas entregas`: listar apenas entregas ligadas ao usuário/conta de cliente e ao seu vínculo de compra.
- [ ] **E03** Empresa vincula NF/pedido a destinatário por conta identificada, e-mail confirmado ou convite; para clientes empresariais, suportar usuários autorizados daquela oficina.
- [ ] **E04** Página `Detalhes da NF`: número/série, loja, status, horário, mapa **limitado à entrega**, ETA e comprovante autorizado.
- [ ] **E05** Buscar dentro das próprias entregas por NF/pedido. **Não permitir rastreio de qualquer NF digitada sem comprovação de vínculo.**
- [ ] **E06** Link temporário e aleatório emitido pela empresa para rastrear uma única entrega; expiração/revogação, acesso limitado e proteção contra enumeração.
- [ ] **E07** Cliente com compras em mais de uma empresa enxerga tudo na sua própria conta, **sem** ganhar acesso às outras entregas de cada empresa.
- [ ] **E08** Comunicação de coleta, saída para entrega, atraso e entrega concluída; notificações web opcionais após teste.
- [ ] **E09** Tela de instalação PWA no celular, adequada para usuário final.

**Critério de aceite:** mecânico da Soma faz login, encontra somente NF(s) vinculadas à conta dele, vê status/GPS autorizado e não consegue visualizar NF de outra pessoa.

## 7. Fase F — Comprovantes, histórico e relatórios

- [ ] **F01** Confirmar entrega no Android com data/hora, local, nome de quem recebeu e ocorrência alternativa.
- [ ] **F02** Foto ou assinatura quando necessário (consentimento/informação apropriados); armazenamento privado no Cloud Storage.
- [ ] **F03** Associar comprovante imutável à entrega; se houver correção, registrar nova versão e auditoria.
- [ ] **F04** Histórico filtrável por empresa, cliente autorizado, pedido/NF, motoboy, intervalo, status e filial.
- [ ] **F05** Relatórios: entregas realizadas, atrasos, tentativas, tempo médio, produtividade sem vigilância indevida.
- [ ] **F06** Exportar CSV apenas para perfis autorizados, com minimização de dados.
- [ ] **F07** Política de retenção e eliminação para GPS, comprovantes, dados de cliente, relatórios e backups.

**Critério de aceite:** entrega concluída deixa de aparecer em rota, gera comprovante e relatório; cliente visualiza seu próprio comprovante.

## 8. Fase G — Administração toAki e planos

- [ ] **G01** Portal exclusivo `/admin` com conta administrativa forte, MFA se aplicável e auditoria.
- [ ] **G02** Aprovar, suspender ou reativar empresas, gerenciar suporte e limites de acessos.
- [ ] **G03** Criar planos (ex.: piloto, básico, profissional), limites de entregadores simultâneos, usuários e uso.
- [ ] **G04** Implementar contrato/assinatura por empresa, renovação, períodos de teste e status de cobrança.
- [ ] **G05** Escolher provedor de pagamentos e implementar webhooks idempotentes antes de automatizar cobranças; **não confiar na tela de sucesso do navegador**.
- [ ] **G06** Controle de custos e uso por empresa: leituras, gravações, GPS, mapa, geocodificação, uploads e notificação.
- [ ] **G07** Suporte auditado, logs, backup/recuperação e estratégia de reversão de deploy.

**Critério de aceite:** uma empresa piloto opera com plano configurado; ao atingir limite ou vencimento, a regra é previsível e não causa perda de registros.

## 9. Fase H — Segurança, LGPD, teste e lançamento piloto

- [ ] **H01** Formalizar finalidade/base legal de rastrear entregadores, aviso de privacidade, transparência e direitos do titular.
- [ ] **H02** Validar isolamento multitenant por regras do Firestore/RTDB/Storage e backend seguro; teste automatizado de acessos cruzados.
- [ ] **H03** Restringir acesso por empresa, cliente, perfil e entrega; não confiar somente em controles do front-end.
- [ ] **H04** Rate limiting, App Check onde fizer sentido, validação de entrada, URLs protegidas, segredos fora do repositório.
- [ ] **H05** Backups, restauração testada, observabilidade, alertas de custo e procedimento de incidente.
- [ ] **H06** CI com testes unitários/integrados e emuladores Firebase; PR obrigatório e deploy somente após aprovação.
- [ ] **H07** Piloto real com 1 empresa, 1 vendedor, 1 destinatário e 1 motoboy; percurso físico e confirmação no Android.
- [ ] **H08** Piloto com múltiplas empresas: um usuário nunca vê dados privados da outra.
- [ ] **H09** Validar política Play Store e fazer build APK assinado quando o app do entregador estiver pronto.
- [ ] **H10** Publicar versão estável somente depois de validação dos critérios end-to-end.

## 10. Fluxos e perfis de usuário

### Fluxo da empresa
`Cadastro CNPJ + responsável → verificar empresa → criar filial → convidar vendedor/motoboy → cadastrar NF e destinatário → atribuir entrega → coleta → rota GPS → comprovante → relatório`

### Fluxo do cliente final
`Criar conta → verificar e-mail → aceitar vínculo de entrega → Minhas entregas → selecionar NF → status e mapa autorizado → comprovante`

### Fluxo do motoboy Android
`Login → disponível → visualizar entrega atribuída → confirmar coleta → iniciar rota/GPS → registrar parada/ocorrência → concluir com comprovante → GPS encerra`

### Fluxo do admin toAki
`Login restrito → verificar empresa → plano → monitorar saúde/custo/uso → suporte auditado`

## 11. Arquitetura proposta

| Camada | Escolha inicial | Observação |
|---|---|---|
| Empresa, cliente e admin | React + TypeScript + Vite, PWA | Um front-end modular com rotas/roles distintas. |
| App entregador | Kotlin + Jetpack Compose | Android inicialmente, GPS e serviço de localização. |
| Autenticação | Firebase Authentication | E-mail/senha, e-mail verificado; roles autorizadas fora do front-end. |
| Cadastro e operações | Cloud Firestore | Empresas, usuários, filiais, clientes, entregas, veículos, auditoria. |
| GPS e presença | Realtime Database | Escritas temporárias e streams limitados aos interessados. |
| Fotos e assinaturas | Cloud Storage | Buckets privados e regras por vínculo. |
| Rotinas seguras | Cloud Functions / backend | Vínculo seguro de pedidos, emissão de links, webhooks, tarefas e validações. |
| Site | Firebase Hosting `toaki-cf058` | `main` publicada somente com aprovação. |
| Mapas e rotas | Google Maps Platform a avaliar | Estimar custos por carga, rotas e geocodificação; testar alternativa conforme licenciamento. |
| Endereço CNPJ | BrasilAPI (pré-preenchimento), consulta RFB | API Serpro contratada se necessário; não prova titularidade. |
| Endereço por CEP | ViaCEP | O comprador confirma número e complemento. |
| Notificações | Firebase Cloud Messaging (depois) | Consentimento e regras de preferência. |

**Fontes consultadas em 20/10/2026:**
- Firebase Auth: https://firebase.google.com/docs/auth/web/start
- Comparação Firestore/RTDB: https://firebase.google.com/docs/database/rtdb-vs-firestore
- Pricing Firebase: https://firebase.google.com/pricing
- BrasilAPI CNPJ: https://brasilapi.com.br/docs
- Receita Federal consulta: https://www.gov.br/pt-br/servicos/consultar-cadastro-nacional-de-pessoas-juridicas
- Serpro CNPJ: https://www.gov.br/pt-br/servicos/obter-solucao-de-consulta-de-dados-do-cadastro-nacional-de-pessoas-juridicas-cnpj
- ViaCEP: https://viacep.com.br
- Android location: https://developer.android.com/develop/sensors-and-location/location/permissions/background
- ANPD geolocalização: https://www.gov.br/anpd/pt-br/centrais-de-conteudo/documentos-tecnicos-orientativos/nota-tecnica-no-72-2022-cgf-anpd.pdf/@@display-file/file

## 12. Nomes legíveis no Firebase e segurança dos IDs

**Coleções propostas** (em português e `snake_case`, sem nomes aleatórios no painel):

```text
empresas/
  empresa_soma_distribuidora/
    filiais/
      filial_maringa_centro/
    funcionarios/
      funcionario_joao_vendedor/
    entregadores_vinculados/
      entregador_moto_03/
    veiculos/
      veiculo_moto_03/
    pedidos/
      pedido_0045821/
    entregas/
      entrega_nf_0045821/
      -> status, pedido_id, destinatario_id, entregador_id, ultima_atualizacao
    comprovantes/
      comprovante_nf_0045821/
clientes/
  cliente_oficina_exemplo/
    entregas_autorizadas/
      entrega_nf_0045821/
entregadores/
  entregador_joao/
assinaturas/
  assinatura_soma_distribuidora/
planos/
  plano_piloto/
auditoria/
  evento_alteracao_entrega_0045821/
```

Estes **são exemplos**, não nomes ainda criados ou IDs definitivos. NFs podem repetir por empresa, série ou filial; nomes de pessoas podem repetir. A implementação usará IDs **estáveis e únicos** e manterá `nome_exibicao`, `codigo_interno`, `numero_nf`, `empresa_id`, `filial_id` e chaves de associação legíveis no sistema. O Firebase Authentication exige um UID técnico, que não se deve substituir manualmente pelo nome. **Nunca usar CPF, CNPJ sensível, token de acesso ou número de NF isolado como chave pública de autorização.**

**RTDB separado, alta frequência:**
```text
localizacao_ao_vivo/
  empresa_soma_distribuidora/
    entregador_moto_03/
      latitude, longitude, precisao_metros, coletado_em, online, entrega_ativa_id
```

A localização do cliente só pode ser acessada por pedido vinculado, via leitura estritamente autorizada e, quando indicado, posição/rota reduzidas (não todos os pontos de todos os motoristas). Armazenar o trajeto completo exige finalidade específica e retenção definida.

## 13. Regras de trabalho e definição de pronto

- Sem Merge/deploy automático; implementar na `develop` ou branches de feature, validar e aprovar antes da `main`.
- Em toda tarefa concluída: mudar `[ ]` para `[x]` **após teste**, registrar evidência (PR/commit/teste) e informar o usuário.
- Não chamar de concluído o que é mock: páginas renderizadas != login, banco, GPS, NF ou cobrança reais.
- Não construir tudo de uma vez; prioridade de dependências: **A (identidade/permissões) → B (pedido e entrega) → C + D (GPS/mapa) → E (cliente) → F (comprovante) → G (assinatura) → H (piloto)**, com privacidade e segurança trabalhadas desde o início.
- Critério final MVP: a empresa aprovada e um vendedor autenticado registram uma NF, entregador Android aceita/coleta/compartilha GPS, cliente autenticado ligado à compra acompanha sua NF, recebe o produto e comprovante; histórico/relatórios funcionam; outra empresa/cliente não acessa os dados.

## 14. Andamento detalhado da Fase A (PR #4)

- **A01:** concluído nesta branch com validação automática de build e testes (React/TypeScript/Vite).
- **A02:** rotas `/empresa`, `/cliente`, `/admin`, `/login` preparadas; PWA e convites ainda pendentes.
- **A03:** Firebase Web SDK configurado para o projeto `toaki-cf058`; ambiente de homologação separado ainda pendente.
- **A04:** formulários de login, cadastro, verificação, recuperação e logout programados; é obrigatório habilitar o provedor no console e testar a jornada antes de marcar concluído.
- **A05:** proteção inicial de rotas com custom claims; **ainda faltam** atribuição segura de cargos no backend, regras completas e testes de isolamento.
- **A06:** arquivo `firestore.rules` criado com bloqueio padrão e criação/leitura restrita de solicitação própria; falta ativar Firestore, publicar regras e testar em emulador.
- **A09/A10:** formulário inicial e consulta BrasilAPI preparados; faltam endereços completos, regra para CNPJ alfanumérico, validação do responsável e testes reais.
- **Padrões de registros:** consultar `FIREBASE_NOMES.md`. Nome/título exibido no painel sempre legível; UID técnico só para unicidade/autorização.
- **Estado da produção:** `main` e Hosting ainda não alterados por este PR.
