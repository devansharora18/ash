import 'package:flutter_test/flutter_test.dart';

import 'package:ash_mobile/main.dart';
import 'package:ash_mobile/services/settings_service.dart';

void main() {
  testWidgets('home screen renders brand and actions', (WidgetTester tester) async {
    await tester.pumpWidget(
      AshApp(initialSettings: SettingsService.defaultSettings()),
    );

    expect(find.text('ash'), findsOneWidget);
    expect(find.text('Create instant room'), findsOneWidget);
    expect(find.text('Join room'), findsOneWidget);
  });
}