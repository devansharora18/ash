import 'package:flutter/material.dart';

import '../../theme.dart';

/// A whiteboard stroke. Points are normalized (0..1) so clients of any size
/// render the same drawing; color is a `#RRGGBB` hex string for sync.
typedef BoardStroke = Map<String, dynamic>;

Color colorFromHex(String hex) {
  final v = int.parse(hex.replaceFirst('#', ''), radix: 16);
  return Color(0xFF000000 | v);
}

const _palette = ['#00d9ff', '#ffffff', '#000000', '#22c55e', '#eab308', '#ef4444', '#a855f7'];
const _widths = [2, 5, 10];

class Whiteboard extends StatefulWidget {
  const Whiteboard({
    super.key,
    required this.strokes,
    required this.onStrokeStart,
    required this.onStrokePoint,
    required this.onStrokeEnd,
    required this.onClear,
  });

  final List<BoardStroke> strokes;
  final void Function(double x, double y, String color, int width) onStrokeStart;
  final void Function(double x, double y) onStrokePoint;
  final VoidCallback onStrokeEnd;
  final VoidCallback onClear;

  @override
  State<Whiteboard> createState() => _WhiteboardState();
}

class _WhiteboardState extends State<Whiteboard> {
  bool _drawing = false;
  String _color = _palette[0];
  int _width = _widths[0];

  void _start(Offset pos, Size size) {
    if (size.width == 0 || size.height == 0) return;
    _drawing = true;
    widget.onStrokeStart(pos.dx / size.width, pos.dy / size.height, _color, _width);
  }

  void _move(Offset pos, Size size) {
    if (!_drawing || size.width == 0 || size.height == 0) return;
    widget.onStrokePoint(pos.dx / size.width, pos.dy / size.height);
  }

  void _end() {
    if (!_drawing) return;
    _drawing = false;
    widget.onStrokeEnd();
  }

  Widget _swatch(String hex) {
    return GestureDetector(
      onTap: () => setState(() => _color = hex),
      child: Container(
        width: 24,
        height: 24,
        decoration: BoxDecoration(
          color: colorFromHex(hex),
          shape: BoxShape.circle,
          border: Border.all(
            color: _color == hex ? AshColors.tertiary : AshColors.surfaceContainerHigh,
            width: 2,
          ),
        ),
      ),
    );
  }

  Widget _widthDot(int w) {
    return GestureDetector(
      onTap: () => setState(() => _width = w),
      child: Container(
        width: 28,
        height: 28,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: _width == w
              ? AshColors.surfaceContainerHigh
              : Colors.transparent,
          shape: BoxShape.circle,
        ),
        child: Container(
          width: w.toDouble(),
          height: w.toDouble(),
          decoration: const BoxDecoration(shape: BoxShape.circle, color: AshColors.tertiary),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            children: [
              for (final c in _palette) ...[_swatch(c), const SizedBox(width: 6)],
              const SizedBox(width: 6),
              for (final w in _widths) _widthDot(w),
              const Spacer(),
              IconButton(
                iconSize: 20,
                color: AshColors.outline,
                onPressed: widget.onClear,
                icon: const Icon(Icons.auto_fix_normal),
              ),
            ],
          ),
        ),
        Expanded(
          child: Container(
            color: AshColors.surfaceContainerLowest,
            child: LayoutBuilder(builder: (context, constraints) {
              final size = Size(constraints.maxWidth, constraints.maxHeight);
              return GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTapDown: (d) => _start(d.localPosition, size),
                onPanStart: (d) => _start(d.localPosition, size),
                onPanUpdate: (d) => _move(d.localPosition, size),
                onPanEnd: (_) => _end(),
                onPanCancel: _end,
                child: CustomPaint(
                  size: size,
                  painter: _BoardPainter(widget.strokes),
                ),
              );
            }),
          ),
        ),
      ],
    );
  }
}

class _BoardPainter extends CustomPainter {
  _BoardPainter(this.strokes);

  final List<BoardStroke> strokes;

  @override
  void paint(Canvas canvas, Size size) {
    for (final stroke in strokes) {
      final points = (stroke['points'] as List?) ?? const [];
      if (points.length < 2) continue;
      final paint = Paint()
        ..color = colorFromHex(stroke['color'] as String? ?? '#ffffff')
        ..strokeWidth = ((stroke['width'] as num?) ?? 5).toDouble()
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round
        ..style = PaintingStyle.stroke;
      final path = Path();
      void move(Map point) =>
          path.moveTo(((point['x'] as num).toDouble()) * size.width,
              ((point['y'] as num).toDouble()) * size.height);
      void line(Map point) =>
          path.lineTo(((point['x'] as num).toDouble()) * size.width,
              ((point['y'] as num).toDouble()) * size.height);
      move(points[0] as Map);
      for (var i = 1; i < points.length; i++) {
        line(points[i] as Map);
      }
      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(_BoardPainter old) => old.strokes != strokes;
}