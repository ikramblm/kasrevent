class Employe {
  Employe({
    required this.id,
    required this.nom,
    this.prenom,
    required this.role,
    this.telephone,
    this.email,
    required this.disponibilite,
    required this.typePaie,
    this.paieMensuelle,
    this.paieParJour,
    required this.montantAPayer,
    this.jourDePaie,
  });

  final String id;
  final String nom;
  final String? prenom;
  final String role;
  final String? telephone;
  final String? email;
  final bool disponibilite;
  final String typePaie; // MENSUELLE | JOURNALIERE
  final num? paieMensuelle;
  final num? paieParJour;
  final num montantAPayer;
  final int? jourDePaie;

  factory Employe.fromJson(Map<String, dynamic> json) => Employe(
        id: json['id'] as String,
        nom: json['nom'] as String,
        prenom: json['prenom'] as String?,
        role: json['role'] as String,
        telephone: json['telephone'] as String?,
        email: json['email'] as String?,
        disponibilite: json['disponibilite'] as bool? ?? true,
        typePaie: json['typePaie'] as String,
        paieMensuelle: json['paieMensuelle'] == null ? null : num.tryParse(json['paieMensuelle'].toString()),
        paieParJour: json['paieParJour'] == null ? null : num.tryParse(json['paieParJour'].toString()),
        montantAPayer: num.tryParse((json['montantAPayer'] ?? 0).toString()) ?? 0,
        jourDePaie: json['jourDePaie'] as int?,
      );

  Map<String, dynamic> toJson() => {
        'nom': nom,
        if (prenom != null && prenom!.isNotEmpty) 'prenom': prenom,
        'role': role,
        if (telephone != null && telephone!.isNotEmpty) 'telephone': telephone,
        'typePaie': typePaie,
        if (paieMensuelle != null) 'paieMensuelle': paieMensuelle,
        if (paieParJour != null) 'paieParJour': paieParJour,
        if (jourDePaie != null) 'jourDePaie': jourDePaie,
      };
}
