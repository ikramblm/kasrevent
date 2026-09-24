class Fournisseur {
  Fournisseur({required this.id, required this.company, this.nom, this.tel, required this.dettes});

  final String id;
  final String company;
  final String? nom;
  final String? tel;
  final num dettes;

  factory Fournisseur.fromJson(Map<String, dynamic> json) => Fournisseur(
        id: json['id'] as String,
        company: json['company'] as String,
        nom: json['nom'] as String?,
        tel: json['tel'] as String?,
        dettes: num.tryParse((json['dettes'] ?? 0).toString()) ?? 0,
      );

  Map<String, dynamic> toJson() => {
        'company': company,
        if (nom != null && nom!.isNotEmpty) 'nom': nom,
        if (tel != null && tel!.isNotEmpty) 'tel': tel,
      };
}
