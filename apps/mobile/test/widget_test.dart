import 'package:flutter_test/flutter_test.dart';

import 'package:ash_mobile/main.dart';

void main() {
  testWidgets('home screen renders brand and actions', (WidgetTester tester) async {
    await tester.pumpWidget(const AshApp());

    expect(find.text('ash'), findsOneWidget);
    expect(find.text('Create instant room'), findsOneWidget);
    expect(find.text('Join room'), findsOneWidget);
  });
}
