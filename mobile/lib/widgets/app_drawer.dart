import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/user.dart';
import '../providers/auth_provider.dart';

class _NavItem {
  const _NavItem(this.route, this.label, this.icon, {this.roles});
  final String route;
  final String label;
  final IconData icon;
  final List<Role>? roles;
}

class _NavSection {
  const _NavSection(this.title, this.items);
  final String title;
  final List<_NavItem> items;
}

// Mirrors the web dashboard's Sidebar role gates (see docs/APP_MIGRATION_STATUS.md).
const _sections = [
  _NavSection('Général', [_NavItem('/', 'Tableau de bord', Icons.dashboard_outlined)]),
  _NavSection('Réservations', [
    _NavItem('/reservations', 'Réservations', Icons.event_outlined),
    _NavItem('/salles', 'Salles', Icons.meeting_room_outlined),
    _NavItem('/checkin', 'Check-in QR', Icons.qr_code_scanner),
  ]),
  _NavSection('Clients & Invités', [
    _NavItem('/clients', 'Clients', Icons.people_outline),
    _NavItem('/confiscations', 'Confiscations téléphones', Icons.phonelink_erase_outlined),
  ]),
  _NavSection('Gestion d\'entreprise', [
    _NavItem('/charges', 'Charges', Icons.receipt_long_outlined, roles: [Role.admin, Role.gerant]),
    _NavItem('/fournisseurs', 'Fournisseurs', Icons.local_shipping_outlined, roles: [Role.admin]),
    _NavItem('/traiteurs', 'Traiteurs', Icons.restaurant_outlined),
    _NavItem('/decorations', 'Décorations', Icons.celebration_outlined),
  ]),
  _NavSection('Administration', [
    _NavItem('/employes', 'Employés', Icons.badge_outlined, roles: [Role.admin]),
    _NavItem('/historique-paie', 'Historique de paie', Icons.history, roles: [Role.admin, Role.gerant]),
    _NavItem('/utilisateurs', 'Utilisateurs', Icons.admin_panel_settings_outlined, roles: [Role.admin]),
  ]),
];

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key, required this.currentRoute});
  final String currentRoute;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final role = auth.user?.role ?? Role.user;

    return Drawer(
      child: SafeArea(
        child: Column(
          children: [
            const DrawerHeader(
              child: Row(
                children: [
                  Text('🏰', style: TextStyle(fontSize: 28)),
                  SizedBox(width: 10),
                  Text('KasrEvent', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  for (final section in _sections)
                    if (section.items.any((i) => i.roles == null || i.roles!.contains(role))) ...[
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                        child: Text(
                          section.title.toUpperCase(),
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey.shade500),
                        ),
                      ),
                      for (final item in section.items)
                        if (item.roles == null || item.roles!.contains(role))
                          ListTile(
                            leading: Icon(item.icon, size: 22),
                            title: Text(item.label),
                            selected: currentRoute == item.route,
                            selectedTileColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.08),
                            onTap: () {
                              Navigator.of(context).pop();
                              if (currentRoute != item.route) {
                                Navigator.of(context).pushReplacementNamed(item.route);
                              }
                            },
                          ),
                    ],
                ],
              ),
            ),
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.redAccent),
              title: const Text('Déconnexion', style: TextStyle(color: Colors.redAccent)),
              onTap: () => context.read<AuthProvider>().logout(),
            ),
          ],
        ),
      ),
    );
  }
}
