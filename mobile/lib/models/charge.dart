const List<String> typeChargeValues = [
  'ACHAT',
  'APPROVISIONNEMENT',
  'PAIEMENT_SALAIRE',
  'PAIEMENT_DETTES_FOURNISSEURS',
  'PAIEMENT_DETTES_TRAITEURS',
  'PAIEMENT_FACTURES',
  'INVESTISSEMENT',
  'REPARATION',
  'AUTRE',
];

const Map<String, String> typeChargeLabels = {
  'ACHAT': 'Achat',
  'APPROVISIONNEMENT': 'Approvisionnement',
  'PAIEMENT_SALAIRE': 'Paiement salaire',
  'PAIEMENT_DETTES_FOURNISSEURS': 'Paiement dettes fournisseurs',
  'PAIEMENT_DETTES_TRAITEURS': 'Paiement dettes traiteurs',
  'PAIEMENT_FACTURES': 'Paiement factures',
  'INVESTISSEMENT': 'Investissement',
  'REPARATION': 'Réparation',
  'AUTRE': 'Autre',
};

class Charge {
  Charge({
    required this.id,
    required this.type,
    this.fournisseurId,
    this.traiteurId,
    this.employeId,
    required this.montantTotal,
    required this.montantPaye,
    required this.methodePaiement,
    required this.dateHeure,
    this.description,
    this.fournisseurLabel,
    this.traiteurLabel,
    this.employeLabel,
  });

  final String id;
  final String type;
  final String? fournisseurId;
  final String? traiteurId;
  final String? employeId;
  final num montantTotal;
  final num montantPaye;
  final String methodePaiement;
  final DateTime dateHeure;
  final String? description;
  final String? fournisseurLabel;
  final String? traiteurLabel;
  final String? employeLabel;

  factory Charge.fromJson(Map<String, dynamic> json) => Charge(
        id: json['id'] as String,
        type: json['type'] as String,
        fournisseurId: json['fournisseurId'] as String?,
        traiteurId: json['traiteurId'] as String?,
        employeId: json['employeId'] as String?,
        montantTotal: num.tryParse((json['montantTotal'] ?? 0).toString()) ?? 0,
        montantPaye: num.tryParse((json['montantPaye'] ?? 0).toString()) ?? 0,
        methodePaiement: json['methodePaiement'] as String,
        dateHeure: DateTime.parse(json['dateHeure'] as String),
        description: json['description'] as String?,
        fournisseurLabel: (json['fournisseur'] as Map<String, dynamic>?)?['company'] as String?,
        traiteurLabel: (json['traiteur'] as Map<String, dynamic>?)?['nom'] as String?,
        employeLabel: (json['employe'] as Map<String, dynamic>?)?['nom'] as String?,
      );
}
