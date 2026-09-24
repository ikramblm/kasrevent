class DashboardKpis {
  DashboardKpis({
    required this.chiffreAffaireTotal,
    required this.revenusNet,
    required this.charges,
    required this.paiementDeDettes,
    required this.investissements,
    required this.paiementSalaires,
    required this.creanceTotal,
  });

  final num chiffreAffaireTotal;
  final num revenusNet;
  final num charges;
  final num paiementDeDettes;
  final num investissements;
  final num paiementSalaires;
  final num creanceTotal;

  factory DashboardKpis.fromJson(Map<String, dynamic> json) => DashboardKpis(
        chiffreAffaireTotal: num.tryParse((json['chiffreAffaireTotal'] ?? 0).toString()) ?? 0,
        revenusNet: num.tryParse((json['revenusNet'] ?? 0).toString()) ?? 0,
        charges: num.tryParse((json['charges'] ?? 0).toString()) ?? 0,
        paiementDeDettes: num.tryParse((json['paiementDeDettes'] ?? 0).toString()) ?? 0,
        investissements: num.tryParse((json['investissements'] ?? 0).toString()) ?? 0,
        paiementSalaires: num.tryParse((json['paiementSalaires'] ?? 0).toString()) ?? 0,
        creanceTotal: num.tryParse((json['creanceTotal'] ?? 0).toString()) ?? 0,
      );
}
