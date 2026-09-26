import 'package:dio/dio.dart';
import 'config.dart';
import 'storage_service.dart';

/// Thin Dio wrapper: injects the JWT on every request, and calls [onUnauthorized]
/// (wired up by AuthProvider) whenever the API returns 401 — mirrors the axios
/// interceptor pattern used by the web dashboard's api/client.ts.
class ApiClient {
  ApiClient(this._storage) {
    dio = Dio(BaseOptions(baseUrl: AppConfig.apiBaseUrl, connectTimeout: const Duration(seconds: 15)));
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.readToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) {
          if (error.response?.statusCode == 401) {
            onUnauthorized?.call();
          }
          handler.next(error);
        },
      ),
    );
  }

  final StorageService _storage;
  late final Dio dio;
  void Function()? onUnauthorized;
}

/// Extracts a human-readable message from a failed API call, falling back to a
/// generic message when the backend didn't send a structured `{ error }` body.
///
/// Also unpacks Zod's `details.fieldErrors` (e.g. `{"lienLocalisation":["Invalid url"]}`)
/// so a generic "Validation failed" turns into something the user can actually act on —
/// previously this detail was silently dropped, which is why a bad URL/short password
/// looked like the form "did nothing" (found during the functional audit).
String apiErrorMessage(Object error, {String fallback = "Une erreur est survenue."}) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map) {
      final baseMessage = data['error'] is String ? data['error'] as String : fallback;
      final details = data['details'];
      if (details is Map && details['fieldErrors'] is Map) {
        final fieldErrors = details['fieldErrors'] as Map;
        final parts = <String>[];
        fieldErrors.forEach((field, messages) {
          if (messages is List && messages.isNotEmpty) {
            parts.add('$field: ${messages.join(", ")}');
          }
        });
        if (parts.isNotEmpty) return '$baseMessage — ${parts.join(" · ")}';
      }
      return baseMessage;
    }
  }
  return fallback;
}
