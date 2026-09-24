import 'package:flutter/material.dart';
import '../models/traiteur.dart';
import '../routes.dart';
import '../widgets/simple_crud_screen.dart';

class TraiteursScreen extends StatelessWidget {
  const TraiteursScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SimpleCrudScreen<Traiteur>(
      title: 'Traiteurs',
      route: routeTraiteurs,
      endpoint: '/traiteurs',
      addButtonLabel: 'Nouveau traiteur',
      fromJson: Traiteur.fromJson,
      idOf: (t) => t.id,
      searchText: (t) => t.nom,
      fields: const [
        CrudField(name: 'nom', label: 'Nom', required: true),
        CrudField(name: 'telephone', label: 'Téléphone', type: CrudFieldType.tel),
        CrudField(name: 'siteWeb', label: 'Site web', type: CrudFieldType.url),
      ],
      itemBuilder: (context, t) => Card(
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: ListTile(
          leading: const CircleAvatar(child: Icon(Icons.restaurant_outlined)),
          title: Text(t.nom),
          subtitle: Text(t.telephone ?? ''),
          trailing: t.dettes > 0
              ? Text('${t.dettes} DA', style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold))
              : null,
        ),
      ),
    );
  }
}
