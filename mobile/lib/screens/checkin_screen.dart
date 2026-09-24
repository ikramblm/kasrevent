import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import '../core/api_client.dart';
import '../routes.dart';
import '../widgets/app_scaffold.dart';

String _extractToken(String rawValue) {
  final uri = Uri.tryParse(rawValue);
  if (uri != null && uri.queryParameters.containsKey('token')) {
    return uri.queryParameters['token']!;
  }
  return rawValue;
}

class CheckInScreen extends StatefulWidget {
  const CheckInScreen({super.key});

  @override
  State<CheckInScreen> createState() => _CheckInScreenState();
}

class _CheckInScreenState extends State<CheckInScreen> {
  final _controller = MobileScannerController(detectionSpeed: DetectionSpeed.normal);
  final _manualCtrl = TextEditingController();
  bool _busy = false;
  Map<String, dynamic>? _result;
  String? _error;
  DateTime _lastScan = DateTime.fromMillisecondsSinceEpoch(0);

  @override
  void dispose() {
    _controller.dispose();
    _manualCtrl.dispose();
    super.dispose();
  }

  Future<void> _submitToken(String token) async {
    if (_busy) return;
    // Debounce: the camera keeps emitting the same code every frame while it's in view.
    final now = DateTime.now();
    if (now.difference(_lastScan) < const Duration(seconds: 2)) return;
    _lastScan = now;

    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final api = context.read<ApiClient>();
      final res = await api.dio.post('/checkin/scan', data: {'token': token});
      setState(() => _result = res.data as Map<String, dynamic>);
    } catch (e) {
      setState(() {
        _error = apiErrorMessage(e, fallback: 'QR code invalide.');
        _result = null;
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Check-in QR',
      route: routeCheckin,
      body: Column(
        children: [
          SizedBox(
            height: 280,
            child: MobileScanner(
              controller: _controller,
              onDetect: (capture) {
                if (capture.barcodes.isEmpty) return;
                final raw = capture.barcodes.first.rawValue;
                if (raw != null) _submitToken(_extractToken(raw));
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                TextField(
                  controller: _manualCtrl,
                  decoration: InputDecoration(
                    labelText: 'Ou saisir le code manuellement',
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.send),
                      onPressed: () {
                        if (_manualCtrl.text.trim().isNotEmpty) {
                          _lastScan = DateTime.fromMillisecondsSinceEpoch(0); // allow manual override of debounce
                          _submitToken(_extractToken(_manualCtrl.text.trim()));
                        }
                      },
                    ),
                  ),
                  onSubmitted: (v) => v.trim().isEmpty ? null : _submitToken(_extractToken(v.trim())),
                ),
              ],
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _buildResult(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResult() {
    if (_busy) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(12)),
        child: Text(_error!, style: TextStyle(color: Colors.red.shade800)),
      );
    }
    if (_result != null) {
      final guest = _result!['guest'] as Map<String, dynamic>?;
      final acces = _result!['accesInvite'] as Map<String, dynamic>?;
      final confiscation = _result!['confiscationCreated'];
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(12)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('✅ ${guest?['nom'] ?? ''} ${guest?['prenom'] ?? ''}',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.green.shade800)),
            const SizedBox(height: 6),
            Text("Statut d'accès : ${acces?['statutAcces'] ?? '—'}"),
            if (confiscation != null) ...const [
              SizedBox(height: 6),
              Text('📱 Téléphone confisqué automatiquement (politique active pour cet évènement).'),
            ],
          ],
        ),
      );
    }
    return const Center(child: Text("En attente d'un scan…", style: TextStyle(color: Colors.black45)));
  }
}
