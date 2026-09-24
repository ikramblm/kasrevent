class HistoriquePaieEntry {
  HistoriquePaieEntry({
    required this.id,
    this.moisPaye,
    required this.date,
    required this.montantPaye,
    required this.methodePaiement,
    required this.employeNom,
  });

  final String id;
  final String? moisPaye;
  final DateTime date;
  final num montantPaye;
  final String methodePaiement;
  final String employeNom;

  factory HistoriquePaieEntry.fromJson(Map<String, dynamic> json) => HistoriquePaieEntry(
        id: json['id'] as String,
        moisPaye: json['moisPaye'] as String?,
        date: DateTime.parse(json['date'] as String),
        montantPaye: num.tryParse((json['montantPaye'] ?? 0).toString()) ?? 0,
        methodePaiement: json['methodePaiement'] as String,
        employeNom: (json['employe'] as Map<String, dynamic>?)?['nom'] as String? ?? '—',
      );
}
