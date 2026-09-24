import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/api_client.dart';
import '../../models/client.dart';
import '../../models/reservation.dart';
import '../../models/salle.dart';
import '../../routes.dart';
import '../../widgets/app_scaffold.dart';
import '../../widgets/async_view.dart';
import '../../widgets/status_badge.dart';

class ReservationsScreen extends StatefulWidget {
  const ReservationsScreen({super.key});

  @override
  State<ReservationsScreen> createState() => _ReservationsScreenState();
}

class _ReservationsScreenState extends State<ReservationsScreen> {
  late Future<List<Reservation>> _future;
  final _search = TextEditingController();
  String _query = '';
  final _dateFormat = DateFormat('dd/MM/yyyy');

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Reservation>> _load() async {
    final api = context.read<ApiClient>();
    final res = await api.dio.get('/reservations');
    return (res.data as List).map((e) => Reservation.fromJson(e as Map<String, dynamic>)).toList()
      ..sort((a, b) => b.dateDebut.compareTo(a.dateDebut));
  }

  void _reload() => setState(() => _future = _load());

  Future<void> _openCreateSheet() async {
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => const _CreateReservationSheet(),
    );
    if (created == true) _reload();
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Réservations',
      route: routeReservations,
      floatingActionButton: FloatingActionButton(onPressed: _openCreateSheet, child: const Icon(Icons.add)),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _search,
              decoration: const InputDecoration(prefixIcon: Icon(Icons.search), hintText: 'Rechercher un client…'),
              onChanged: (v) => setState(() => _query = v.toLowerCase()),
            ),
          ),
          Expanded(
            child: AsyncView<List<Reservation>>(
              future: _future,
              onRetry: _reload,
              builder: (context, items) {
                final filtered =
                    _query.isEmpty ? items : items.where((r) => (r.client?.nom ?? '').toLowerCase().contains(_query)).toList();
                if (filtered.isEmpty) return const EmptyState(message: 'Aucune réservation');
                return RefreshIndicator(
                  onRefresh: () async => _reload(),
                  child: ListView.builder(
                    padding: const EdgeInsets.only(bottom: 80),
                    itemCount: filtered.length,
                    itemBuilder: (context, i) {
                      final r = filtered[i];
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        child: ListTile(
                          title: Text(r.client?.nom ?? 'Client'),
                          subtitle: Text(
                              '${_dateFormat.format(r.dateDebut)} → ${_dateFormat.format(r.dateFin)}\n${r.salle?.nom ?? 'Salle non assignée'}'),
                          isThreeLine: true,
                          trailing: StatusBadge(status: statutToJson(r.statut)),
                          onTap: () => Navigator.of(context).pushNamed(routeReservationDetail, arguments: r.id),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _CreateReservationSheet extends StatefulWidget {
  const _CreateReservationSheet();

  @override
  State<_CreateReservationSheet> createState() => _CreateReservationSheetState();
}

class _CreateReservationSheetState extends State<_CreateReservationSheet> {
  final _formKey = GlobalKey<FormState>();
  String? _clientId;
  String? _salleId;
  DateTime? _dateDebut;
  DateTime? _dateFin;
  String _type = 'AUTRE';
  final _invitesCtrl = TextEditingController();
  final _totalCtrl = TextEditingController();
  final _avanceCtrl = TextEditingController();
  bool _saving = false;
  String? _error;

  Future<List<Client>>? _clientsFuture;
  Future<List<Salle>>? _sallesFuture;

  @override
  void initState() {
    super.initState();
    final api = context.read<ApiClient>();
    _clientsFuture = api.dio.get('/clients').then((r) => (r.data as List).map((e) => Client.fromJson(e)).toList());
    _sallesFuture = api.dio.get('/salles').then((r) => (r.data as List).map((e) => Salle.fromJson(e)).toList());
  }

  Future<void> _pickDate(bool isStart) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 730)),
    );
    if (picked == null) return;
    setState(() {
      if (isStart) {
        _dateDebut = picked;
        _dateFin ??= picked;
      } else {
        _dateFin = picked;
      }
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate() || _clientId == null || _dateDebut == null || _dateFin == null) {
      setState(() => _error = 'Veuillez remplir le client et les dates.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final api = context.read<ApiClient>();
      final res = await api.dio.post('/reservations', data: {
        'clientId': _clientId,
        if (_salleId != null) 'salleId': _salleId,
        'dateDebut': _dateDebut!.toIso8601String(),
        'dateFin': _dateFin!.toIso8601String(),
        'typeEvenement': _type,
        'nombreInvites': int.tryParse(_invitesCtrl.text) ?? 0,
        'totalAPayer': num.tryParse(_totalCtrl.text) ?? 0,
        'avanceVersee': num.tryParse(_avanceCtrl.text) ?? 0,
      });
      if (!mounted) return;
      Navigator.of(context).pop(true);
      Navigator.of(context).pushNamed(routeReservationDetail, arguments: res.data['id'] as String);
    } catch (e) {
      setState(() => _error = apiErrorMessage(e, fallback: 'Impossible de créer la réservation.'));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('dd/MM/yyyy');
    return Padding(
      padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(context).viewInsets.bottom + 20),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Nouvelle réservation', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              FutureBuilder<List<Client>>(
                future: _clientsFuture,
                builder: (context, snapshot) {
                  final clients = snapshot.data ?? [];
                  return DropdownButtonFormField<String>(
                    decoration: const InputDecoration(labelText: 'Client'),
                    items: clients.map((c) => DropdownMenuItem(value: c.id, child: Text(c.fullName))).toList(),
                    onChanged: (v) => setState(() => _clientId = v),
                    validator: (v) => v == null ? 'Requis' : null,
                  );
                },
              ),
              const SizedBox(height: 12),
              FutureBuilder<List<Salle>>(
                future: _sallesFuture,
                builder: (context, snapshot) {
                  final salles = snapshot.data ?? [];
                  return DropdownButtonFormField<String>(
                    decoration: const InputDecoration(labelText: 'Salle (optionnel)'),
                    items: salles.map((s) => DropdownMenuItem(value: s.id, child: Text(s.nom))).toList(),
                    onChanged: (v) => setState(() => _salleId = v),
                  );
                },
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _pickDate(true),
                      child: Text(_dateDebut == null ? 'Date début' : dateFormat.format(_dateDebut!)),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _pickDate(false),
                      child: Text(_dateFin == null ? 'Date fin' : dateFormat.format(_dateFin!)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(labelText: "Type d'évènement"),
                initialValue: _type,
                items: typesEvenement.map((t) => DropdownMenuItem(value: t, child: Text(typeEvenementLabel(t)))).toList(),
                onChanged: (v) => setState(() => _type = v ?? 'AUTRE'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _invitesCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: "Nombre d'invités"),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _totalCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Total à payer'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      controller: _avanceCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Avance versée'),
                    ),
                  ),
                ],
              ),
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
                      : const Text('Créer la réservation'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
