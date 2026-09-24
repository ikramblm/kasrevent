import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/salle.dart';
import '../routes.dart';
import '../widgets/simple_crud_screen.dart';

class SallesScreen extends StatelessWidget {
  const SallesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SimpleCrudScreen<Salle>(
      title: 'Salles',
      route: routeSalles,
      endpoint: '/salles',
      addButtonLabel: 'Nouvelle salle',
      fromJson: Salle.fromJson,
      idOf: (s) => s.id,
      searchText: (s) => '${s.nom} ${s.localisation ?? ''}',
      fields: const [
        CrudField(name: 'nom', label: 'Nom', required: true),
        CrudField(name: 'localisation', label: 'Localisation'),
        CrudField(name: 'capacite', label: 'Capacité', type: CrudFieldType.number),
        CrudField(name: 'tarif', label: 'Tarif (DA)', type: CrudFieldType.number),
        CrudField(name: 'lienLocalisation', label: 'Lien Google Maps', type: CrudFieldType.url),
      ],
      itemBuilder: (context, salle) => Card(
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: ListTile(
          leading: const CircleAvatar(child: Icon(Icons.meeting_room_outlined)),
          title: Text(salle.nom),
          subtitle: Text([
            if (salle.localisation != null) salle.localisation!,
            if (salle.capacite != null) '${salle.capacite} places',
            if (salle.tarif != null) '${salle.tarif} DA',
          ].join(' · ')),
          trailing: salle.lienLocalisation != null
              ? IconButton(
                  icon: const Icon(Icons.map_outlined),
                  onPressed: () => launchUrl(Uri.parse(salle.lienLocalisation!), mode: LaunchMode.externalApplication),
                )
              : null,
        ),
      ),
    );
  }
}
