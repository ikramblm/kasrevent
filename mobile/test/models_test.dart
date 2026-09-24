import 'package:flutter_test/flutter_test.dart';
import 'package:kasrevent_mobile/models/reservation.dart';
import 'package:kasrevent_mobile/models/user.dart';
import 'package:kasrevent_mobile/core/api_client.dart';
import 'package:dio/dio.dart';

void main() {
  group('StatutReservation', () {
    test('round-trips every value through fromJson/toJson', () {
      for (final raw in ['EN_ATTENTE', 'CONFIRMEE', 'ANNULEE', 'CLOTURE']) {
        expect(statutToJson(statutFromJson(raw)), raw);
      }
    });

    test('falls back to EN_ATTENTE for an unrecognized value', () {
      expect(statutFromJson('SOMETHING_UNKNOWN'), StatutReservation.enAttente);
    });
  });

  group('Role', () {
    test('maps ADMIN/GERANT/USER correctly', () {
      expect(roleFromJson('ADMIN'), Role.admin);
      expect(roleFromJson('GERANT'), Role.gerant);
      expect(roleFromJson('USER'), Role.user);
    });

    test('defaults unknown roles to USER (least privilege)', () {
      expect(roleFromJson('SOMETHING_ELSE'), Role.user);
    });
  });

  group('Reservation.fromJson', () {
    test('parses a typical API response, including nested client/salle', () {
      final json = {
        'id': 'res-1',
        'clientId': 'client-1',
        'salleId': 'salle-1',
        'dateDebut': '2026-07-01T00:00:00.000Z',
        'dateFin': '2026-07-02T00:00:00.000Z',
        'typeEvenement': 'MARIAGE',
        'nombreInvites': 120,
        'statut': 'CONFIRMEE',
        'totalAPayer': '150000',
        'avanceVersee': '50000',
        'resteAPayer': 100000,
        'confiscationPolicy': true,
        'creerFacture': false,
        'client': {'id': 'client-1', 'nom': 'Benali'},
        'salle': {'id': 'salle-1', 'nom': 'Salle Royale'},
      };

      final reservation = Reservation.fromJson(json);

      expect(reservation.statut, StatutReservation.confirmee);
      expect(reservation.totalAPayer, 150000);
      expect(reservation.resteAPayer, 100000);
      expect(reservation.client?.nom, 'Benali');
      expect(reservation.salle?.nom, 'Salle Royale');
      expect(reservation.confiscationPolicy, isTrue);
    });
  });

  group('apiErrorMessage', () {
    test('extracts the backend { error } message from a DioException', () {
      final error = DioException(
        requestOptions: RequestOptions(path: '/reservations'),
        response: Response(
          requestOptions: RequestOptions(path: '/reservations'),
          statusCode: 409,
          data: {'error': 'Cette salle est déjà réservée pour cette période'},
        ),
      );
      expect(apiErrorMessage(error), 'Cette salle est déjà réservée pour cette période');
    });

    test('falls back to the generic message for a non-Dio error', () {
      expect(apiErrorMessage(Exception('boom'), fallback: 'Oops'), 'Oops');
    });
  });
}
