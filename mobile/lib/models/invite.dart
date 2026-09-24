class Invite {
  Invite({
    required this.id,
    required this.reservationId,
    required this.nom,
    this.prenom,
    this.telephone,
    required this.statut,
    this.heureEntree,
    required this.qrCodeToken,
  });

  final String id;
  final String reservationId;
  final String nom;
  final String? prenom;
  final String? telephone;
  final String statut;
  final DateTime? heureEntree;
  final String qrCodeToken;

  factory Invite.fromJson(Map<String, dynamic> json) => Invite(
        id: json['id'] as String,
        reservationId: json['reservationId'] as String,
        nom: json['nom'] as String,
        prenom: json['prenom'] as String?,
        telephone: json['telephone'] as String?,
        statut: json['statut'] as String,
        heureEntree: json['heureEntree'] == null ? null : DateTime.parse(json['heureEntree'] as String),
        qrCodeToken: json['qrCodeToken'] as String,
      );
}
