import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kasrevent_mobile/core/api_client.dart';
import 'package:kasrevent_mobile/widgets/simple_crud_screen.dart';

void main() {
  group('normalizeUrl', () {
    // Found during the functional audit: a bare domain/path (e.g. a Google Maps link
    // copied without "https://") previously failed the server's strict URL validation
    // with no explanation visible to the user — this is what made "adding a Salle" look
    // like it silently did nothing.
    test('prepends https:// to a bare domain', () {
      expect(normalizeUrl('maps.google.com/xyz'), 'https://maps.google.com/xyz');
    });

    test('leaves an already-qualified https URL untouched', () {
      expect(normalizeUrl('https://maps.google.com/xyz'), 'https://maps.google.com/xyz');
    });

    test('leaves an already-qualified http URL untouched', () {
      expect(normalizeUrl('http://example.com'), 'http://example.com');
    });
  });

  group('apiErrorMessage field-error surfacing', () {
    test('unpacks Zod fieldErrors into a readable message', () {
      final error = DioException(
        requestOptions: RequestOptions(path: '/salles'),
        response: Response(
          requestOptions: RequestOptions(path: '/salles'),
          statusCode: 400,
          data: {
            'error': 'Validation failed',
            'details': {
              'fieldErrors': {
                'lienLocalisation': ['Invalid url']
              }
            }
          },
        ),
      );
      final message = apiErrorMessage(error);
      expect(message, contains('Validation failed'));
      expect(message, contains('lienLocalisation'));
      expect(message, contains('Invalid url'));
    });

    test('falls back to the plain error message when there are no field errors', () {
      final error = DioException(
        requestOptions: RequestOptions(path: '/auth/login'),
        response: Response(
          requestOptions: RequestOptions(path: '/auth/login'),
          statusCode: 401,
          data: {'error': 'Invalid email or password'},
        ),
      );
      expect(apiErrorMessage(error), 'Invalid email or password');
    });
  });
}
