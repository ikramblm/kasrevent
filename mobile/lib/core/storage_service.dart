import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Wraps the platform keystore/keychain for the JWT — never plain SharedPreferences,
/// since this token grants full API access.
class StorageService {
  static const _tokenKey = 'kasrevent_token';
  final _storage = const FlutterSecureStorage();

  Future<String?> readToken() => _storage.read(key: _tokenKey);

  Future<void> writeToken(String token) => _storage.write(key: _tokenKey, value: token);

  Future<void> clearToken() => _storage.delete(key: _tokenKey);
}
