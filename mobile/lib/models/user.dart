enum Role { admin, gerant, user }

Role roleFromJson(String value) {
  switch (value) {
    case 'ADMIN':
      return Role.admin;
    case 'GERANT':
      return Role.gerant;
    default:
      return Role.user;
  }
}

String roleLabel(Role role) {
  switch (role) {
    case Role.admin:
      return 'Admin';
    case Role.gerant:
      return 'Gérant';
    case Role.user:
      return 'Utilisateur';
  }
}

class AppUser {
  AppUser({required this.id, required this.nom, required this.role, this.email, this.telephone});

  final String id;
  final String nom;
  final Role role;
  final String? email;
  final String? telephone;

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'] as String,
        nom: json['nom'] as String,
        role: roleFromJson(json['role'] as String),
        email: json['email'] as String?,
        telephone: json['telephone'] as String?,
      );
}
