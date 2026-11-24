import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:signature/signature.dart';
import '../core/toaki_theme.dart';
import '../data/delivery.dart';
import '../data/toaki_api.dart';

class ProofScreen extends StatefulWidget{
 final Delivery delivery;
 final ToAkiApi? api;
 final bool demo;
 final VoidCallback onBack;
 final Future<void> Function() onCompleted;
 const ProofScreen({super.key,required this.delivery,required this.api,
   required this.demo,required this.onBack,required this.onCompleted});
 @override State<ProofScreen> createState()=>_ProofScreenState();
}
class _ProofScreenState extends State<ProofScreen>{
 Uint8List? photo,signature;
 bool busy=false;
 String? error;
 Future<void> takePhoto()async{
  if(widget.demo){setState(()=>photo=Uint8List.fromList([1,2,3]));return;}
  try{
   final picture=await ImagePicker().pickImage(source:ImageSource.camera,
    maxWidth:1440,imageQuality:78);
   if(picture==null)return;
   final bytes=await picture.readAsBytes();
   if(bytes.length>8*1024*1024)throw StateError('Foto grande demais (máximo 8 MB).');
   if(mounted)setState(()=>photo=bytes);
  }catch(e){if(mounted)setState(()=>error='Câmera: $e');}
 }
 Future<void> sign()async{
  if(widget.demo){setState(()=>signature=Uint8List.fromList([1,2,3]));return;}
  final controller=SignatureController(penStrokeWidth:3,penColor:ToAkiColors.ink,
    exportBackgroundColor:Colors.white);
  final saved=await showDialog<Uint8List>(context:context,builder:(ctx)=>AlertDialog(
   title:const Text('Assinatura do recebedor'),
   content:SizedBox(width:300,height:240,child:Signature(controller:controller,
     backgroundColor:Colors.white)),
   actions:[
    TextButton(onPressed:controller.clear,child:const Text('Limpar')),
    TextButton(onPressed:()=>Navigator.pop(ctx),child:const Text('Cancelar')),
    TextButton(onPressed:()async{
      final png=await controller.toPngBytes();
      if(ctx.mounted)Navigator.pop(ctx,png);
    },child:const Text('Salvar assinatura')),
   ],
  ));
  controller.dispose();
  if(saved!=null&&saved.length>64&&mounted)setState(()=>signature=saved);
 }
 Future<void> complete()async{
  if(photo==null||signature==null||busy)return;
  setState((){busy=true;error=null;});
  try{
   if(!widget.demo){
    await widget.api!.uploadProof(widget.delivery,photo!,signature!);
    await widget.api!.complete(widget.delivery.id);
   }
   await widget.onCompleted();
  }catch(e){if(mounted)setState(()=>error='Entrega não concluída: $e');}
  finally{if(mounted)setState(()=>busy=false);}
 }
 @override Widget build(BuildContext context)=>Scaffold(
  appBar:AppBar(leading:IconButton(icon:const Icon(Icons.arrow_back),onPressed:widget.onBack),
    title:const Text('Comprovar entrega',style:TextStyle(fontWeight:FontWeight.bold))),
  body:ListView(padding:const EdgeInsets.all(16),children:[
   WhiteCard(child:Column(children:[
    Row(children:[
      const Icon(Icons.inventory_2_outlined,color:ToAkiColors.orange,size:36),
      const SizedBox(width:12),Expanded(child:Column(
       crossAxisAlignment:CrossAxisAlignment.start,children:[
        Text(widget.delivery.recipient,style:const TextStyle(fontSize:18,fontWeight:FontWeight.w900)),
        Text('NF: ${widget.delivery.number}',style:const TextStyle(color:ToAkiColors.muted))
       ]))
    ]),
    const SizedBox(height:16),const Divider(),
    Row(mainAxisAlignment:MainAxisAlignment.spaceBetween,children:[
      const Text('Status da entrega',style:TextStyle(fontWeight:FontWeight.w600)),
      Container(padding:const EdgeInsets.symmetric(horizontal:12,vertical:7),
       decoration:BoxDecoration(color:const Color(0xFFE0F4E4),borderRadius:BorderRadius.circular(14)),
       child:const Text('Em entrega',style:TextStyle(color:ToAkiColors.green,fontWeight:FontWeight.bold))),
    ])
   ])),
   const SizedBox(height:16),
   _ProofTile(icon:Icons.camera_alt_outlined,title:'Foto do comprovante',
     subtitle:photo==null?'Tire uma foto da entrega (volume no local, recebedor, etc.)':'Foto pronta para envio',
     done:photo!=null,onPressed:takePhoto),
   const SizedBox(height:16),
   _ProofTile(icon:Icons.draw_outlined,title:'Assinatura do recebedor',
     subtitle:signature==null?'Colete a assinatura do cliente na tela.':'Assinatura capturada',
     done:signature!=null,onPressed:sign),
   const SizedBox(height:34),
   OrangeButton(label:'Confirmar entrega',icon:Icons.check_rounded,loading:busy,
     onPressed:photo!=null&&signature!=null&&!busy?complete:null),
   if(error!=null)Padding(padding:const EdgeInsets.all(8),
     child:Text(error!,style:const TextStyle(color:Colors.red))),
   const SizedBox(height:15),
   const Text('A confirmação só ocorre após a foto e a assinatura serem salvas com acesso protegido. O GPS é encerrado ao finalizar.',
    textAlign:TextAlign.center,style:TextStyle(color:ToAkiColors.muted,fontSize:11)),
   if(widget.demo)const Padding(padding:EdgeInsets.only(top:8),child:Text(
    'Modo demonstração: nenhum comprovante real é enviado.',
    textAlign:TextAlign.center,style:TextStyle(fontSize:11,color:ToAkiColors.muted)))
  ]),
 );
}
class _ProofTile extends StatelessWidget {
 final IconData icon;
 final String title,subtitle;
 final bool done;
 final VoidCallback onPressed;
 const _ProofTile({required this.icon,required this.title,
  required this.subtitle,required this.done,required this.onPressed});
 @override Widget build(BuildContext context)=>WhiteCard(child:InkWell(
  onTap:onPressed,child:Row(children:[
    Container(width:49,height:49,decoration:BoxDecoration(color:const Color(0xFFFFF2E6),
      borderRadius:BorderRadius.circular(11)),
      child:Icon(icon,color:ToAkiColors.orangeDark,size:26)),
    const SizedBox(width:14),
    Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
      Text(title,style:const TextStyle(fontSize:16,fontWeight:FontWeight.bold)),
      const SizedBox(height:5),
      Text(subtitle,style:const TextStyle(color:ToAkiColors.muted,fontSize:12)),
    ])),
    Icon(done?Icons.check_circle_rounded:Icons.chevron_right,
      color:done?ToAkiColors.green:ToAkiColors.muted),
  ])));
}
