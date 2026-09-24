class Traiteur {
  Traiteur({required this.id, required this.nom, this.telephone, required this.dettes, this.siteWeb});

  final String id;
  final String nom;
  final String? telephone;
  final num dettes;
  final String? siteWeb;

  factory Traiteur.fromJson(Map<String, dynamic> json) => Traiteur(
        id: json['id'] as String,
        nom: json['nom'] as String,
        telephone: json['telephone'] as String?,
        dettes: num.tryParse((json['dettes'] ?? 0).toString()) ?? 0,
        siteWeb: json['siteWeb'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'nom': nom,
        if (telephone != null && telephone!.isNotEmpty) 'telephone': telephone,
        if (siteWeb != null && siteWeb!.isNotEmpty) 'siteWeb': siteWeb,
      };
}
