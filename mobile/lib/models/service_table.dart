const List<String> typeServiceValues = ['AUCUN_SERVICE', 'BUFFET', 'SERVICE_A_TABLE'];

String typeServiceLabel(String v) => {
      'AUCUN_SERVICE': 'Aucun service',
      'BUFFET': 'Buffet',
      'SERVICE_A_TABLE': 'Service à table',
    }[v] ??
    v;

class ServiceTableItem {
  ServiceTableItem({
    required this.id,
    required this.typeService,
    this.traiteurId,
    this.traiteurNom,
    required this.prixParPersonne,
    required this.nombreInvites,
    required this.total,
  });

  final String id;
  final String typeService;
  final String? traiteurId;
  final String? traiteurNom;
  final num prixParPersonne;
  final int nombreInvites;
  final num total;

  factory ServiceTableItem.fromJson(Map<String, dynamic> json) => ServiceTableItem(
        id: json['id'] as String,
        typeService: json['typeService'] as String,
        traiteurId: json['traiteurId'] as String?,
        traiteurNom: (json['traiteur'] as Map<String, dynamic>?)?['nom'] as String?,
        prixParPersonne: num.tryParse((json['prixParPersonne'] ?? 0).toString()) ?? 0,
        nombreInvites: json['nombreInvites'] as int? ?? 0,
        total: num.tryParse((json['total'] ?? 0).toString()) ?? 0,
      );
}
