import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../core/api_client.dart';
import '../models/confiscation.dart';
import '../routes.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/async_view.dart';
import '../widgets/status_badge.dart';

class ConfiscationsScreen extends StatefulWidget {
  const ConfiscationsScreen({super.key});

  @override
  State<ConfiscationsScreen> createState() => _ConfiscationsScreenState();
}

class _ConfiscationsScreenState extends State<ConfiscationsScreen> {
  late Future<List<ConfiscationTelephone>> _future;
  final _dateFormat = DateFormat('dd/MM/yyyy HH:mm');

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<ConfiscationTelephone>> _load() async {
    final api = context.read<ApiClient>();
    final res = await api.dio.get('/confiscations');
    return (res.data as List).map((e) => ConfiscationTelephone.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> _restitute(String id) async {
    final api = context.read<ApiClient>();
    try {
      await api.dio.post('/confiscations/$id/restitute');
      setState(() => _future = _load());
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(e))));
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Confiscations téléphones',
      route: routeConfiscations,
      body: AsyncView<List<ConfiscationTelephone>>(
        future: _future,
        onRetry: () => setState(() => _future = _load()),
        builder: (context, items) {
          if (items.isEmpty) return const EmptyState(message: 'Aucune confiscation enregistrée');
          return ListView.builder(
            itemCount: items.length,
            itemBuilder: (context, i) {
              final c = items[i];
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                child: ListTile(
                  leading: const CircleAvatar(child: Icon(Icons.phonelink_erase_outlined)),
                  title: Text(c.inviteNom ?? 'Invité'),
                  subtitle: Text('${c.numeroTelephone ?? '—'}\nConfisqué le ${_dateFormat.format(c.heureConfiscation)}'),
                  isThreeLine: true,
                  trailing: c.statut == 'CONFISQUE'
                      ? OutlinedButton(onPressed: () => _restitute(c.id), child: const Text('Restituer'))
                      : StatusBadge(status: c.statut),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
