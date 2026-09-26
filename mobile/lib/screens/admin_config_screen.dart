import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/api_client.dart';
import '../routes.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/async_view.dart';

class AdminConfigScreen extends StatefulWidget {
  const AdminConfigScreen({super.key});

  @override
  State<AdminConfigScreen> createState() => _AdminConfigScreenState();
}

class _AdminConfigScreenState extends State<AdminConfigScreen> {
  late Future<Map<String, dynamic>> _future;
  final _nomCtrl = TextEditingController();
  final _whatsappCtrl = TextEditingController();
  final _facebookCtrl = TextEditingController();
  final _instagramCtrl = TextEditingController();
  final _utileCtrl = TextEditingController();
  bool _saving = false;
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() async {
    final res = await context.read<ApiClient>().dio.get('/admin-config');
    final data = res.data as Map<String, dynamic>;
    if (!_loaded) {
      _nomCtrl.text = data['nom'] ?? '';
      _whatsappCtrl.text = data['numeroWhatsapp'] ?? '';
      _facebookCtrl.text = data['lienFacebook'] ?? '';
      _instagramCtrl.text = data['lienInstagram'] ?? '';
      _utileCtrl.text = data['lienUtile'] ?? '';
      _loaded = true;
    }
    return data;
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final api = context.read<ApiClient>();
      await api.dio.patch('/admin-config', data: {
        'nom': _nomCtrl.text.trim(),
        'numeroWhatsapp': _whatsappCtrl.text.trim(),
        if (_facebookCtrl.text.trim().isNotEmpty) 'lienFacebook': _normalizeUrl(_facebookCtrl.text.trim()),
        if (_instagramCtrl.text.trim().isNotEmpty) 'lienInstagram': _normalizeUrl(_instagramCtrl.text.trim()),
        if (_utileCtrl.text.trim().isNotEmpty) 'lienUtile': _normalizeUrl(_utileCtrl.text.trim()),
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Configuration enregistrée ✓')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(e))));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  String _normalizeUrl(String v) => (v.startsWith('http://') || v.startsWith('https://')) ? v : 'https://$v';

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Configuration',
      route: routeAdminConfig,
      body: AsyncView<Map<String, dynamic>>(
        future: _future,
        builder: (context, _) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(controller: _nomCtrl, decoration: const InputDecoration(labelText: "Nom de l'établissement")),
              const SizedBox(height: 12),
              TextField(controller: _whatsappCtrl, decoration: const InputDecoration(labelText: 'Numéro WhatsApp')),
              const SizedBox(height: 12),
              TextField(controller: _facebookCtrl, decoration: const InputDecoration(labelText: 'Lien Facebook')),
              const SizedBox(height: 12),
              TextField(controller: _instagramCtrl, decoration: const InputDecoration(labelText: 'Lien Instagram')),
              const SizedBox(height: 12),
              TextField(controller: _utileCtrl, decoration: const InputDecoration(labelText: 'Lien utile')),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _saving ? null : _save,
                  child: _saving
                      ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Enregistrer'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
