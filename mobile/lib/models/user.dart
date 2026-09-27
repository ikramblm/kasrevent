enum Role { superadmin, admin, gerant, user }

Role roleFromJson(String value) {
  switch (value) {
    case 'SUPERADMIN':
      return Role.superadmin;
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
    case Role.superadmin:
      return 'Super Admin';
    case Role.admin:
      return 'Admin';
    case Role.gerant:
      return 'Gérant';
    case Role.user:
      return 'Utilisateur';
  }
}

class AppUser {
  AppUser({required this.id, required this.nom, required this.role, this.email, this.telephone, this.businessId});

  final String id;
  final String nom;
  final Role role;
  final String? email;
  final String? telephone;
  final String? businessId;

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'] as String,
        nom: json['nom'] as String,
        role: roleFromJson(json['role'] as String),
        email: json['email'] as String?,
        telephone: json['telephone'] as String?,
        businessId: json['businessId'] as String?,
      );
}
