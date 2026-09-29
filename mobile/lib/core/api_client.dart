import 'package:dio/dio.dart';
import 'config.dart';
import 'storage_service.dart';

/// Thin Dio wrapper: injects the JWT on every request, and calls [onUnauthorized]
/// (wired up by AuthProvider) whenever the API returns 401 — mirrors the axios
/// interceptor pattern used by the web dashboard's api/client.ts.
class ApiClient {
  ApiClient(this._storage) {
    dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      // No receiveTimeout previously meant a dropped connection (common on a long,
      // flaky mobile path to the backend) would just hang indefinitely instead of
      // surfacing promptly as the connection error it is.
      receiveTimeout: const Duration(seconds: 20),
    ));
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
/// True when Dio never got a response at all (dropped connection, timeout, DNS failure —
/// anything short of the server actually replying). The request may well have reached the
/// server and completed; only the response was lost on the way back. Distinct from a real
/// rejection (4xx/5xx with a body), which means the action genuinely did not happen.
bool isConnectionError(Object error) => error is DioException && error.response == null;

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
