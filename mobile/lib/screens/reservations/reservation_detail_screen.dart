import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/api_client.dart';
import '../../core/pdf_helper.dart';
import '../../models/invite.dart';
import '../../models/reponse_invitation.dart';
import '../../models/reservation.dart';
import '../../models/service_table.dart';
import '../../models/traiteur.dart';
import '../../widgets/status_badge.dart';

class ReservationDetailScreen extends StatefulWidget {
  const ReservationDetailScreen({super.key, required this.reservationId});
  final String reservationId;

  @override
  State<ReservationDetailScreen> createState() => _ReservationDetailScreenState();
}

class _ReservationDetailScreenState extends State<ReservationDetailScreen> {
  Reservation? _reservation;
  List<Invite> _invites = [];
  List<ServiceTableItem> _services = [];
  List<ReponseInvitation> _reponses = [];
  bool _loading = true;
  bool _pdfBusy = false;
  String? _error;
  final _dateFormat = DateFormat('dd/MM/yyyy');
  final _money = NumberFormat.decimalPattern('fr_FR');

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final api = context.read<ApiClient>();
    try {
      final results = await Future.wait([
        api.dio.get('/reservations/${widget.reservationId}'),
        api.dio.get('/invites', queryParameters: {'reservationId': widget.reservationId}),
        api.dio.get('/services-tables', queryParameters: {'reservationId': widget.reservationId}),
        api.dio.get('/reponses-invitation', queryParameters: {'reservationId': widget.reservationId}),
      ]);
      _reservation = Reservation.fromJson(results[0].data as Map<String, dynamic>);
      _invites = (results[1].data as List).map((e) => Invite.fromJson(e as Map<String, dynamic>)).toList();
      _services = (results[2].data as List).map((e) => ServiceTableItem.fromJson(e as Map<String, dynamic>)).toList();
      _reponses = (results[3].data as List).map((e) => ReponseInvitation.fromJson(e as Map<String, dynamic>)).toList();
      _error = null;
    } catch (e) {
      _error = apiErrorMessage(e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _shareFacture() async {
    setState(() => _pdfBusy = true);
    try {
      await downloadAndSharePdf(
        context.read<ApiClient>().dio,
        '/reservations/${widget.reservationId}/invoice.pdf',
        'facture-${widget.reservationId}.pdf',
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(e))));
    } finally {
      if (mounted) setState(() => _pdfBusy = false);
    }
  }

  Future<void> _shareGuestPass(Invite invite) async {
    try {
      await downloadAndSharePdf(
        context.read<ApiClient>().dio,
        '/reservations/${widget.reservationId}/invites/${invite.id}/pass.pdf',
        'invite-${invite.nom}.pdf',
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(e))));
    }
  }

  Future<void> _addServiceTable() async {
    String type = 'BUFFET';
    String? traiteurId;
    final prixCtrl = TextEditingController();
    final traiteurs = await context
        .read<ApiClient>()
        .dio
        .get('/traiteurs')
        .then((r) => (r.data as List).map((e) => Traiteur.fromJson(e)).toList());

    if (!mounted) return;
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(ctx).viewInsets.bottom + 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Ajouter un service', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: type,
                decoration: const InputDecoration(labelText: 'Type de service'),
                items: typeServiceValues.map((t) => DropdownMenuItem(value: t, child: Text(typeServiceLabel(t)))).toList(),
                onChanged: (v) => setSheetState(() => type = v ?? 'BUFFET'),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(labelText: 'Traiteur'),
                items: traiteurs.map((t) => DropdownMenuItem(value: t.id, child: Text(t.nom))).toList(),
                onChanged: (v) => setSheetState(() => traiteurId = v),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: prixCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Prix par personne (DA)'),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Ajouter')),
              ),
            ],
          ),
        ),
      ),
    );

    if (saved != true) return;
    if (!mounted) return;
    try {
      await context.read<ApiClient>().dio.post('/services-tables', data: {
        'reservationId': widget.reservationId,
        'typeService': type,
        if (traiteurId != null) 'traiteurId': traiteurId!,
        'prixParPersonne': num.tryParse(prixCtrl.text) ?? 0,
      });
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(e))));
    }
  }

  Future<void> _confirmerReponse(ReponseInvitation reponse) async {
    try {
      await context.read<ApiClient>().dio.post('/reponses-invitation/${reponse.id}/confirmer');
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(e))));
    }
  }

  Future<void> _closeReservation() async {
    final api = context.read<ApiClient>();
    try {
      await api.dio.post('/reservations/${widget.reservationId}/close');
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(e))));
    }
  }

  Future<void> _archiveReservation() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Archiver et supprimer'),
        content: const Text('La réservation sera copiée dans les archives puis supprimée. Continuer ?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annuler')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Confirmer')),
        ],
      ),
    );
    if (confirm != true) return;
    if (!mounted) return;
    final api = context.read<ApiClient>();
    try {
      await api.dio.post('/reservations/${widget.reservationId}/archive', queryParameters: {'alsoDelete': 'true'});
      if (!mounted) return;
      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(e))));
    }
  }

  Future<void> _addGuest() async {
    final nomCtrl = TextEditingController();
    final prenomCtrl = TextEditingController();
    final telCtrl = TextEditingController();
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Ajouter un invité', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            TextField(controller: nomCtrl, decoration: const InputDecoration(labelText: 'Nom')),
            const SizedBox(height: 12),
            TextField(controller: prenomCtrl, decoration: const InputDecoration(labelText: 'Prénom')),
            const SizedBox(height: 12),
            TextField(controller: telCtrl, decoration: const InputDecoration(labelText: 'Téléphone')),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Ajouter'),
              ),
            ),
          ],
        ),
      ),
    );
    if (saved != true || nomCtrl.text.trim().isEmpty) return;
    if (!mounted) return;
    final api = context.read<ApiClient>();
    try {
      await api.dio.post('/invites', data: {
        'reservationId': widget.reservationId,
        'nom': nomCtrl.text.trim(),
        if (prenomCtrl.text.isNotEmpty) 'prenom': prenomCtrl.text.trim(),
        if (telCtrl.text.isNotEmpty) 'telephone': telCtrl.text.trim(),
      });
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(e))));
    }
  }

  Future<void> _showQr(Invite invite) async {
    final api = context.read<ApiClient>();
    try {
      final res = await api.dio.get('/invites/${invite.id}/qrcode');
      final dataUrl = res.data['qrCodeDataUrl'] as String;
      final bytes = base64Decode(dataUrl.split(',').last);
      if (!mounted) return;
      await showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text('QR code — ${invite.nom}'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Image.memory(bytes, width: 220, height: 220),
              const SizedBox(height: 10),
              const Text("À présenter à l'entrée pour le check-in.", textAlign: TextAlign.center),
            ],
          ),
          actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Fermer'))],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(e))));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(appBar: AppBar(), body: const Center(child: CircularProgressIndicator()));
    }
    if (_error != null || _reservation == null) {
      return Scaffold(appBar: AppBar(), body: Center(child: Text(_error ?? 'Introuvable')));
    }
    final r = _reservation!;
    return Scaffold(
      appBar: AppBar(
        title: Text(r.client?.nom ?? 'Réservation'),
        actions: [
          IconButton(
            icon: _pdfBusy
                ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.picture_as_pdf_outlined),
            tooltip: 'Facture PDF',
            onPressed: _pdfBusy ? null : _shareFacture,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    '${_dateFormat.format(r.dateDebut)} → ${_dateFormat.format(r.dateFin)}\n${r.salle?.nom ?? 'Salle non assignée'}',
                    style: const TextStyle(color: Colors.black54),
                  ),
                ),
                StatusBadge(status: statutToJson(r.statut)),
              ],
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _infoRow("Type d'évènement", typeEvenementLabel(r.typeEvenement)),
                    _infoRow('Invités attendus', '${r.nombreInvites}'),
                    _infoRow('Total à payer', '${_money.format(r.totalAPayer)} DA'),
                    _infoRow('Avance versée', '${_money.format(r.avanceVersee)} DA'),
                    _infoRow('Reste à payer', '${_money.format(r.resteAPayer)} DA', color: Colors.redAccent),
                    _infoRow('Politique confiscation', r.confiscationPolicy ? 'Activée' : 'Désactivée'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: r.statut == StatutReservation.cloture ? null : _closeReservation,
                    child: const Text('Clôturer'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(foregroundColor: Colors.redAccent),
                    onPressed: (r.statut == StatutReservation.cloture || r.statut == StatutReservation.annulee)
                        ? _archiveReservation
                        : null,
                    child: const Text('Archiver'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Invités (${_invites.length})', style: Theme.of(context).textTheme.titleMedium),
                TextButton.icon(onPressed: _addGuest, icon: const Icon(Icons.add), label: const Text('Ajouter')),
              ],
            ),
            if (_invites.isEmpty) const Padding(padding: EdgeInsets.all(8), child: Text('Aucun invité pour le moment.')),
            for (final invite in _invites)
              Card(
                margin: const EdgeInsets.symmetric(vertical: 4),
                child: ListTile(
                  title: Text('${invite.nom} ${invite.prenom ?? ''}'),
                  subtitle: Text(invite.heureEntree != null
                      ? 'Entré à ${DateFormat('HH:mm').format(invite.heureEntree!)}'
                      : 'Pas encore arrivé'),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(icon: const Icon(Icons.qr_code), tooltip: 'Voir le QR', onPressed: () => _showQr(invite)),
                      IconButton(
                        icon: const Icon(Icons.picture_as_pdf_outlined),
                        tooltip: 'Carte invité PDF',
                        onPressed: () => _shareGuestPass(invite),
                      ),
                    ],
                  ),
                ),
              ),

            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Services (${_services.length})', style: Theme.of(context).textTheme.titleMedium),
                TextButton.icon(onPressed: _addServiceTable, icon: const Icon(Icons.add), label: const Text('Ajouter')),
              ],
            ),
            if (_services.isEmpty) const Padding(padding: EdgeInsets.all(8), child: Text('Aucun service ajouté.')),
            for (final service in _services)
              Card(
                margin: const EdgeInsets.symmetric(vertical: 4),
                child: ListTile(
                  title: Text('${typeServiceLabel(service.typeService)}${service.traiteurNom != null ? " — ${service.traiteurNom}" : ""}'),
                  subtitle: Text('${service.nombreInvites} invités × ${_money.format(service.prixParPersonne)} DA'),
                  trailing: Text('${_money.format(service.total)} DA', style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),

            if (_reponses.isNotEmpty) ...[
              const SizedBox(height: 24),
              Text('Réponses invitations (${_reponses.length})', style: Theme.of(context).textTheme.titleMedium),
              for (final reponse in _reponses)
                Card(
                  margin: const EdgeInsets.symmetric(vertical: 4),
                  child: ListTile(
                    title: Text(reponse.nomPrenom),
                    subtitle: Text(reponse.numeroTelephone ?? ''),
                    trailing: OutlinedButton(
                      onPressed: () => _confirmerReponse(reponse),
                      child: const Text('Confirmer'),
                    ),
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.black54)),
          Text(value, style: TextStyle(fontWeight: FontWeight.w600, color: color)),
        ],
      ),
    );
  }
}
