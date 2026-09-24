import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/api_client.dart';
import 'core/storage_service.dart';
import 'core/theme.dart';
import 'providers/auth_provider.dart';
import 'screens/auth_gate.dart';

void main() {
  final storage = StorageService();
  final api = ApiClient(storage);

  runApp(
    MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: api),
        ChangeNotifierProvider(create: (_) => AuthProvider(api, storage)),
      ],
      child: const KasrEventApp(),
    ),
  );
}

class KasrEventApp extends StatelessWidget {
  const KasrEventApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'KasrEvent',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: const AuthGate(),
    );
  }
}
