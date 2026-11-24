import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'toaki_api.dart';

class TrackingService extends ChangeNotifier {
  final ToAkiApi? api;
  TrackingService(this.api);
  StreamSubscription<Position>? _subscription;
  Position? last;
  String? error;
  bool active=false;
  DateTime? _lastSent;
  String? _id;
  bool _sending=false;
  Position? get current=>last;
  Future<void> start(String pedidoId,{bool demo=false}) async {
    if(active)return;
    error=null;notifyListeners();
    if(demo){
      active=true;_id=pedidoId;notifyListeners();return;
    }
    if(!await Geolocator.isLocationServiceEnabled())throw StateError('Ative a localização do celular.');
    var perm=await Geolocator.checkPermission();
    if(perm==LocationPermission.denied)perm=await Geolocator.requestPermission();
    if(perm==LocationPermission.denied||perm==LocationPermission.deniedForever)
      throw StateError('Localização negada. Autorize pelo Android para acompanhar a entrega.');
    _id=pedidoId;active=true;_lastSent=null;notifyListeners();
    final LocationSettings settings;
    if(!kIsWeb && defaultTargetPlatform==TargetPlatform.android){
      settings=AndroidSettings(accuracy:LocationAccuracy.bestForNavigation,
        distanceFilter:10,intervalDuration:const Duration(seconds:15),
        foregroundNotificationConfig:const ForegroundNotificationConfig(
          notificationTitle:'toAki — entrega em andamento',
          notificationText:'Seu GPS está sendo compartilhado para esta entrega. Abra o app para encerrar.',
          notificationChannelName:'Rastreamento de entregas',
          enableWakeLock:true,setOngoing:true,
        ));
    } else {
      settings=const LocationSettings(accuracy:LocationAccuracy.high,distanceFilter:10);
    }
    _subscription=Geolocator.getPositionStream(locationSettings:settings).listen((point) async {
      if(!active||_sending||api==null||point.accuracy>100)return;
      last=point;notifyListeners();
      final now=DateTime.now();
      if(_lastSent!=null&&now.difference(_lastSent!).inSeconds<15)return;
      _sending=true;
      try{
        await api!.location(pedidoId,point.latitude,point.longitude,point.accuracy);
        _lastSent=now;error=null;
      }catch(e){error='Não foi possível enviar GPS: $e';}
      finally{_sending=false;notifyListeners();}
    },onError:(Object e){error='GPS indisponível: $e';notifyListeners();});
  }
  Future<void> stop({bool demo=false}) async {
    final id=_id;
    active=false;_id=null;
    await _subscription?.cancel();_subscription=null;
    notifyListeners();
    if(!demo&&api!=null&&id!=null){
      try{await api!.stopLocation(id);}catch(e){error='GPS desligado neste aparelho; falha ao remover última posição: $e';notifyListeners();}
    }
  }
  @override void dispose(){
    active=false;_subscription?.cancel();super.dispose();
  }
}
