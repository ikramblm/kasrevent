import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/api_client.dart';
import '../models/employe.dart';
import '../routes.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/async_view.dart';

class EmployesScreen extends StatefulWidget {
  const EmployesScreen({super.key});

  @override
  State<EmployesScreen> createState() => _EmployesScreenState();
}

class _EmployesScreenState extends State<EmployesScreen> {
  late Future<List<Employe>> _future;
  bool _runningPayroll = false;
  String? _payrollMessage;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Employe>> _load() async {
    final res = await context.read<ApiClient>().dio.get('/employes');
    return (res.data as List).map((e) => Employe.fromJson(e as Map<String, dynamic>)).toList();
  }

  void _reload() => setState(() => _future = _load());

  Future<void> _runPayroll() async {
    setState(() => _runningPayroll = true);
    try {
      final res = await context.read<ApiClient>().dio.post('/employes/run-monthly-payroll');
      setState(() => _payrollMessage = "${res.data['paidCount']} employé(s) payé(s) pour aujourd'hui.");
      _reload();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(e))));
    } finally {
      if (mounted) setState(() => _runningPayroll = false);
    }
  }

  Future<void> _openCreateSheet() async {
    final nomCtrl = TextEditingController();
    final roleCtrl = TextEditingController();
    final telCtrl = TextEditingController();
    final paieMensuelleCtrl = TextEditingController();
    final paieParJourCtrl = TextEditingController();
    final jourDePaieCtrl = TextEditingController();
    String typePaie = 'MENSUELLE';

    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(ctx).viewInsets.bottom + 20),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Nouvel employé', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                TextField(controller: nomCtrl, decoration: const InputDecoration(labelText: 'Nom')),
                const SizedBox(height: 12),
                TextField(controller: roleCtrl, decoration: const InputDecoration(labelText: 'Rôle')),
                const SizedBox(height: 12),
                TextField(controller: telCtrl, decoration: const InputDecoration(labelText: 'Téléphone')),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: typePaie,
                  decoration: const InputDecoration(labelText: 'Type de paie'),
                  items: const [
                    DropdownMenuItem(value: 'MENSUELLE', child: Text('Mensuelle')),
                    DropdownMenuItem(value: 'JOURNALIERE', child: Text('Journalière')),
                  ],
                  onChanged: (v) => setSheetState(() => typePaie = v ?? 'MENSUELLE'),
                ),
                const SizedBox(height: 12),
                if (typePaie == 'MENSUELLE') ...[
                  Row(children: [
                    Expanded(
                      child: TextField(
                        controller: paieMensuelleCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Paie mensuelle (DA)'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: jourDePaieCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Jour de paie (1-31)'),
                      ),
                    ),
                  ]),
                ] else
                  TextField(
                    controller: paieParJourCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Paie par jour (DA)'),
                  ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(ctx, true),
                    child: const Text('Enregistrer'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );

    if (saved != true || nomCtrl.text.trim().isEmpty || roleCtrl.text.trim().isEmpty) return;
    if (!mounted) return;
    final api = context.read<ApiClient>();
    try {
      await api.dio.post('/employes', data: {
        'nom': nomCtrl.text.trim(),
        'role': roleCtrl.text.trim(),
        if (telCtrl.text.isNotEmpty) 'telephone': telCtrl.text.trim(),
        'typePaie': typePaie,
        if (paieMensuelleCtrl.text.isNotEmpty) 'paieMensuelle': num.tryParse(paieMensuelleCtrl.text),
        if (paieParJourCtrl.text.isNotEmpty) 'paieParJour': num.tryParse(paieParJourCtrl.text),
        if (jourDePaieCtrl.text.isNotEmpty) 'jourDePaie': int.tryParse(jourDePaieCtrl.text),
      });
      _reload();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(e))));
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Employés',
      route: routeEmployes,
      floatingActionButton: FloatingActionButton(onPressed: _openCreateSheet, child: const Icon(Icons.add)),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _runningPayroll ? null : _runPayroll,
                icon: const Icon(Icons.payments_outlined),
                label: Text(_runningPayroll ? 'Exécution…' : 'Exécuter la paie mensuelle du jour'),
              ),
            ),
          ),
          if (_payrollMessage != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(8)),
                child: Text(_payrollMessage!, style: TextStyle(color: Colors.green.shade800)),
              ),
            ),
          Expanded(
            child: AsyncView<List<Employe>>(
              future: _future,
              onRetry: _reload,
              builder: (context, items) {
                if (items.isEmpty) return const EmptyState(message: 'Aucun employé');
                return ListView.builder(
                  padding: const EdgeInsets.only(bottom: 80),
                  itemCount: items.length,
                  itemBuilder: (context, i) {
                    final e = items[i];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      child: ListTile(
                        leading: const CircleAvatar(child: Icon(Icons.badge_outlined)),
                        title: Text('${e.nom} ${e.prenom ?? ''}'),
                        subtitle: Text('${e.role} · ${e.typePaie == 'MENSUELLE' ? 'Mensuelle' : 'Journalière'}'),
                        trailing: Text('${e.montantAPayer} DA', style: const TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
