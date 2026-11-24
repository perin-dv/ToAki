import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'core/toaki_theme.dart';
import 'data/toaki_api.dart';
import 'data/tracking_service.dart';
import 'data/delivery.dart';
import 'screens/login_screen.dart';
import 'screens/invite_screen.dart';
import 'screens/delivery_screen.dart';
import 'screens/proof_screen.dart';

const demoMode=bool.fromEnvironment('TOAKI_DEMO',defaultValue:false);
const firebaseAndroidId=String.fromEnvironment('FIREBASE_ANDROID_APP_ID');
const webId='1:591288979843:web:270400b62b87c5d844e6b6';
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  String? setupError;
  if(!demoMode){
    if(!kIsWeb&&firebaseAndroidId.isEmpty){
      setupError='Firebase Android ainda não configurado. Registre br.com.toaki.entregador no console e forneça FIREBASE_ANDROID_APP_ID no build. Nenhum dado foi simulado.';
    }else{
      try{
        await Firebase.initializeApp(options:FirebaseOptions(
          apiKey:'AIzaSyAlEwcePvdIVM8LGvS95jJflfSeK27dytg',
          appId:kIsWeb?webId:firebaseAndroidId,
          messagingSenderId:'591288979843',
          projectId:'toaki-cf058',
          authDomain:'toaki-cf058.firebaseapp.com',
          storageBucket:'toaki-cf058.firebasestorage.app',
        ));
      }catch(e){setupError='Falha ao conectar Firebase: $e';}
    }
  }
  runApp(ToAkiEntregadorApp(setupError:setupError));
}

class ToAkiEntregadorApp extends StatelessWidget {
  final String? setupError;
  const ToAkiEntregadorApp({super.key,this.setupError});
  @override Widget build(BuildContext context) => MaterialApp(
    title:'toAki · Entregador',debugShowCheckedModeBanner:false,
    theme:toAkiTheme(),home:ToAkiShell(setupError:setupError),
  );
}

class ToAkiShell extends StatefulWidget {
  final String? setupError;
  const ToAkiShell({super.key,this.setupError});
  @override State<ToAkiShell> createState()=>_ToAkiShellState();
}

class _ToAkiShellState extends State<ToAkiShell>{
  late final ToAkiApi? api=demoMode||widget.setupError!=null?null:ToAkiApi();
  late final TrackingService tracking=TrackingService(api);
  bool logged=demoMode,linked=demoMode,working=false;
  bool showingProof=false;
  Delivery? selected=demoMode?Delivery.demo:null;
  List<Delivery> deliveries=demoMode?[Delivery.demo]:[];
  String? problem;
  String? driverName=demoMode?'Thiago (demonstração)':null;
  @override void initState(){super.initState();if(!demoMode&&api!=null)_recover();}
  Future<void> _recover() async {
    final user=api?.auth.currentUser;
    if(user==null)return;
    final isLinked=await api!.linked();
    if(!mounted)return;
    setState((){logged=true;linked=isLinked;});
    if(isLinked)await refresh();
  }
  Future<void> refresh() async {
    if(api==null||!linked)return;
    try{
      final results=await api!.deliveries();
      if(!mounted)return;
      setState((){
        deliveries=results;
        if(selected!=null&&results.any((d)=>d.id==selected!.id)){
          selected=results.firstWhere((d)=>d.id==selected!.id);
        }else{selected=results.isEmpty?null:results.first;}
        problem=null;
      });
    }catch(e){if(mounted)setState(()=>problem='Não foi possível atualizar entregas: $e');}
  }
  Future<void> signout() async {
    await tracking.stop(demo:demoMode);
    if(!demoMode)await api?.logout();
    if(!mounted)return;
    setState((){logged=false;linked=false;deliveries=[];selected=null;showingProof=false;});
  }
  Future<void> begin() async {
    final d=selected;if(d==null||working)return;
    setState(()=>working=true);
    try{
      if(!demoMode)await api!.start(d.id);
      await tracking.start(d.id,demo:demoMode);
      if(!mounted)return;
      setState((){
        selected=d.withStatus('em_rota');
        deliveries=deliveries.map((x)=>x.id==d.id?selected!:x).toList();
        problem=null;
      });
    }catch(e){if(mounted)setState(()=>problem='Rota não iniciada: $e');}
    finally{if(mounted)setState(()=>working=false);}
  }
  Future<void> stop() async {
    setState(()=>working=true);
    try{await tracking.stop(demo:demoMode);}
    catch(e){if(mounted)setState(()=>problem='$e');}
    finally{if(mounted)setState(()=>working=false);}
  }
  @override void dispose(){tracking.dispose();super.dispose();}
  @override Widget build(BuildContext context){
    Widget screen;
    if(widget.setupError!=null){
      screen=Scaffold(body:Center(child:Padding(padding:const EdgeInsets.all(24),
        child:WhiteCard(child:Column(mainAxisSize:MainAxisSize.min,children:[
          const Icon(Icons.settings_applications,size:58,color:ToAkiColors.orange),
          const SizedBox(height:14),
          const Text('Configuração necessária',style:TextStyle(fontSize:22,fontWeight:FontWeight.bold)),
          const SizedBox(height:10),
          Text(widget.setupError!,textAlign:TextAlign.center),
          const SizedBox(height:12),
          const Text('Para visualizar a interface sem credenciais, execute com TOAKI_DEMO=true.'),
        ])))));
    }else if(!logged){
      screen=LoginScreen(api:api,demo:demoMode,onSuccess:()async{
        setState(()=>logged=true);
        if(!demoMode){linked=await api!.linked();if(linked)await refresh();if(mounted)setState((){});}
      });
    }else if(!linked){
      screen=InviteScreen(api:api!,onAccepted:()async{
        setState(()=>linked=true);
        await refresh();
      },onLogout:signout);
    }else if(showingProof&&selected!=null){
      screen=ProofScreen(delivery:selected!,api:api,demo:demoMode,onBack:(){
        setState(()=>showingProof=false);
      },onCompleted:() async {
        await tracking.stop(demo:demoMode);
        setState((){
          selected=selected!.withStatus('entregue');showingProof=false;
        });
        if(!demoMode)await refresh();
      });
    }else{
      screen=DeliveryScreen(
        selected:selected,deliveries:deliveries,tracking:tracking,
        demo:demoMode,working:working,driverName:driverName,
        error:problem,onSelect:(d)=>setState(()=>selected=d),
        onStart:begin,onStop:stop,onRefresh:refresh,onLogout:signout,
        onProof:()=>setState(()=>showingProof=true),
      );
    }
    return Container(color:ToAkiColors.ink,
      child:SafeArea(bottom:false,
        child:Center(child:ConstrainedBox(constraints:const BoxConstraints(maxWidth:480),
          child:Column(children:[
            if(demoMode)const ColoredBox(color:Color(0xFFFFEDD6),
              child:Padding(padding:EdgeInsets.all(7),child:Center(
                child:Text('PRÉVIA INTERATIVA · SEM GPS OU FIREBASE',
                  style:TextStyle(color:Color(0xFF9C4300),fontSize:10,fontWeight:FontWeight.bold))))),
            Expanded(child:screen),
          ])))));
  }
}
