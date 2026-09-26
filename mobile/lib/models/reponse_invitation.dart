class ReponseInvitation {
  ReponseInvitation({required this.id, required this.nomPrenom, this.numeroTelephone, required this.createdAt});

  final String id;
  final String nomPrenom;
  final String? numeroTelephone;
  final DateTime createdAt;

  factory ReponseInvitation.fromJson(Map<String, dynamic> json) => ReponseInvitation(
        id: json['id'] as String,
        nomPrenom: json['nomPrenom'] as String,
        numeroTelephone: json['numeroTelephone'] as String?,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}
