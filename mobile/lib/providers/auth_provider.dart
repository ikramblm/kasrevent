import 'package:flutter/foundation.dart';
import '../core/api_client.dart';
import '../core/storage_service.dart';
import '../models/user.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

/// Holds the signed-in user + JWT lifecycle. Mirrors the web dashboard's AuthContext:
/// on startup, tries to restore a session from the stored token via GET /auth/me;
/// on 401 from anywhere in the app, force-logs-out.
class AuthProvider extends ChangeNotifier {
  AuthProvider(this._api, this._storage) {
    _api.onUnauthorized = _handleUnauthorized;
    _restoreSession();
  }

  final ApiClient _api;
  final StorageService _storage;

  AuthStatus status = AuthStatus.unknown;
  AppUser? user;
  String? lastError;

  Future<void> _restoreSession() async {
    final token = await _storage.readToken();
    if (token == null) {
      status = AuthStatus.unauthenticated;
      notifyListeners();
      return;
    }
    try {
      final res = await _api.dio.get('/auth/me');
      user = AppUser.fromJson(res.data as Map<String, dynamic>);
      status = AuthStatus.authenticated;
    } catch (_) {
      await _storage.clearToken();
      status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    lastError = null;
    try {
      final res = await _api.dio.post('/auth/login', data: {'email': email, 'password': password});
      final token = res.data['token'] as String;
      await _storage.writeToken(token);
      user = AppUser.fromJson(res.data['user'] as Map<String, dynamic>);
      status = AuthStatus.authenticated;
      notifyListeners();
      return true;
    } catch (e) {
      lastError = apiErrorMessage(e, fallback: 'Email ou mot de passe invalide.');
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _storage.clearToken();
    user = null;
    status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  void _handleUnauthorized() {
    if (status == AuthStatus.authenticated) {
      user = null;
      status = AuthStatus.unauthenticated;
      notifyListeners();
    }
  }
}
