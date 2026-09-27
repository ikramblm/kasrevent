import 'package:flutter/material.dart';
import '../models/business.dart';
import '../routes.dart';
import '../widgets/simple_crud_screen.dart';

class BusinessesScreen extends StatelessWidget {
  const BusinessesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SimpleCrudScreen<Business>(
      title: 'Entreprises',
      route: routeBusinesses,
      endpoint: '/businesses',
      addButtonLabel: 'Nouvelle entreprise',
      canDelete: false,
      fromJson: Business.fromJson,
      idOf: (b) => b.id,
      searchText: (b) => '${b.nom} ${b.adminEmail ?? ''}',
      fields: const [
        CrudField(name: 'businessNom', label: "Nom de l'entreprise", required: true),
        CrudField(name: 'adminNom', label: "Nom de l'admin", required: true),
        CrudField(name: 'adminEmail', label: "Email de l'admin", type: CrudFieldType.email, required: true),
        CrudField(name: 'adminPassword', label: 'Mot de passe temporaire (8+ car.)', type: CrudFieldType.password, required: true),
      ],
      itemBuilder: (context, b) => Card(
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: ListTile(
          leading: const CircleAvatar(child: Icon(Icons.business_outlined)),
          title: Text(b.nom),
          subtitle: Text([if (b.adminNom != null) b.adminNom!, if (b.adminEmail != null) b.adminEmail!].join(' — ')),
        ),
      ),
    );
  }
}
