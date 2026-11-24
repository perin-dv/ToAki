import 'package:flutter/material.dart';
import '../core/toaki_theme.dart';
import '../core/brand.dart';
import '../data/toaki_api.dart';

class LoginScreen extends StatefulWidget{
  final ToAkiApi? api;
  final bool demo;
  final Future<void> Function() onSuccess;
  const LoginScreen({super.key,required this.api,required this.demo,required this.onSuccess});
  @override State<LoginScreen> createState()=>_LoginScreenState();
}
class _LoginScreenState extends State<LoginScreen>{
  final email=TextEditingController(),password=TextEditingController();
  bool showPassword=false,busy=false;
  String? error,message;
  @override void dispose(){email.dispose();password.dispose();super.dispose();}
  Future<void> run(Future<void> Function() action) async {
    setState((){busy=true;error=null;message=null;});
    try{await action();}
    catch(e){if(mounted)setState(()=>error='$e');}
    finally{if(mounted)setState(()=>busy=false);}
  }
  @override Widget build(BuildContext context)=>Scaffold(
    backgroundColor:Colors.white,
    body:ListView(children:[
      Container(height:260,color:ToAkiColors.ink,
        child:Stack(children:[
          Align(alignment:Alignment.center,child:Column(
            mainAxisAlignment:MainAxisAlignment.center,children:[
              const ToAkiBrand(),
              const SizedBox(height:6),
              const Text('Aplicativo do Entregador',
                style:TextStyle(color:Colors.white70,fontSize:14)),
            ])),
          Positioned(bottom:-1,left:0,right:0,
            child:ClipPath(clipper:_WaveClipper(),
              child:Container(height:58,color:Colors.white))),
          Positioned(bottom:20,left:0,right:0,
            child:Container(height:4,color:ToAkiColors.orangeDark)),
        ])),
      Padding(padding:const EdgeInsets.fromLTRB(25,16,25,24),child:Column(
        crossAxisAlignment:CrossAxisAlignment.stretch,children:[
          const Text('Acesse sua conta',
            style:TextStyle(fontSize:26,fontWeight:FontWeight.w900,color:ToAkiColors.ink)),
          const SizedBox(height:6),
          const Text('Entre para iniciar suas entregas com o toAki.',
            style:TextStyle(color:ToAkiColors.muted,fontSize:14)),
          const SizedBox(height:24),
          TextField(controller:email,keyboardType:TextInputType.emailAddress,
            textInputAction:TextInputAction.next,autofillHints:const [AutofillHints.email],
            decoration:const InputDecoration(labelText:'E-mail',prefixIcon:Icon(Icons.mail_outline))),
          const SizedBox(height:14),
          TextField(controller:password,obscureText:!showPassword,
            autofillHints:const [AutofillHints.password],
            decoration:InputDecoration(labelText:'Senha',prefixIcon:const Icon(Icons.lock_outline),
              suffixIcon:IconButton(tooltip:'Mostrar senha',onPressed:()=>setState(()=>showPassword=!showPassword),
                icon:Icon(showPassword?Icons.visibility_off_outlined:Icons.visibility_outlined)))),
          Align(alignment:Alignment.centerRight,
            child:TextButton(onPressed:busy?null:()=>run(()async{
              if(email.text.trim().isEmpty)throw StateError('Informe seu e-mail.');
              await widget.api!.reset(email.text);
              if(mounted)setState(()=>message='Enviamos um link de recuperação de senha.');
            }),child:const Text('Esqueci minha senha',style:TextStyle(color:ToAkiColors.orangeDark)))),
          const SizedBox(height:14),
          OrangeButton(label:'Entrar',loading:busy,onPressed:()=>run(()async{
            if(!widget.demo){
              await widget.api!.login(email.text,password.text);
              final u=widget.api!.auth.currentUser!;
              await u.reload();
              if(!u.emailVerified)throw StateError('Confirme seu e-mail no link recebido antes de continuar.');
            }
            await widget.onSuccess();
          })),
          const SizedBox(height:10),
          OutlinedButton(onPressed:busy||widget.demo?null:()=>run(()async{
            if(password.text.length<8)throw StateError('A senha precisa de pelo menos 8 caracteres.');
            await widget.api!.register(email.text,password.text);
            if(mounted)setState(()=>message='Conta criada. Confirme o e-mail antes de entrar.');
          }),child:const Text('Criar conta de entregador')),
          if(widget.demo)const Padding(padding:EdgeInsets.all(9),child:Text(
            'Modo visual: o botão Entrar abre a demonstração; nenhum usuário é criado.',
            textAlign:TextAlign.center,style:TextStyle(fontSize:12,color:ToAkiColors.muted))),
          if(error!=null)Padding(padding:const EdgeInsets.only(top:8),
            child:Text(error!,style:const TextStyle(color:Colors.red))),
          if(message!=null)Padding(padding:const EdgeInsets.only(top:8),
            child:Text(message!,style:const TextStyle(color:ToAkiColors.green))),
          const SizedBox(height:22),
          const Center(child:Icon(Icons.delivery_dining,size:48,color:Color(0xFFACB7C5))),
        ])),
    ]),
  );
}
class _WaveClipper extends CustomClipper<Path>{
 @override Path getClip(Size s){
   final p=Path()..moveTo(0,16)..quadraticBezierTo(s.width*.55,s.height*.90,s.width,8)
    ..lineTo(s.width,s.height)..lineTo(0,s.height)..close();
   return p;
 }
 @override bool shouldReclip(covariant CustomClipper<Path> oldClipper)=>false;
}
