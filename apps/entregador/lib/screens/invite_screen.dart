import 'package:flutter/material.dart';
import '../core/toaki_theme.dart';
import '../core/brand.dart';
import '../data/toaki_api.dart';

class InviteScreen extends StatefulWidget{
 final ToAkiApi api;
 final Future<void> Function() onAccepted;
 final Future<void> Function() onLogout;
 const InviteScreen({super.key,required this.api,required this.onAccepted,required this.onLogout});
 @override State<InviteScreen> createState()=>_InviteScreenState();
}
class _InviteScreenState extends State<InviteScreen>{
 final code=TextEditingController();
 bool busy=false;
 String? error,notice;
 @override void dispose(){code.dispose();super.dispose();}
 Future<void> submit()async{
  setState((){busy=true;error=null;});
  try{
   final user=widget.api.auth.currentUser;
   await user?.reload();
   if(!widget.api.auth.currentUser!.emailVerified)
    throw StateError('Confirme seu e-mail antes de vincular a moto.');
   await widget.api.acceptInvite(code.text.trim());
   await widget.onAccepted();
  }catch(e){if(mounted)setState(()=>error='$e');}
  finally{if(mounted)setState(()=>busy=false);}
 }
 @override Widget build(BuildContext context)=>Scaffold(
  backgroundColor:ToAkiColors.background,
  appBar:AppBar(title:const ToAkiBrand(compact:true),actions:[
   IconButton(tooltip:'Sair',onPressed:widget.onLogout,icon:const Icon(Icons.logout))]),
  body:ListView(padding:const EdgeInsets.all(20),children:[
   const SizedBox(height:26),
   const WhiteCard(child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[
    Icon(Icons.verified_user_outlined,size:37,color:ToAkiColors.orangeDark),
    SizedBox(height:12),
    Text('Vincular minha conta',style:TextStyle(fontSize:23,fontWeight:FontWeight.w900)),
    SizedBox(height:7),
    Text('O responsável pela empresa precisa gerar um convite específico para seu e-mail. Isso impede que qualquer pessoa veja uma NF pelo número.'),
   ])),
   const SizedBox(height:18),
   TextField(controller:code,autocorrect:false,maxLines:3,
    decoration:const InputDecoration(labelText:'Código de convite recebido',
      hintText:'Cole o código enviado pelo gestor')),
   const SizedBox(height:14),
   OrangeButton(label:'Confirmar vínculo',icon:Icons.verified,loading:busy,onPressed:submit),
   const SizedBox(height:10),
   TextButton(onPressed:busy?null:()async{
    try{await widget.api.sendVerification();setState(()=>notice='E-mail de verificação reenviado.');}
    catch(e){setState(()=>error='$e');}
   },child:const Text('Reenviar confirmação de e-mail')),
   if(notice!=null)Text(notice!,style:const TextStyle(color:ToAkiColors.green)),
   if(error!=null)Text(error!,style:const TextStyle(color:Colors.red)),
  ]),
 );
}
