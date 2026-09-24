import 'package:flutter/material.dart';
import 'app_drawer.dart';

/// Shared Scaffold (AppBar + role-filtered Drawer) so every screen doesn't repeat it.
class AppScaffold extends StatelessWidget {
  const AppScaffold({super.key, required this.title, required this.route, required this.body, this.actions, this.floatingActionButton});

  final String title;
  final String route;
  final Widget body;
  final List<Widget>? actions;
  final Widget? floatingActionButton;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title), actions: actions),
      drawer: AppDrawer(currentRoute: route),
      body: body,
      floatingActionButton: floatingActionButton,
    );
  }
}
