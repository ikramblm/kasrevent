class ConfiscationTelephone {
  ConfiscationTelephone({
    required this.id,
    required this.statut,
    this.numeroTelephone,
    required this.heureConfiscation,
    this.heureRestitution,
    this.inviteNom,
  });

  final String id;
  final String statut; // CONFISQUE | RESTITUE
  final String? numeroTelephone;
  final DateTime heureConfiscation;
  final DateTime? heureRestitution;
  final String? inviteNom;

  factory ConfiscationTelephone.fromJson(Map<String, dynamic> json) => ConfiscationTelephone(
        id: json['id'] as String,
        statut: json['statut'] as String,
        numeroTelephone: json['numeroTelephone'] as String?,
        heureConfiscation: DateTime.parse(json['heureConfiscation'] as String),
        heureRestitution: json['heureRestitution'] == null ? null : DateTime.parse(json['heureRestitution'] as String),
        inviteNom: (json['invite'] as Map<String, dynamic>?)?['nom'] as String?,
      );
}
