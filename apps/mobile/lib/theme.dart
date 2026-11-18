import 'package:flutter/material.dart';

/// The copybook palette, the same as the website (src/app/globals.css).
const kPaper = Color(0xFFF7F2E8), kPaper2 = Color(0xFFEFE7D8), kCard = Color(0xFFFFFDF8), kLine = Color(0xFFD9CFBF), kRule = Color(0xFFC7D5E8);
const kInk = Color(0xFF1F2733), kMuted = Color(0xFF6B6457), kGreen = Color(0xFF2F7D5B), kRed = Color(0xFFD9534F), kBlue = Color(0xFF2B5FA8), kGold = Color(0xFFB8862B);

TextStyle display(double size, {Color color = kInk, FontStyle style = FontStyle.normal, FontWeight weight = FontWeight.w600}) =>
    TextStyle(fontFamily: 'Fraunces', fontSize: size, fontWeight: weight, color: color, fontStyle: style, height: 1.08);

TextStyle kicker([Color color = kRed]) => TextStyle(fontFamily: 'Inter', fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1.6, color: color);

ThemeData meithealTheme() {
  final base = ThemeData(useMaterial3: true, scaffoldBackgroundColor: kPaper,
      colorScheme: ColorScheme.fromSeed(seedColor: kGreen, primary: kGreen, secondary: kRed, surface: kCard, onSurface: kInk));
  return base.copyWith(
    textTheme: base.textTheme.apply(fontFamily: 'Inter', bodyColor: kInk, displayColor: kInk),
    appBarTheme: AppBarTheme(backgroundColor: kPaper, foregroundColor: kInk, elevation: 0, scrolledUnderElevation: 0, titleTextStyle: display(20)),
    filledButtonTheme: FilledButtonThemeData(style: FilledButton.styleFrom(backgroundColor: kGreen, foregroundColor: Colors.white, minimumSize: const Size(64, 56),
        textStyle: TextStyle(fontFamily: 'Inter', fontSize: 17, fontWeight: FontWeight.w700), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)))),
    outlinedButtonTheme: OutlinedButtonThemeData(style: OutlinedButton.styleFrom(foregroundColor: kInk, minimumSize: const Size(64, 52), side: const BorderSide(color: kLine, width: 1.5),
        textStyle: TextStyle(fontFamily: 'Inter', fontSize: 16, fontWeight: FontWeight.w600), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)))),
    inputDecorationTheme: InputDecorationTheme(filled: true, fillColor: kCard, contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: kLine, width: 1.5)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: kLine, width: 1.5)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: kGreen, width: 2))),
    chipTheme: base.chipTheme.copyWith(backgroundColor: kPaper2, selectedColor: kGreen, side: const BorderSide(color: kLine), labelStyle: TextStyle(fontFamily: 'Inter', fontSize: 15, fontWeight: FontWeight.w600, color: kInk),
        secondaryLabelStyle: TextStyle(fontFamily: 'Inter', fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white), padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8), showCheckmark: false),
    cardTheme: CardThemeData(color: kCard, elevation: 0, margin: EdgeInsets.zero, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: const BorderSide(color: kLine))),
    snackBarTheme: const SnackBarThemeData(behavior: SnackBarBehavior.floating),
  );
}

/// Ruled copybook lines behind a page.
class Ruled extends StatelessWidget {
  final Widget child;
  const Ruled({super.key, required this.child});
  @override
  Widget build(BuildContext context) => CustomPaint(painter: _RulePainter(), child: child);
}

class _RulePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()..color = kRule.withValues(alpha: .35)..strokeWidth = 1;
    for (double y = 31; y < size.height; y += 32) { canvas.drawLine(Offset(0, y), Offset(size.width, y), p); }
  }
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// An archive photograph taped into the copybook, as on the website.
class TapedPhoto extends StatelessWidget {
  final String asset, caption;
  final double tilt;
  const TapedPhoto({super.key, required this.asset, required this.caption, this.tilt = 0});
  @override
  Widget build(BuildContext context) => Transform.rotate(angle: tilt * 3.14159 / 180, child: Stack(clipBehavior: Clip.none, children: [
    Container(padding: const EdgeInsets.fromLTRB(8, 8, 8, 10), decoration: BoxDecoration(color: kCard, borderRadius: BorderRadius.circular(3), boxShadow: const [BoxShadow(color: Color(0x33000000), blurRadius: 18, offset: Offset(0, 8))]),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
        Image.asset(asset, fit: BoxFit.cover, color: const Color(0x14B8862B), colorBlendMode: BlendMode.multiply),
        const SizedBox(height: 7),
        Text(caption, style: display(12, color: kMuted, style: FontStyle.italic, weight: FontWeight.w500)),
      ])),
    Positioned(top: -10, left: 0, right: 0, child: Center(child: Transform.rotate(angle: -.05, child: Container(width: 76, height: 20, color: const Color(0xD1E8DEC4))))),
  ]));
}
