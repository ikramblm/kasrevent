import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/api_client.dart';
import 'app_scaffold.dart';
import 'async_view.dart';

enum CrudFieldType { text, number, email, tel, url, select, password }

/// Prepends `https://` when the user typed a bare domain/path (e.g. a Google Maps link
/// copied without its scheme) instead of letting the server's stricter `.url()` validation
/// reject it with no visible explanation.
String normalizeUrl(String value) {
  final trimmed = value.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return 'https://$trimmed';
}

class CrudField {
  const CrudField({required this.name, required this.label, this.type = CrudFieldType.text, this.options, this.required = false});
  final String name;
  final String label;
  final CrudFieldType type;
  final List<MapEntry<String, String>>? options; // value -> label
  final bool required;
}

/// Generic "list + add-new-item modal + delete" screen, config-driven, used by the
/// simpler reference-data entities (Clients, Salles, Fournisseurs, Traiteurs,
/// Décorations, Utilisateurs) — mirrors the web dashboard's SimpleCrudPage.tsx so that
/// logic isn't rewritten five times. Bespoke workflow screens (Reservations, Charges,
/// CheckIn, Employés) are hand-built instead.
class SimpleCrudScreen<T> extends StatefulWidget {
  const SimpleCrudScreen({
    super.key,
    required this.title,
    required this.route,
    required this.endpoint,
    required this.fields,
    required this.fromJson,
    required this.itemBuilder,
    required this.searchText,
    required this.idOf,
    this.addButtonLabel,
    this.canDelete = true,
  });

  final String title;
  final String route;
  final String endpoint;
  final List<CrudField> fields;
  final T Function(Map<String, dynamic>) fromJson;
  final Widget Function(BuildContext context, T item) itemBuilder;
  final String Function(T item) searchText;
  final String Function(T item) idOf;
  final String? addButtonLabel;
  final bool canDelete;

  @override
  State<SimpleCrudScreen<T>> createState() => _SimpleCrudScreenState<T>();
}

class _SimpleCrudScreenState<T> extends State<SimpleCrudScreen<T>> {
  late Future<List<T>> _future;
  final _search = TextEditingController();
  String _query = '';

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<T>> _load() async {
    final api = context.read<ApiClient>();
    final res = await api.dio.get(widget.endpoint);
    return (res.data as List).map((e) => widget.fromJson(e as Map<String, dynamic>)).toList();
  }

  void _reload() => setState(() => _future = _load());

  Future<void> _delete(String id) async {
    final api = context.read<ApiClient>();
    try {
      await api.dio.delete('${widget.endpoint}/$id');
      _reload();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(e))));
    }
  }

  Future<void> _openAddForm() async {
    final values = <String, dynamic>{};
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => _AddItemSheet(fields: widget.fields, title: widget.addButtonLabel ?? 'Ajouter', values: values),
    );
    if (saved != true) return;
    if (!mounted) return;
    final api = context.read<ApiClient>();
    try {
      final payload = <String, dynamic>{};
      for (final f in widget.fields) {
        final v = values[f.name];
        if (v == null || (v is String && v.isEmpty)) continue;
        if (f.type == CrudFieldType.number) {
          payload[f.name] = num.tryParse(v.toString());
        } else if (f.type == CrudFieldType.url) {
          // A user typing "maps.google.com/xyz" without a scheme previously failed
          // server-side validation with no visible reason (the reported "Salle add
          // doesn't work" bug) — normalize instead of silently rejecting.
          payload[f.name] = normalizeUrl(v.toString());
        } else {
          payload[f.name] = v;
        }
      }
      await api.dio.post(widget.endpoint, data: payload);
      _reload();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(e))));
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: widget.title,
      route: widget.route,
      floatingActionButton: FloatingActionButton(onPressed: _openAddForm, child: const Icon(Icons.add)),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _search,
              decoration: const InputDecoration(prefixIcon: Icon(Icons.search), hintText: 'Rechercher…'),
              onChanged: (v) => setState(() => _query = v.toLowerCase()),
            ),
          ),
          Expanded(
            child: AsyncView<List<T>>(
              future: _future,
              onRetry: _reload,
              builder: (context, items) {
                final filtered = _query.isEmpty
                    ? items
                    : items.where((i) => widget.searchText(i).toLowerCase().contains(_query)).toList();
                if (filtered.isEmpty) {
                  return const EmptyState(message: 'Aucun résultat');
                }
                return RefreshIndicator(
                  onRefresh: () async => _reload(),
                  child: ListView.builder(
                    padding: const EdgeInsets.only(bottom: 80),
                    itemCount: filtered.length,
                    itemBuilder: (context, i) {
                      final item = filtered[i];
                      final child = widget.itemBuilder(context, item);
                      if (!widget.canDelete) return child;
                      return Dismissible(
                        key: ValueKey(widget.idOf(item)),
                        direction: DismissDirection.endToStart,
                        background: Container(
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 24),
                          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(color: Colors.red.shade400, borderRadius: BorderRadius.circular(14)),
                          child: const Icon(Icons.delete, color: Colors.white),
                        ),
                        confirmDismiss: (_) => showDialog<bool>(
                          context: context,
                          builder: (ctx) => AlertDialog(
                            title: const Text('Confirmer la suppression'),
                            content: const Text('Cette action est irréversible.'),
                            actions: [
                              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annuler')),
                              TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Supprimer')),
                            ],
                          ),
                        ).then((v) => v ?? false),
                        onDismissed: (_) => _delete(widget.idOf(item)),
                        child: child,
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

class _AddItemSheet extends StatefulWidget {
  const _AddItemSheet({required this.fields, required this.title, required this.values});
  final List<CrudField> fields;
  final String title;
  final Map<String, dynamic> values;

  @override
  State<_AddItemSheet> createState() => _AddItemSheetState();
}

class _AddItemSheetState extends State<_AddItemSheet> {
  final _formKey = GlobalKey<FormState>();

  TextInputType _keyboardType(CrudFieldType t) {
    switch (t) {
      case CrudFieldType.number:
        return TextInputType.number;
      case CrudFieldType.email:
        return TextInputType.emailAddress;
      case CrudFieldType.tel:
        return TextInputType.phone;
      case CrudFieldType.url:
        return TextInputType.url;
      case CrudFieldType.password:
        return TextInputType.visiblePassword;
      default:
        return TextInputType.text;
    }
  }

  /// Client-side validation so obviously-invalid input never reaches the server at all —
  /// previously only "required" was checked, so a too-short password or a malformed URL
  /// silently failed server-side with no explanation the user could act on.
  String? _validate(CrudField field, String? value) {
    final v = value?.trim() ?? '';
    if (field.required && v.isEmpty) return 'Requis';
    if (v.isEmpty) return null;
    if (field.type == CrudFieldType.password && v.length < 8) return 'Minimum 8 caractères';
    if (field.type == CrudFieldType.email && !v.contains('@')) return 'Email invalide';
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(widget.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              for (final field in widget.fields) ...[
                if (field.type == CrudFieldType.select)
                  DropdownButtonFormField<String>(
                    decoration: InputDecoration(labelText: field.label),
                    items: field.options!
                        .map((o) => DropdownMenuItem(value: o.key, child: Text(o.value)))
                        .toList(),
                    onChanged: (v) => widget.values[field.name] = v,
                    validator: field.required ? (v) => v == null ? 'Requis' : null : null,
                  )
                else
                  TextFormField(
                    decoration: InputDecoration(labelText: field.label),
                    keyboardType: _keyboardType(field.type),
                    obscureText: field.type == CrudFieldType.password,
                    onChanged: (v) => widget.values[field.name] = v,
                    validator: (v) => _validate(field, v),
                  ),
                const SizedBox(height: 12),
              ],
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    if (_formKey.currentState!.validate()) {
                      Navigator.of(context).pop(true);
                    }
                  },
                  child: const Text('Enregistrer'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
