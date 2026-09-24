class Client {
  Client({required this.id, required this.nom, this.prenom, this.telephone, this.email, this.adresse});

  final String id;
  final String nom;
  final String? prenom;
  final String? telephone;
  final String? email;
  final String? adresse;

  String get fullName => [nom, prenom].where((s) => s != null && s.isNotEmpty).join(' ');

  factory Client.fromJson(Map<String, dynamic> json) => Client(
        id: json['id'] as String,
        nom: json['nom'] as String,
        prenom: json['prenom'] as String?,
        telephone: json['telephone'] as String?,
        email: json['email'] as String?,
        adresse: json['adresse'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'nom': nom,
        if (prenom != null && prenom!.isNotEmpty) 'prenom': prenom,
        if (telephone != null && telephone!.isNotEmpty) 'telephone': telephone,
        if (email != null && email!.isNotEmpty) 'email': email,
        if (adresse != null && adresse!.isNotEmpty) 'adresse': adresse,
      };
}
