import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Modal } from "../components/ui/Modal";
import { Field, Input } from "../components/ui/Field";
import { api } from "../api/client";
import type { Invite, Reservation } from "../types";

export default function ReservationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [guestOpen, setGuestOpen] = useState(false);
  const [guestForm, setGuestForm] = useState({ nom: "", prenom: "", telephone: "" });
  const [qrGuest, setQrGuest] = useState<{ nom: string; dataUrl: string } | null>(null);

  const { data: reservation } = useQuery({
    queryKey: ["reservations", id],
    queryFn: async () => (await api.get<Reservation>(`/reservations/${id}`)).data,
    enabled: !!id
  });

  const { data: invites } = useQuery({
    queryKey: ["invites", id],
    queryFn: async () => (await api.get<Invite[]>(`/invites?reservationId=${id}`)).data,
    enabled: !!id
  });

  const addGuest = useMutation({
    mutationFn: async () => (await api.post("/invites", { reservationId: id, ...guestForm })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invites", id] });
      setGuestOpen(false);
      setGuestForm({ nom: "", prenom: "", telephone: "" });
    }
  });

  const closeReservation = useMutation({
    mutationFn: async () => (await api.post(`/reservations/${id}/close`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reservations", id] })
  });

  const archiveReservation = useMutation({
    mutationFn: async () => api.post(`/reservations/${id}/archive?alsoDelete=true`),
    onSuccess: () => navigate("/reservations")
  });

  async function showQr(inviteId: string, nom: string) {
    const res = await api.get(`/invites/${inviteId}/qrcode`);
    setQrGuest({ nom, dataUrl: res.data.qrCodeDataUrl });
  }

  if (!reservation) {
    return (
      <DashboardLayout title="Réservation">
        <p className="text-slate-400">Chargement…</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Réservation — ${reservation.client?.nom ?? ""}`}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{reservation.client?.nom}</h2>
              <p className="text-sm text-slate-500">
                {new Date(reservation.dateDebut).toLocaleDateString("fr-FR")} → {new Date(reservation.dateFin).toLocaleDateString("fr-FR")} ·{" "}
                {reservation.salle?.nom ?? "Salle non assignée"}
              </p>
            </div>
            <StatusBadge status={reservation.statut} />
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-slate-500">Type</dt>
              <dd className="font-medium text-slate-800">{reservation.typeEvenement}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Invités attendus</dt>
              <dd className="font-medium text-slate-800">{reservation.nombreInvites}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Total à payer</dt>
              <dd className="font-medium text-slate-800">{Number(reservation.totalAPayer).toLocaleString("fr-FR")} DA</dd>
            </div>
            <div>
              <dt className="text-slate-500">Avance versée</dt>
              <dd className="font-medium text-slate-800">{Number(reservation.avanceVersee).toLocaleString("fr-FR")} DA</dd>
            </div>
            <div>
              <dt className="text-slate-500">Reste à payer</dt>
              <dd className="font-medium text-rose-600">{Number(reservation.resteAPayer).toLocaleString("fr-FR")} DA</dd>
            </div>
            <div>
              <dt className="text-slate-500">Politique confiscation</dt>
              <dd className="font-medium text-slate-800">{reservation.confiscationPolicy ? "Activée" : "Désactivée"}</dd>
            </div>
          </dl>

          {reservation.invitationLink && (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
              <span className="font-medium text-slate-600">Lien d'invitation invités : </span>
              <a href={reservation.invitationLink} className="text-brand-600 hover:underline" target="_blank" rel="noreferrer">
                {reservation.invitationLink}
              </a>
            </div>
          )}

          <div className="mt-5 flex gap-2">
            <Button variant="secondary" onClick={() => closeReservation.mutate()} disabled={reservation.statut === "CLOTURE"}>
              Clôturer
            </Button>
            <Button
              variant="danger"
              onClick={() => archiveReservation.mutate()}
              disabled={!["CLOTURE", "ANNULEE"].includes(reservation.statut)}
            >
              Archiver et supprimer
            </Button>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Invités ({invites?.length ?? 0})</h2>
            <Button variant="ghost" onClick={() => setGuestOpen(true)}>
              + Ajouter
            </Button>
          </div>
          <ul className="space-y-2">
            {(invites ?? []).map((invite) => (
              <li key={invite.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-700">
                    {invite.nom} {invite.prenom}
                  </p>
                  <p className="text-xs text-slate-400">{invite.heureEntree ? `Entré à ${new Date(invite.heureEntree).toLocaleTimeString("fr-FR")}` : "Pas encore arrivé"}</p>
                </div>
                <button onClick={() => showQr(invite.id, invite.nom)} className="text-brand-600 hover:underline">
                  QR
                </button>
              </li>
            ))}
            {(invites ?? []).length === 0 && <p className="text-sm text-slate-400">Aucun invité pour le moment.</p>}
          </ul>
        </Card>
      </div>

      <Modal open={guestOpen} onClose={() => setGuestOpen(false)} title="Ajouter un invité">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addGuest.mutate();
          }}
        >
          <Field label="Nom">
            <Input required value={guestForm.nom} onChange={(e) => setGuestForm((f) => ({ ...f, nom: e.target.value }))} />
          </Field>
          <Field label="Prénom">
            <Input value={guestForm.prenom} onChange={(e) => setGuestForm((f) => ({ ...f, prenom: e.target.value }))} />
          </Field>
          <Field label="Téléphone">
            <Input value={guestForm.telephone} onChange={(e) => setGuestForm((f) => ({ ...f, telephone: e.target.value }))} />
          </Field>
          <Button type="submit" className="w-full">
            Ajouter
          </Button>
        </form>
      </Modal>

      <Modal open={!!qrGuest} onClose={() => setQrGuest(null)} title={`QR code — ${qrGuest?.nom ?? ""}`}>
        {qrGuest && (
          <div className="flex flex-col items-center gap-3">
            <img src={qrGuest.dataUrl} alt="QR code" className="h-56 w-56" />
            <p className="text-sm text-slate-500">À présenter à l'entrée pour le check-in.</p>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
