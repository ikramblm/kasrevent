import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/user.dart';
import '../providers/auth_provider.dart';
import '../routes.dart';
import 'login_screen.dart';

/// Swaps between the login screen and the authenticated app (its own nested Navigator,
/// so drawer navigation / pushNamed works against routes.dart) based on AuthProvider.
class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    switch (auth.status) {
      case AuthStatus.unknown:
        return const Scaffold(body: Center(child: CircularProgressIndicator()));
      case AuthStatus.unauthenticated:
        return const LoginScreen();
      case AuthStatus.authenticated:
        // A Super Admin has no Business, so the normal Dashboard (which queries data
        // scoped to a business) doesn't apply to them — land on the businesses panel instead.
        final initialRoute = auth.user?.role == Role.superadmin ? routeBusinesses : routeDashboard;
        return Navigator(
          key: ValueKey(auth.user?.id),
          initialRoute: initialRoute,
          onGenerateRoute: generateAppRoute,
        );
    }
  }
}
