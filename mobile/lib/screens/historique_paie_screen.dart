import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../core/api_client.dart';
import '../models/historique_paie.dart';
import '../routes.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/async_view.dart';

class HistoriquePaieScreen extends StatefulWidget {
  const HistoriquePaieScreen({super.key});

  @override
  State<HistoriquePaieScreen> createState() => _HistoriquePaieScreenState();
}

class _HistoriquePaieScreenState extends State<HistoriquePaieScreen> {
  late Future<List<HistoriquePaieEntry>> _future;
  final _dateFormat = DateFormat('dd/MM/yyyy');

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<HistoriquePaieEntry>> _load() async {
    final api = context.read<ApiClient>();
    final res = await api.dio.get('/historique-paie');
    return (res.data as List).map((e) => HistoriquePaieEntry.fromJson(e as Map<String, dynamic>)).toList();
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Historique de paie',
      route: routeHistoriquePaie,
      body: AsyncView<List<HistoriquePaieEntry>>(
        future: _future,
        onRetry: () => setState(() => _future = _load()),
        builder: (context, items) {
          if (items.isEmpty) return const EmptyState(message: 'Aucun paiement enregistré');
          return ListView.builder(
            itemCount: items.length,
            itemBuilder: (context, i) {
              final e = items[i];
              return ListTile(
                leading: const Icon(Icons.payments_outlined),
                title: Text(e.employeNom),
                subtitle: Text('${e.moisPaye ?? ''} · ${_dateFormat.format(e.date)} · ${e.methodePaiement}'),
                trailing: Text('${e.montantPaye} DA', style: const TextStyle(fontWeight: FontWeight.bold)),
              );
            },
          );
        },
      ),
    );
  }
}
