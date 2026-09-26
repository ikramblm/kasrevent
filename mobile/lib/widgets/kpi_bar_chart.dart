import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import '../models/dashboard_kpis.dart';

/// Reproduces (as an actual chart, not just numbers) the original app's "Comptabilité"
/// dashboard bar graphs ("graph charges" / "graph réservations") — previously the mobile
/// dashboard only showed KPI number cards.
class KpiBarChart extends StatelessWidget {
  const KpiBarChart({super.key, required this.kpis});
  final DashboardKpis kpis;

  @override
  Widget build(BuildContext context) {
    final bars = <_Bar>[
      _Bar('CA', kpis.chiffreAffaireTotal, Colors.indigo),
      _Bar('Net', kpis.revenusNet, Colors.green),
      _Bar('Charges', kpis.charges, Colors.red),
      _Bar('Dettes', kpis.paiementDeDettes, Colors.orange),
      _Bar('Invest.', kpis.investissements, Colors.blue),
      _Bar('Salaires', kpis.paiementSalaires, Colors.purple),
    ];
    final maxY = bars.map((b) => b.value.abs()).fold<double>(1, (a, b) => a > b ? a : b.toDouble());

    return SizedBox(
      height: 220,
      child: BarChart(
        BarChartData(
          maxY: maxY * 1.15,
          gridData: const FlGridData(show: false),
          borderData: FlBorderData(show: false),
          titlesData: FlTitlesData(
            leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (value, meta) {
                  final i = value.toInt();
                  if (i < 0 || i >= bars.length) return const SizedBox.shrink();
                  return Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(bars[i].label, style: const TextStyle(fontSize: 10)),
                  );
                },
              ),
            ),
          ),
          barGroups: [
            for (int i = 0; i < bars.length; i++)
              BarChartGroupData(x: i, barRods: [
                BarChartRodData(toY: bars[i].value.toDouble(), color: bars[i].color, width: 22, borderRadius: BorderRadius.circular(4)),
              ]),
          ],
        ),
      ),
    );
  }
}

class _Bar {
  _Bar(this.label, this.value, this.color);
  final String label;
  final num value;
  final Color color;
}
