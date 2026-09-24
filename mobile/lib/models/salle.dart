class Salle {
  Salle({
    required this.id,
    required this.nom,
    this.localisation,
    this.capacite,
    this.tarif,
    this.equipementsInclus = const [],
    this.lienLocalisation,
  });

  final String id;
  final String nom;
  final String? localisation;
  final int? capacite;
  final num? tarif;
  final List<String> equipementsInclus;
  final String? lienLocalisation;

  factory Salle.fromJson(Map<String, dynamic> json) => Salle(
        id: json['id'] as String,
        nom: json['nom'] as String,
        localisation: json['localisation'] as String?,
        capacite: json['capacite'] as int?,
        tarif: json['tarif'] == null ? null : num.tryParse(json['tarif'].toString()),
        equipementsInclus: (json['equipementsInclus'] as List?)?.map((e) => e.toString()).toList() ?? const [],
        lienLocalisation: json['lienLocalisation'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'nom': nom,
        if (localisation != null && localisation!.isNotEmpty) 'localisation': localisation,
        if (capacite != null) 'capacite': capacite,
        if (tarif != null) 'tarif': tarif,
        if (lienLocalisation != null && lienLocalisation!.isNotEmpty) 'lienLocalisation': lienLocalisation,
      };
}
