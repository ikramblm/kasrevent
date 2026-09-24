import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../core/api_client.dart';
import '../models/charge.dart';
import '../models/employe.dart';
import '../models/fournisseur.dart';
import '../models/traiteur.dart';
import '../routes.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/async_view.dart';

class ChargesScreen extends StatefulWidget {
  const ChargesScreen({super.key});

  @override
  State<ChargesScreen> createState() => _ChargesScreenState();
}

class _ChargesScreenState extends State<ChargesScreen> {
  late Future<List<Charge>> _future;
  final _dateFormat = DateFormat('dd/MM/yyyy');

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Charge>> _load() async {
    final res = await context.read<ApiClient>().dio.get('/charges');
    return (res.data as List).map((e) => Charge.fromJson(e as Map<String, dynamic>)).toList();
  }

  void _reload() => setState(() => _future = _load());

  Future<void> _openCreateSheet() async {
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => const _CreateChargeSheet(),
    );
    if (created == true) _reload();
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Charges',
      route: routeCharges,
      floatingActionButton: FloatingActionButton(onPressed: _openCreateSheet, child: const Icon(Icons.add)),
      body: AsyncView<List<Charge>>(
        future: _future,
        onRetry: _reload,
        builder: (context, items) {
          if (items.isEmpty) return const EmptyState(message: 'Aucune charge enregistrée');
          return ListView.builder(
            padding: const EdgeInsets.only(bottom: 80),
            itemCount: items.length,
            itemBuilder: (context, i) {
              final c = items[i];
              final linkedTo = c.fournisseurLabel ?? c.traiteurLabel ?? c.employeLabel;
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                child: ListTile(
                  title: Text(typeChargeLabels[c.type] ?? c.type),
                  subtitle: Text([?linkedTo, _dateFormat.format(c.dateHeure), c.methodePaiement].join(' · ')),
                  trailing: Text('${c.montantPaye} DA', style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _CreateChargeSheet extends StatefulWidget {
  const _CreateChargeSheet();

  @override
  State<_CreateChargeSheet> createState() => _CreateChargeSheetState();
}

class _CreateChargeSheetState extends State<_CreateChargeSheet> {
  String _type = 'ACHAT';
  String? _fournisseurId;
  String? _traiteurId;
  String? _employeId;
  String _methode = 'ESPECE';
  final _totalCtrl = TextEditingController();
  final _payeCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  bool _saving = false;
  String? _error;

  Future<List<Fournisseur>>? _fournisseursFuture;
  Future<List<Traiteur>>? _traiteursFuture;
  Future<List<Employe>>? _employesFuture;

  bool get _showFournisseur =>
      ['ACHAT', 'APPROVISIONNEMENT', 'INVESTISSEMENT', 'PAIEMENT_DETTES_FOURNISSEURS'].contains(_type);
  bool get _showTraiteur => _type == 'PAIEMENT_DETTES_TRAITEURS';
  bool get _showEmploye => _type == 'PAIEMENT_SALAIRE';

  @override
  void initState() {
    super.initState();
    final api = context.read<ApiClient>();
    _fournisseursFuture = api.dio.get('/fournisseurs').then((r) => (r.data as List).map((e) => Fournisseur.fromJson(e)).toList());
    _traiteursFuture = api.dio.get('/traiteurs').then((r) => (r.data as List).map((e) => Traiteur.fromJson(e)).toList());
    _employesFuture = api.dio.get('/employes').then((r) => (r.data as List).map((e) => Employe.fromJson(e)).toList());
  }

  Future<void> _submit() async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final api = context.read<ApiClient>();
      await api.dio.post('/charges', data: {
        'type': _type,
        if (_showFournisseur && _fournisseurId != null) 'fournisseurId': _fournisseurId,
        if (_showTraiteur && _traiteurId != null) 'traiteurId': _traiteurId,
        if (_showEmploye && _employeId != null) 'employeId': _employeId,
        'montantTotal': num.tryParse(_totalCtrl.text) ?? 0,
        'montantPaye': num.tryParse(_payeCtrl.text) ?? 0,
        'methodePaiement': _methode,
        if (_descCtrl.text.isNotEmpty) 'description': _descCtrl.text,
      });
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = apiErrorMessage(e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(context).viewInsets.bottom + 20),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Nouvelle charge', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _type,
              decoration: const InputDecoration(labelText: 'Type de charge'),
              items: typeChargeValues.map((t) => DropdownMenuItem(value: t, child: Text(typeChargeLabels[t]!))).toList(),
              onChanged: (v) => setState(() => _type = v ?? 'ACHAT'),
            ),
            if (_showFournisseur) ...[
              const SizedBox(height: 12),
              FutureBuilder<List<Fournisseur>>(
                future: _fournisseursFuture,
                builder: (context, snapshot) => DropdownButtonFormField<String>(
                  decoration: const InputDecoration(labelText: 'Fournisseur'),
                  items: (snapshot.data ?? []).map((f) => DropdownMenuItem(value: f.id, child: Text(f.company))).toList(),
                  onChanged: (v) => setState(() => _fournisseurId = v),
                ),
              ),
            ],
            if (_showTraiteur) ...[
              const SizedBox(height: 12),
              FutureBuilder<List<Traiteur>>(
                future: _traiteursFuture,
                builder: (context, snapshot) => DropdownButtonFormField<String>(
                  decoration: const InputDecoration(labelText: 'Traiteur'),
                  items: (snapshot.data ?? []).map((t) => DropdownMenuItem(value: t.id, child: Text(t.nom))).toList(),
                  onChanged: (v) => setState(() => _traiteurId = v),
                ),
              ),
            ],
            if (_showEmploye) ...[
              const SizedBox(height: 12),
              FutureBuilder<List<Employe>>(
                future: _employesFuture,
                builder: (context, snapshot) => DropdownButtonFormField<String>(
                  decoration: const InputDecoration(labelText: 'Employé'),
                  items: (snapshot.data ?? []).map((e) => DropdownMenuItem(value: e.id, child: Text(e.nom))).toList(),
                  onChanged: (v) => setState(() => _employeId = v),
                ),
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _totalCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Montant total'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: _payeCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Montant payé'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _methode,
              decoration: const InputDecoration(labelText: 'Méthode de paiement'),
              items: const [
                DropdownMenuItem(value: 'ESPECE', child: Text('Espèce')),
                DropdownMenuItem(value: 'CHEQUE', child: Text('Chèque')),
                DropdownMenuItem(value: 'VIREMENT', child: Text('Virement')),
                DropdownMenuItem(value: 'AUTRE', child: Text('Autre')),
              ],
              onChanged: (v) => setState(() => _methode = v ?? 'ESPECE'),
            ),
            const SizedBox(height: 12),
            TextField(controller: _descCtrl, decoration: const InputDecoration(labelText: 'Description')),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.redAccent)),
            ],
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _saving ? null : _submit,
                child: _saving
                    ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Text('Enregistrer'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
