import 'client.dart';
import 'salle.dart';

enum StatutReservation { enAttente, confirmee, annulee, cloture }

StatutReservation statutFromJson(String v) {
  switch (v) {
    case 'CONFIRMEE':
      return StatutReservation.confirmee;
    case 'ANNULEE':
      return StatutReservation.annulee;
    case 'CLOTURE':
      return StatutReservation.cloture;
    default:
      return StatutReservation.enAttente;
  }
}

String statutToJson(StatutReservation s) => {
      StatutReservation.enAttente: 'EN_ATTENTE',
      StatutReservation.confirmee: 'CONFIRMEE',
      StatutReservation.annulee: 'ANNULEE',
      StatutReservation.cloture: 'CLOTURE',
    }[s]!;

String statutLabel(StatutReservation s) => {
      StatutReservation.enAttente: 'En attente',
      StatutReservation.confirmee: 'Confirmée',
      StatutReservation.annulee: 'Annulée',
      StatutReservation.cloture: 'Clôturé',
    }[s]!;

const List<String> typesEvenement = ['MARIAGE', 'SEMINAIRE', 'ANNIVERSAIRE', 'EVENEMENT', 'AUTRE'];

String typeEvenementLabel(String v) => {
      'MARIAGE': 'Mariage',
      'SEMINAIRE': 'Séminaire',
      'ANNIVERSAIRE': 'Anniversaire',
      'EVENEMENT': 'Évènement',
      'AUTRE': 'Autre',
    }[v] ??
    v;

class Reservation {
  Reservation({
    required this.id,
    required this.clientId,
    required this.dateDebut,
    required this.dateFin,
    required this.typeEvenement,
    required this.nombreInvites,
    required this.statut,
    required this.totalAPayer,
    required this.avanceVersee,
    required this.resteAPayer,
    required this.confiscationPolicy,
    required this.creerFacture,
    this.client,
    this.salle,
    this.salleId,
    this.invitationLink,
  });

  final String id;
  final String clientId;
  final String? salleId;
  final DateTime dateDebut;
  final DateTime dateFin;
  final String typeEvenement;
  final int nombreInvites;
  final StatutReservation statut;
  final num totalAPayer;
  final num avanceVersee;
  final num resteAPayer;
  final bool confiscationPolicy;
  final bool creerFacture;
  final Client? client;
  final Salle? salle;
  final String? invitationLink;

  factory Reservation.fromJson(Map<String, dynamic> json) => Reservation(
        id: json['id'] as String,
        clientId: json['clientId'] as String,
        salleId: json['salleId'] as String?,
        dateDebut: DateTime.parse(json['dateDebut'] as String),
        dateFin: DateTime.parse(json['dateFin'] as String),
        typeEvenement: json['typeEvenement'] as String,
        nombreInvites: json['nombreInvites'] as int,
        statut: statutFromJson(json['statut'] as String),
        totalAPayer: num.tryParse(json['totalAPayer'].toString()) ?? 0,
        avanceVersee: num.tryParse(json['avanceVersee'].toString()) ?? 0,
        resteAPayer: num.tryParse((json['resteAPayer'] ?? 0).toString()) ?? 0,
        confiscationPolicy: json['confiscationPolicy'] as bool? ?? false,
        creerFacture: json['creerFacture'] as bool? ?? false,
        client: json['client'] != null ? Client.fromJson(json['client'] as Map<String, dynamic>) : null,
        salle: json['salle'] != null ? Salle.fromJson(json['salle'] as Map<String, dynamic>) : null,
        invitationLink: json['invitationLink'] as String?,
      );
}
