const List<String> typeDecorationValues = ['FLEURS', 'TAPIS', 'CHAISES', 'TABLES', 'SCULPTURE'];

class DecorationItem {
  DecorationItem({required this.id, required this.nom, required this.type, this.stockDisponible, this.prixLocation});

  final String id;
  final String nom;
  final String type;
  final int? stockDisponible;
  final num? prixLocation;

  factory DecorationItem.fromJson(Map<String, dynamic> json) => DecorationItem(
        id: json['id'] as String,
        nom: json['nom'] as String,
        type: json['type'] as String,
        stockDisponible: json['stockDisponible'] as int?,
        prixLocation: json['prixLocation'] == null ? null : num.tryParse(json['prixLocation'].toString()),
      );

  Map<String, dynamic> toJson() => {
        'nom': nom,
        'type': type,
        if (stockDisponible != null) 'stockDisponible': stockDisponible,
        if (prixLocation != null) 'prixLocation': prixLocation,
      };
}
