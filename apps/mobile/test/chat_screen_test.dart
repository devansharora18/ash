import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ash_mobile/features/chat/chat_screen.dart';
import 'package:ash_mobile/services/signaling.dart';
import 'package:ash_mobile/theme.dart';

class _FakeSignalClient implements SignalClient {
  final _ctrl = StreamController<SignalEvent>();

  @override
  Stream<SignalEvent> get events => _ctrl.stream;

  @override
  void send(String to, Object data) {}

  @override
  void close() {
    _ctrl.close();
  }
}

Widget _wrap() => MaterialApp(
      theme: ashTheme(),
      home: ChatScreen(
        displayName: 'peer_ab12',
        backendUrl: 'http://localhost:8000',
        roomId: 'testroom123',
        connectClient: ({required backendUrl, required roomId, required peerId}) =>
            _FakeSignalClient(),
      ),
    );

void main() {
  testWidgets('chat screen renders and sends a message', (WidgetTester tester) async {
    await tester.pumpWidget(_wrap());
    await tester.pump();

    expect(find.text('peer_ab12'), findsOneWidget);
    expect(find.text('#testroom'), findsOneWidget);
    expect(find.text('0 peers'), findsOneWidget);

    await tester.enterText(find.byType(TextField), 'hello ash');
    await tester.pump();
    await tester.tap(find.byIcon(Icons.arrow_upward));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pump();

    expect(find.text('hello ash'), findsOneWidget);
  });

  testWidgets('leave flow opens and closes dialog', (WidgetTester tester) async {
    await tester.pumpWidget(_wrap());
    await tester.pump();

    await tester.tap(find.byIcon(Icons.logout));
    await tester.pump();
    expect(find.text('Destroy Session?'), findsOneWidget);

    await tester.tap(find.text('Stay'));
    await tester.pump();
    expect(find.text('Destroy Session?'), findsNothing);
  });
}