import 'package:flutter/material.dart';
import '../models/decoration.dart';
import '../routes.dart';
import '../widgets/simple_crud_screen.dart';

const _typeLabels = {
  'FLEURS': 'Fleurs',
  'TAPIS': 'Tapis',
  'CHAISES': 'Chaises',
  'TABLES': 'Tables',
  'SCULPTURE': 'Sculpture',
};

class DecorationsScreen extends StatelessWidget {
  const DecorationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SimpleCrudScreen<DecorationItem>(
      title: 'Décorations',
      route: routeDecorations,
      endpoint: '/decorations',
      addButtonLabel: 'Nouvelle décoration',
      fromJson: DecorationItem.fromJson,
      idOf: (d) => d.id,
      searchText: (d) => d.nom,
      fields: [
        const CrudField(name: 'nom', label: 'Nom', required: true),
        CrudField(
          name: 'type',
          label: 'Type',
          type: CrudFieldType.select,
          required: true,
          options: typeDecorationValues.map((v) => MapEntry(v, _typeLabels[v]!)).toList(),
        ),
        const CrudField(name: 'stockDisponible', label: 'Stock disponible', type: CrudFieldType.number),
        const CrudField(name: 'prixLocation', label: 'Prix location (DA)', type: CrudFieldType.number),
      ],
      itemBuilder: (context, d) => Card(
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: ListTile(
          leading: const CircleAvatar(child: Icon(Icons.celebration_outlined)),
          title: Text(d.nom),
          subtitle: Text([_typeLabels[d.type] ?? d.type, if (d.stockDisponible != null) 'Stock: ${d.stockDisponible}'].join(' · ')),
          trailing: d.prixLocation != null ? Text('${d.prixLocation} DA') : null,
        ),
      ),
    );
  }
}
