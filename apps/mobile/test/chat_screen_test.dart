import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ash_mobile/features/chat/chat_screen.dart';
import 'package:ash_mobile/theme.dart';

void main() {
  testWidgets('chat screen renders and sends a message', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(theme: ashTheme(), home: const ChatScreen()),
    );

    expect(find.text('Encrypted Room'), findsOneWidget);
    expect(find.text('#x9-k2m'), findsOneWidget);
    expect(find.text('3 peers'), findsOneWidget);

    await tester.enterText(find.byType(TextField), 'hello ash');
    await tester.pump();
    await tester.tap(find.byIcon(Icons.arrow_upward));
    await tester.pump();
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pump();

    expect(find.text('hello ash'), findsOneWidget);
  });

  testWidgets('leave flow opens and closes dialog', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(theme: ashTheme(), home: const ChatScreen()),
    );

    await tester.tap(find.byIcon(Icons.logout));
    await tester.pump();
    expect(find.text('Destroy Session?'), findsOneWidget);

    await tester.tap(find.text('Stay'));
    await tester.pump();
    expect(find.text('Destroy Session?'), findsNothing);
  });
}
