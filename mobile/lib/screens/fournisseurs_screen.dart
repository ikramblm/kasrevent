import 'package:flutter/material.dart';
import '../models/fournisseur.dart';
import '../routes.dart';
import '../widgets/simple_crud_screen.dart';

class FournisseursScreen extends StatelessWidget {
  const FournisseursScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SimpleCrudScreen<Fournisseur>(
      title: 'Fournisseurs',
      route: routeFournisseurs,
      endpoint: '/fournisseurs',
      addButtonLabel: 'Nouveau fournisseur',
      fromJson: Fournisseur.fromJson,
      idOf: (f) => f.id,
      searchText: (f) => '${f.company} ${f.nom ?? ''}',
      fields: const [
        CrudField(name: 'company', label: 'Société', required: true),
        CrudField(name: 'nom', label: 'Contact'),
        CrudField(name: 'tel', label: 'Téléphone', type: CrudFieldType.tel),
      ],
      itemBuilder: (context, f) => Card(
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: ListTile(
          leading: const CircleAvatar(child: Icon(Icons.local_shipping_outlined)),
          title: Text(f.company),
          subtitle: Text(f.nom ?? ''),
          trailing: f.dettes > 0
              ? Text('${f.dettes} DA', style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold))
              : null,
        ),
      ),
    );
  }
}
