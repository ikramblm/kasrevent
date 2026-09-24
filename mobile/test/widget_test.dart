import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kasrevent_mobile/widgets/status_badge.dart';

void main() {
  testWidgets('StatusBadge renders the French label for a known status', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: Scaffold(body: StatusBadge(status: 'CONFIRMEE'))));
    expect(find.text('Confirmée'), findsOneWidget);
  });

  testWidgets('StatusBadge falls back to the raw value for an unknown status', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: Scaffold(body: StatusBadge(status: 'SOMETHING_ELSE'))));
    expect(find.text('SOMETHING_ELSE'), findsOneWidget);
  });
}
