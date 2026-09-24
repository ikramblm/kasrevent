import 'package:flutter/material.dart';

const Map<String, Color> _statusColors = {
  'EN_ATTENTE': Color(0xFFF59E0B),
  'CONFIRMEE': Color(0xFF10B981),
  'ANNULEE': Color(0xFFF43F5E),
  'CLOTURE': Color(0xFFCA8A04),
  'VALIDE': Color(0xFF10B981),
  'EXPIRE': Color(0xFFF43F5E),
  'CONFISQUE': Color(0xFFF43F5E),
  'RESTITUE': Color(0xFF10B981),
  'CONFIRME': Color(0xFF10B981),
  'NON_CONFIRME': Color(0xFFF43F5E),
};

const Map<String, String> _statusLabels = {
  'EN_ATTENTE': 'En attente',
  'CONFIRMEE': 'Confirmée',
  'ANNULEE': 'Annulée',
  'CLOTURE': 'Clôturé',
  'VALIDE': 'Valide',
  'EXPIRE': 'Expiré',
  'CONFISQUE': 'Confisqué',
  'RESTITUE': 'Restitué',
  'CONFIRME': 'Confirmé',
  'NON_CONFIRME': 'Non confirmé',
};

class StatusBadge extends StatelessWidget {
  const StatusBadge({super.key, required this.status});
  final String status;

  @override
  Widget build(BuildContext context) {
    final color = _statusColors[status] ?? Colors.grey;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(999)),
      child: Text(
        _statusLabels[status] ?? status,
        style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 12),
      ),
    );
  }
}
