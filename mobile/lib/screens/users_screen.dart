import 'package:flutter/material.dart';
import '../models/user.dart';
import '../routes.dart';
import '../widgets/simple_crud_screen.dart';

class UsersScreen extends StatelessWidget {
  const UsersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SimpleCrudScreen<AppUser>(
      title: 'Utilisateurs',
      route: routeUtilisateurs,
      endpoint: '/users',
      addButtonLabel: 'Nouvel utilisateur',
      fromJson: AppUser.fromJson,
      idOf: (u) => u.id,
      searchText: (u) => '${u.nom} ${u.email ?? ''}',
      fields: const [
        CrudField(name: 'nom', label: 'Nom', required: true),
        CrudField(name: 'email', label: 'Email', type: CrudFieldType.email, required: true),
        CrudField(
          name: 'role',
          label: 'Rôle',
          type: CrudFieldType.select,
          required: true,
          options: [MapEntry('USER', 'Utilisateur'), MapEntry('GERANT', 'Gérant'), MapEntry('ADMIN', 'Admin')],
        ),
        CrudField(name: 'password', label: 'Mot de passe temporaire (8+ car.)', required: true),
      ],
      itemBuilder: (context, u) => Card(
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: ListTile(
          leading: const CircleAvatar(child: Icon(Icons.person_outline)),
          title: Text(u.nom),
          subtitle: Text(u.email ?? ''),
          trailing: Chip(label: Text(roleLabel(u.role)), visualDensity: VisualDensity.compact),
        ),
      ),
    );
  }
}
