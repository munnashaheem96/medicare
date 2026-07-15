import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:medi_care_plus/main.dart';
import 'package:medi_care_plus/services/firebase_service.dart';
import 'package:medi_care_plus/services/notification_service.dart';
import 'package:firebase_auth/firebase_auth.dart';

class MockFirebaseService extends Fake implements FirebaseService {
  @override
  Stream<User?> get authStateChanges => Stream.value(null);
}

class MockNotificationService extends Fake implements NotificationService {}

void main() {
  testWidgets('Login screen smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          Provider<FirebaseService>(create: (_) => MockFirebaseService()),
          Provider<NotificationService>(create: (_) => MockNotificationService()),
        ],
        child: const MedicareApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('MediCare+'), findsOneWidget);
    expect(find.text('Medicine Tracker & Support System'), findsOneWidget);
  });
}
