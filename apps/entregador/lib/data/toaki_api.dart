import 'dart:typed_data';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'delivery.dart';

class ToAkiApi {
  final FirebaseAuth auth;
  final FirebaseFunctions functions;
  final FirebaseStorage storage;
  ToAkiApi({FirebaseAuth? auth,FirebaseFunctions? functions,FirebaseStorage? storage}):
    auth=auth??FirebaseAuth.instance,
    functions=functions??FirebaseFunctions.instanceFor(region:'southamerica-east1'),
    storage=storage??FirebaseStorage.instance;
  Future<Map<String,dynamic>> call(String name,Map<String,dynamic> body) async {
    final result=await functions.httpsCallable(name,
      options:HttpsCallableOptions(timeout:const Duration(seconds:45))).call(body);
    return Map<String,dynamic>.from(result.data as Map);
  }
  Future<void> login(String email,String password) async =>
    auth.signInWithEmailAndPassword(email:email.trim(),password:password);
  Future<void> register(String email,String password) async {
    final credential=await auth.createUserWithEmailAndPassword(email:email.trim(),password:password);
    await credential.user?.sendEmailVerification();
  }
  Future<void> sendVerification()=>auth.currentUser!.sendEmailVerification();
  Future<void> reset(String email)=>auth.sendPasswordResetEmail(email:email.trim());
  Future<void> logout()=>auth.signOut();
  Future<bool> linked() async {
    final user=auth.currentUser;
    if(user==null)return false;
    final t=await user.getIdTokenResult(true);
    return t.claims?['role']=='entregador'&&t.claims?['empresa_id'] is String;
  }
  Future<void> acceptInvite(String code) async {
    await call('aceitarConviteMotoboyPiloto',{'codigo':code.trim()});
    await auth.currentUser?.getIdToken(true);
  }
  Future<List<Delivery>> deliveries() async {
    final result=await call('listarEntregasMotoboyPiloto',{});
    final list=(result['entregas'] as List? ?? []);
    return list.map((x)=>Delivery.fromJson(Map<String,dynamic>.from(x as Map))).toList();
  }
  Future<void> start(String id)=>call('iniciarEntregaMotoboyPiloto',{'pedidoId':id}).then((_){});
  Future<void> location(String id,double lat,double lng,double accuracy)=>
    call('enviarGpsMotoboyPiloto',{'pedidoId':id,'latitude':lat,'longitude':lng,'precisao':accuracy}).then((_){});
  Future<void> stopLocation(String id)=>call('pararGpsMotoboyPiloto',{'pedidoId':id}).then((_){});
  Future<void> complete(String id)=>call('concluirEntregaMotoboyPiloto',{'pedidoId':id}).then((_){});
  Future<void> uploadProof(Delivery d,Uint8List photo,Uint8List signature) async {
    final uid=auth.currentUser?.uid;
    if(uid==null)throw StateError('Faça login primeiro.');
    final prefix='comprovantes/${d.empresaId}/${d.id}/$uid';
    await storage.ref('$prefix/foto.jpg').putData(photo,
      SettableMetadata(contentType:'image/jpeg',customMetadata:{'tipo':'comprovante_foto'}));
    await storage.ref('$prefix/assinatura.png').putData(signature,
      SettableMetadata(contentType:'image/png',customMetadata:{'tipo':'comprovante_assinatura'}));
  }
  Future<void> registerPush() async {
    // Permissão de notificações é opcional e solicitada somente após o vínculo.
    final messaging=FirebaseMessaging.instance;
    final permissions=await messaging.requestPermission(alert:true,badge:true,sound:true);
    if(permissions.authorizationStatus==AuthorizationStatus.denied)return;
    final token=await messaging.getToken();
    if(token!=null)await call('registrarPushMotoboyPiloto',{'token':token});
  }
}
