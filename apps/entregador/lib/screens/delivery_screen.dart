import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/brand.dart';
import '../core/toaki_theme.dart';
import '../data/delivery.dart';
import '../data/tracking_service.dart';

class DeliveryScreen extends StatelessWidget{
 final Delivery? selected;
 final List<Delivery> deliveries;
 final TrackingService tracking;
 final bool demo,working;
 final String? driverName,error;
 final ValueChanged<Delivery> onSelect;
 final VoidCallback onStart,onStop,onRefresh,onLogout,onProof;
 const DeliveryScreen({super.key,required this.selected,required this.deliveries,
  required this.tracking,required this.demo,required this.working,required this.driverName,
  required this.error,required this.onSelect,required this.onStart,required this.onStop,
  required this.onRefresh,required this.onLogout,required this.onProof});
 @override Widget build(BuildContext context){
  return Scaffold(backgroundColor:ToAkiColors.background,
   body:AnimatedBuilder(animation:tracking,builder:(context,_)=>ListView(children:[
    Container(color:ToAkiColors.ink,padding:const EdgeInsets.fromLTRB(18,8,18,18),
      child:Column(children:[
        Row(children:[
          PopupMenuButton<String>(
            tooltip:'Menu do entregador',icon:const Icon(Icons.menu,color:Colors.white),
            onSelected:(value){if(value=='sair')onLogout();if(value=='atualizar')onRefresh();},
            itemBuilder:(_)=>const [
              PopupMenuItem(value:'atualizar',child:Text('Atualizar entregas')),
              PopupMenuItem(value:'sair',child:Text('Sair da conta')),
            ]),
          const Spacer(),const ToAkiBrand(compact:true),const Spacer(),
          IconButton(onPressed:onRefresh,tooltip:'Atualizar notificações',
            icon:const Icon(Icons.notifications_none_rounded,color:Colors.white)),
        ]),
        const SizedBox(height:6),
        const Text('Entrega em andamento',style:TextStyle(color:Colors.white,
          fontSize:22,fontWeight:FontWeight.w900)),
        const SizedBox(height:11),
        DecoratedBox(decoration:BoxDecoration(
          borderRadius:BorderRadius.circular(30),color:const Color(0xFF163525)),
          child:Padding(padding:const EdgeInsets.symmetric(horizontal:13,vertical:8),
            child:Row(mainAxisSize:MainAxisSize.min,children:[
              Icon(Icons.circle,size:10,color:tracking.active?const Color(0xFF42E06E):Colors.amber),
              const SizedBox(width:8),
              Text(tracking.active?'Rastreamento em tempo real ativo':'GPS desligado',
                style:const TextStyle(color:Colors.white,fontSize:12,fontWeight:FontWeight.w600))
            ]))),
      ])),
    SizedBox(height:275,child:Stack(children:[
      _MapView(demo:demo,tracking:tracking),
      Positioned(left:12,top:11,child:DecoratedBox(
        decoration:BoxDecoration(color:Colors.white,borderRadius:BorderRadius.circular(20),
          boxShadow:const [BoxShadow(color:Color(0x33000000),blurRadius:6)]),
        child:const Padding(padding:EdgeInsets.symmetric(horizontal:13,vertical:9),
          child:Row(children:[Icon(Icons.location_on,size:17),SizedBox(width:4),
            Text('Maringá, PR',style:TextStyle(fontWeight:FontWeight.w700))])))),
      if(!demo&&!tracking.active)const Positioned(bottom:9,left:8,right:8,
        child:WhiteCard(padding:EdgeInsets.all(8),child:Text(
          'O mapa mostra Maringá como referência inicial. Nenhuma posição do motoboy é simulada.',
          textAlign:TextAlign.center,style:TextStyle(fontSize:10,color:ToAkiColors.muted)))),
    ])),
    Padding(padding:const EdgeInsets.fromLTRB(14,14,14,22),child:Column(children:[
      if(deliveries.isNotEmpty&&driverName!=null)
        Padding(padding:const EdgeInsets.only(bottom:10),
         child:Align(alignment:Alignment.centerLeft,
           child:Text('Olá, $driverName',style:const TextStyle(fontWeight:FontWeight.w700,fontSize:16)))),
      if(selected==null)WhiteCard(child:Column(children:[
        const Icon(Icons.inventory_2_outlined,size:40,color:ToAkiColors.orange),
        const SizedBox(height:10),
        const Text('Nenhuma NF atribuída',style:TextStyle(fontSize:18,fontWeight:FontWeight.bold)),
        const SizedBox(height:8),
        const Text('A empresa precisa vincular uma nota ao seu cadastro.',
          textAlign:TextAlign.center,style:TextStyle(color:ToAkiColors.muted)),
        const SizedBox(height:15),OrangeButton(label:'Atualizar lista',onPressed:onRefresh),
      ])),
      if(deliveries.length>1)WhiteCard(child:DropdownButton<Delivery>(
        value:selected,
        isExpanded:true,underline:const SizedBox.shrink(),
        items:deliveries.map((d)=>DropdownMenuItem(value:d,
          child:Text('NF ${d.number} · ${statusLegivel(d.status)}'))).toList(),
        onChanged:(d){if(d!=null&&!tracking.active)onSelect(d);},
      )),
      if(selected!=null)WhiteCard(child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
        Row(children:[
          const _SquareIcon(Icons.inventory_2_outlined),
          const SizedBox(width:12),
          Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
            Text(selected!.recipient,style:const TextStyle(fontSize:17,fontWeight:FontWeight.w900)),
            Text('NF: ${selected!.number}',style:const TextStyle(color:ToAkiColors.muted)),
          ])),
          const Icon(Icons.chevron_right),
        ]),
        const Divider(height:23),
        MutedLine(Icons.two_wheeler_outlined,'Veículo: ${selected!.vehicle}'),
        MutedLine(Icons.location_on_outlined,'Destino: ${selected!.destination}'),
        MutedLine(Icons.local_shipping_outlined,'Situação: ${statusLegivel(selected!.status)}'),
        if(tracking.current!=null)
          MutedLine(Icons.my_location,'Precisão atual: ${tracking.current!.accuracy.toStringAsFixed(0)} m'),
      ])),
      const SizedBox(height:12),
      if(selected!=null&&selected!.status=='pendente')
        OrangeButton(label:'Iniciar rota',icon:Icons.play_arrow_rounded,
          loading:working,onPressed:working?null:onStart),
      if(selected!=null&&selected!.status=='em_rota')...[
        if(!tracking.active)OrangeButton(label:'Ativar GPS desta entrega',
          icon:Icons.location_on_rounded,loading:working,onPressed:working?null:onStart),
        if(tracking.active)OrangeButton(label:'Desligar rastreamento',
          icon:Icons.location_off_rounded,loading:working,onPressed:working?null:onStop),
        const SizedBox(height:10),
        OutlinedButton.icon(onPressed:onProof,icon:const Icon(Icons.check_circle_outline),
          label:const Text('Comprovar entrega')),
      ],
      if(selected!=null)TextButton.icon(
        icon:const Icon(Icons.directions),label:const Text('Abrir destino no Maps'),
        onPressed:()async{
          final uri=Uri.https('www.google.com','/maps/search/',
            {'api':'1','query':selected!.destination});
          await launchUrl(uri,mode:LaunchMode.externalApplication);
        }),
      if(error!=null)Text(error!,style:const TextStyle(color:Colors.red)),
      if(tracking.error!=null)Text(tracking.error!,style:const TextStyle(color:Colors.red)),
      if(demo)const Text('Demonstração visual: posições e rota ilustrativas. Nenhuma NF ou GPS real é enviado.',
        textAlign:TextAlign.center,style:TextStyle(fontSize:11,color:ToAkiColors.muted)),
      const SizedBox(height:5),
    ])),
   ])),
  );
 }
}

class _MapView extends StatelessWidget {
 final bool demo;
 final TrackingService tracking;
 const _MapView({required this.demo,required this.tracking});
 @override Widget build(BuildContext context){
  const maringa=LatLng(-23.4205,-51.9333);
  final point=tracking.current;
  final current=point==null?null:LatLng(point.latitude,point.longitude);
  return FlutterMap(options:MapOptions(initialCenter:current??maringa,initialZoom:13),
   children:[
    TileLayer(urlTemplate:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      userAgentPackageName:'br.com.toaki.entregador'),
    // Linha laranja existe SOMENTE no modo de prévia, nunca sobre GPS real sem serviço de rotas.
    if(demo)PolylineLayer(polylines:[Polyline(
      points:const [LatLng(-23.4153,-51.9466),LatLng(-23.4190,-51.9390),
        LatLng(-23.4258,-51.9306),LatLng(-23.4202,-51.9180)],
      color:ToAkiColors.orange,strokeWidth:5)]),
    MarkerLayer(markers:[
      if(demo)const Marker(point:LatLng(-23.4153,-51.9466),width:43,height:53,
        child:Icon(Icons.two_wheeler,color:ToAkiColors.orange,size:36)),
      if(demo)const Marker(point:LatLng(-23.4202,-51.9180),width:45,height:50,
        child:Icon(Icons.location_pin,color:ToAkiColors.orangeDark,size:45)),
      if(current!=null)Marker(point:current,width:48,height:48,
        child:const Icon(Icons.location_pin,color:ToAkiColors.orange,size:43)),
    ]),
    const RichAttributionWidget(attributions:[
      TextSourceAttribution('© OpenStreetMap contributors')
    ]),
   ]);
 }
}
class _SquareIcon extends StatelessWidget{
 final IconData icon;
 const _SquareIcon(this.icon);
 @override Widget build(BuildContext context)=>Container(
  width:46,height:46,decoration:BoxDecoration(color:const Color(0xFFFFEFE3),
    borderRadius:BorderRadius.circular(12)),
  child:Icon(icon,color:ToAkiColors.orangeDark));
}
