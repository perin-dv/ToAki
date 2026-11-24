# toAki — Entregador (Flutter, Fase C)

Aplicativo independente para Android, reaproveitando o Firebase `toaki-cf058` e o visual aprovado no projeto. **Não altera o site empresarial.** App para entregador e acompanhamento de NF; não é emissão fiscal.

## Prévia no PC (sem credenciais)
Pré-requisitos: Flutter stable 3.50+, Chrome, Python 3, Git.

```bash
cd apps/entregador
bash scripts/preparar.sh
flutter run -d chrome --dart-define=TOAKI_DEMO=true
```

A tela demonstrativa **não usa Firebase, dados pessoais, GPS real nem envio de foto**. A rota laranja é ilustrativa só na demonstração.

## Android para celular
Após PR revisado e CI verde, baixe o artifact `toaki-entregador-demo-android` do workflow **FASE C - Flutter Entregador** e instale o APK debug de demonstração em um aparelho Android autorizado. Para app real, registre o aplicativo Android `br.com.toaki.toaki_entregador` no Firebase `toaki-cf058`, configure SHA-1/SHA-256 quando necessário e o App ID Android fornecido pelo console. Nunca use o App ID Web como Android.

```bash
flutter build apk --debug --dart-define=FIREBASE_ANDROID_APP_ID=<APP_ID_ANDROID_FORNECIDO_PELO_FIREBASE>
```

O APK de demonstração não deve ser enviado como se fosse app de produção e não fornece GPS compartilhado.

## Fluxo real
1. Gestor da empresa Soma cria código individual de vínculo para o cadastro `entregador_thiago_teste_soma`, com o e-mail exato do entregador.
2. Thiago instala o APK de teste real, registra/entra com e-mail e senha e verifica seu e-mail.
3. Digita o código; o backend valida a empresa, o motorista, o e-mail, o token hash e concede apenas função de entregador.
4. O app consulta a NF atribuída `20261124001`, destinatário Sakamoto (teste), moto TST1A24. Esta NF foi previamente salva no Firestore de teste.
5. Ao tocar **Iniciar rota**, a NF passa a `em_rota`. Um segundo consentimento liga o GPS, com notificação persistente em Android.
6. O app transmite posição atual com intervalo mínimo de 10 segundos somente durante rota; o backend verifica todas as permissões e atualiza a NF no Firestore.
7. O usuário pode **Desligar rastreamento** a qualquer momento e o backend apaga a última posição.
8. O app coleta foto JPEG e assinatura PNG, salvos no Storage privado; o backend verifica existência, valida NF em rota, finaliza e remove posição. Sem links públicos.
9. O cliente final vinculado recebe apenas status e posição da sua NF, não posição de outros entregadores.

## Limites conhecidos
- O destino ilustrativo de Sakamoto **não é um endereço real navegável**. O app não inventa uma rota. O mapa inicial mostra Maringá; o trajeto laranja é exclusivo de demo.
- Rastreamento em segundo plano depende da versão do Android, permissões concedidas, otimização de bateria e configuração do serviço em foreground; validar no aparelho do Thiago antes de prometer cobertura ininterrupta.
- Push Messaging está preparado no cliente, mas precisa do registro do token no backend e da configuração FCM antes de funcionar para novas NFs.
- Firebase Storage requer `storage.rules` publicada separadamente após revisão. **Não abrir permissões genéricas no bucket**.
- Não iniciar GPS sem consentimento. Não usar o endereço fictício do cenário para navegação real.

## Estado de publicação
A branch/PR é preparação para teste. Cloud Functions, regras Storage e APK real **não são publicados automaticamente**. `main` protegida; Hosting Live intocado.
