import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:toaki_entregador/data/delivery.dart';
import 'package:toaki_entregador/data/tracking_service.dart';
import 'package:toaki_entregador/screens/delivery_screen.dart';
import 'package:toaki_entregador/core/toaki_theme.dart';
void main(){
 test('a NF da Soma é identificada corretamente e o status é legível',(){
  const d=Delivery.demo;
  expect(d.number,'20261124001');
  expect(d.recipient,'Sakamoto (teste)');
  expect(d.vehicle,contains('TST1A24'));
  expect(statusLegivel('pendente'),'Aguardando saída');
  expect(d.withStatus('entregue').status,'entregue');
 });
 testWidgets('interface exibe entrega real do cadastro fictício sem prometer GPS',(tester)async{
  final tracker=TrackingService(null);
  await tester.pumpWidget(MaterialApp(theme:toAkiTheme(),home:
    DeliveryScreen(
      selected:Delivery.demo,deliveries:const [Delivery.demo],tracking:tracker,
      demo:true,working:false,driverName:'Thiago (teste)',error:null,
      onSelect:(_){},onStart:(){},onStop:(){},onRefresh:(){},
      onLogout:(){},onProof:(){},
    )));
  await tester.pump();
  expect(find.text('Sakamoto (teste)'),findsOneWidget);
  expect(find.text('NF: 20261124001'),findsOneWidget);
  expect(find.text('Iniciar rota'),findsOneWidget);
  tracker.dispose();
 });
}
