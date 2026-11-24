import 'package:flutter/material.dart';

class ToAkiBrand extends StatelessWidget {
  final bool compact;
  const ToAkiBrand({super.key,this.compact=false});
  @override Widget build(BuildContext context) => Image.asset(
    'assets/logo-toaki.webp', fit: BoxFit.contain,
    height: compact ? 45 : 94,
    filterQuality: FilterQuality.high,
    errorBuilder: (_, __, ___) => Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.local_shipping_rounded,color:Color(0xFFFF8600),size:45),
        Text.rich(TextSpan(children:[
          const TextSpan(text:'to',style:TextStyle(color:Colors.white)),
          const TextSpan(text:'aki',style:TextStyle(color:Color(0xFFFF8600))),
        ]),style: TextStyle(fontSize:compact?30:51,fontWeight:FontWeight.w900)),
      ],
    ),
  );
}
