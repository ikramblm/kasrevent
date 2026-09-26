import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../core/api_client.dart';
import '../models/dashboard_kpis.dart';
import '../models/reservation.dart';
import '../models/user.dart';
import '../providers/auth_provider.dart';
import '../routes.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/kpi_bar_chart.dart';
import '../widgets/kpi_card.dart';
import '../widgets/status_badge.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Future<DashboardKpis>? _kpisFuture;
  late Future<List<Reservation>> _reservationsFuture;
  final _money = NumberFormat.decimalPattern('fr_FR');

  @override
  void initState() {
    super.initState();
    _reservationsFuture = _loadReservations();
    final role = context.read<AuthProvider>().user?.role;
    if (role == Role.admin || role == Role.gerant) {
      _kpisFuture = _loadKpis();
    }
  }

  Future<DashboardKpis> _loadKpis() async {
    final res = await context.read<ApiClient>().dio.get('/dashboard');
    return DashboardKpis.fromJson(res.data as Map<String, dynamic>);
  }

  Future<List<Reservation>> _loadReservations() async {
    final res = await context.read<ApiClient>().dio.get('/reservations');
    return (res.data as List).map((e) => Reservation.fromJson(e as Map<String, dynamic>)).toList();
  }

  String _da(num v) => '${_money.format(v)} DA';

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Tableau de bord',
      route: routeDashboard,
      body: RefreshIndicator(
        onRefresh: () async {
          setState(() {
            _reservationsFuture = _loadReservations();
            if (_kpisFuture != null) _kpisFuture = _loadKpis();
          });
        },
        child: ListView(
          padding: const EdgeInsets.all(12),
          children: [
            if (_kpisFuture != null)
              FutureBuilder<DashboardKpis>(
                future: _kpisFuture,
                builder: (context, snapshot) {
                  if (!snapshot.hasData) return const SizedBox.shrink();
                  final k = snapshot.data!;
                  return GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    childAspectRatio: 1.6,
                    mainAxisSpacing: 10,
                    crossAxisSpacing: 10,
                    children: [
                      KpiCard(label: "Chiffre d'affaire", value: _da(k.chiffreAffaireTotal)),
                      KpiCard(label: 'Revenus net', value: _da(k.revenusNet), color: Colors.green.shade700),
                      KpiCard(label: 'Créances', value: _da(k.creanceTotal), color: Colors.orange.shade800),
                      KpiCard(label: 'Dettes en attente', value: _da(k.paiementDeDettes), color: Colors.red.shade700),
                    ],
                  );
                },
              ),
            if (_kpisFuture != null) ...[
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 16, 16, 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Répartition financière', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 12),
                      FutureBuilder<DashboardKpis>(
                        future: _kpisFuture,
                        builder: (context, snapshot) {
                          if (!snapshot.hasData) return const SizedBox(height: 220);
                          return KpiBarChart(kpis: snapshot.data!);
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 16),
            Text('Prochain évènement', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            FutureBuilder<List<Reservation>>(
              future: _reservationsFuture,
              builder: (context, snapshot) {
                if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
                final now = DateTime.now();
                final upcoming = snapshot.data!
                    .where((r) => r.dateDebut.isAfter(now) && r.statut != StatutReservation.annulee)
                    .toList()
                  ..sort((a, b) => a.dateDebut.compareTo(b.dateDebut));
                if (upcoming.isEmpty) {
                  return const Card(child: Padding(padding: EdgeInsets.all(16), child: Text('Aucun évènement à venir.')));
                }
                final r = upcoming.first;
                return Card(
                  child: ListTile(
                    title: Text(r.client?.nom ?? 'Client'),
                    subtitle: Text('${DateFormat('dd/MM/yyyy').format(r.dateDebut)} — ${r.salle?.nom ?? 'Salle non assignée'}'),
                    trailing: StatusBadge(status: statutToJson(r.statut)),
                    onTap: () => Navigator.of(context).pushNamed(routeReservationDetail, arguments: r.id),
                  ),
                );
              },
            ),
            const SizedBox(height: 16),
            Text('Actions rapides', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                _QuickAction(icon: Icons.event_outlined, label: 'Réservations', onTap: () => Navigator.of(context).pushNamed(routeReservations)),
                _QuickAction(icon: Icons.qr_code_scanner, label: 'Check-in', onTap: () => Navigator.of(context).pushNamed(routeCheckin)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ActionChip(avatar: Icon(icon, size: 18), label: Text(label), onPressed: onTap);
  }
}
