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
String apiErrorMessage(Object error, {String fallback = "Une erreur est survenue."}) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map && data['error'] is String) return data['error'] as String;
  }
  return fallback;
}
