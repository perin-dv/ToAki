import 'package:flutter/material.dart';

class ToAkiColors {
  static const orange = Color(0xFFFF7800);
  static const orangeDark = Color(0xFFF75C05);
  static const ink = Color(0xFF141517);
  static const background = Color(0xFFF4F6F8);
  static const muted = Color(0xFF66717F);
  static const green = Color(0xFF119F50);
}

ThemeData toAkiTheme() => ThemeData(
  useMaterial3: true,
  scaffoldBackgroundColor: ToAkiColors.background,
  fontFamily: 'Roboto',
  colorScheme: ColorScheme.fromSeed(
    seedColor: ToAkiColors.orange,
    primary: ToAkiColors.orange,
    brightness: Brightness.light,
  ),
  appBarTheme: const AppBarTheme(
    backgroundColor: ToAkiColors.ink,
    foregroundColor: Colors.white,
    centerTitle: true,
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: const Color(0xFFF9FAFC),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
    enabledBorder: OutlineInputBorder(
      borderSide: const BorderSide(color: Color(0xFFD5DCE4)),
      borderRadius: BorderRadius.circular(14),
    ),
    focusedBorder: OutlineInputBorder(
      borderSide: const BorderSide(color: ToAkiColors.orange, width: 1.6),
      borderRadius: BorderRadius.circular(14),
    ),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
  ),
);

class OrangeButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback? onPressed;
  final bool loading;
  const OrangeButton({
    super.key, required this.label, this.icon = Icons.arrow_forward,
    required this.onPressed, this.loading = false,
  });
  @override
  Widget build(BuildContext context) => SizedBox(
    height: 53,
    width: double.infinity,
    child: DecoratedBox(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFF9500), Color(0xFFFF5D08)],
        ),
        borderRadius: BorderRadius.circular(14),
      ),
      child: TextButton.icon(
        onPressed: loading ? null : onPressed,
        icon: loading
            ? const SizedBox(height: 18, width: 18,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : Icon(icon, color: Colors.white),
        label: Text(label,
          style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w800)),
      ),
    ),
  );
}

class WhiteCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  const WhiteCard({super.key, required this.child,
    this.padding = const EdgeInsets.all(17)});
  @override Widget build(BuildContext context) => Container(
    width: double.infinity, padding: padding,
    decoration: BoxDecoration(color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      boxShadow: const [BoxShadow(color: Color(0x10000000),blurRadius: 12,offset: Offset(0,5))]),
    child: child,
  );
}

class MutedLine extends StatelessWidget {
  final IconData icon;
  final String label;
  const MutedLine(this.icon,this.label,{super.key});
  @override Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 7),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start,children: [
      Icon(icon,size:19,color:ToAkiColors.muted),
      const SizedBox(width:10),
      Expanded(child:Text(label,style:const TextStyle(color:ToAkiColors.muted,fontSize:13))),
    ]),
  );
}
