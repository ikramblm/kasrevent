import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/client.dart';
import '../routes.dart';
import '../widgets/simple_crud_screen.dart';

class ClientsScreen extends StatelessWidget {
  const ClientsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SimpleCrudScreen<Client>(
      title: 'Clients',
      route: routeClients,
      endpoint: '/clients',
      addButtonLabel: 'Nouveau client',
      fromJson: Client.fromJson,
      idOf: (c) => c.id,
      searchText: (c) => '${c.nom} ${c.prenom ?? ''} ${c.telephone ?? ''}',
      fields: const [
        CrudField(name: 'nom', label: 'Nom', required: true),
        CrudField(name: 'prenom', label: 'Prénom'),
        CrudField(name: 'telephone', label: 'Téléphone', type: CrudFieldType.tel),
        CrudField(name: 'email', label: 'Email', type: CrudFieldType.email),
        CrudField(name: 'adresse', label: 'Adresse'),
      ],
      itemBuilder: (context, client) => Card(
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: ListTile(
          leading: const CircleAvatar(child: Icon(Icons.person_outline)),
          title: Text(client.fullName),
          subtitle: Text([client.telephone, client.email].where((s) => s != null && s.isNotEmpty).join(' · ')),
          trailing: client.telephone == null
              ? null
              : IconButton(
                  icon: const Icon(Icons.call_outlined),
                  onPressed: () => launchUrl(Uri(scheme: 'tel', path: client.telephone)),
                ),
        ),
      ),
    );
  }
}
