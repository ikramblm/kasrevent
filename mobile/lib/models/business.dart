class Business {
  Business({required this.id, required this.nom, this.adminNom, this.adminEmail, required this.createdAt});

  final String id;
  final String nom;
  final String? adminNom;
  final String? adminEmail;
  final DateTime createdAt;

  factory Business.fromJson(Map<String, dynamic> json) => Business(
        id: json['id'] as String,
        nom: json['nom'] as String,
        adminNom: json['adminNom'] as String?,
        adminEmail: json['adminEmail'] as String?,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}
