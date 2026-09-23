import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { DataTable } from "../components/ui/DataTable";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Field, Input, Select } from "../components/ui/Field";
import { StatusBadge } from "../components/ui/StatusBadge";
import { api } from "../api/client";
import type { Client, Reservation, Salle } from "../types";

export default function Reservations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(searchParams.get("new") === "1");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    clientId: "",
    salleId: "",
    dateDebut: "",
    dateFin: "",
    typeEvenement: "AUTRE",
    nombreInvites: "",
    totalAPayer: "",
    avanceVersee: ""
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: reservations } = useQuery({
    queryKey: ["reservations"],
    queryFn: async () => (await api.get<Reservation[]>("/reservations")).data
  });
  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: async () => (await api.get<Client[]>("/clients")).data });
  const { data: salles } = useQuery({ queryKey: ["salles"], queryFn: async () => (await api.get<Salle[]>("/salles")).data });

  const createMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post("/reservations", {
          clientId: form.clientId,
          salleId: form.salleId || undefined,
          dateDebut: form.dateDebut,
          dateFin: form.dateFin,
          typeEvenement: form.typeEvenement,
          nombreInvites: Number(form.nombreInvites || 0),
          totalAPayer: Number(form.totalAPayer || 0),
          avanceVersee: Number(form.avanceVersee || 0)
        })
      ).data,
    onSuccess: (data: Reservation) => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      closeModal();
      navigate(`/reservations/${data.id}`);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error ?? "Une erreur est survenue.");
    }
  });

  function closeModal() {
    setOpen(false);
    setError(null);
    searchParams.delete("new");
    setSearchParams(searchParams);
  }

  return (
    <DashboardLayout title="Réservations">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>+ Nouvelle réservation</Button>
      </div>
      <DataTable<Reservation>
        columns={[
          { header: "Client", accessor: (r) => r.client?.nom ?? "—", searchValue: (r) => r.client?.nom ?? "" },
          { header: "Salle", accessor: (r) => r.salle?.nom ?? "Non assignée" },
          { header: "Dates", accessor: (r) => `${new Date(r.dateDebut).toLocaleDateString("fr-FR")} → ${new Date(r.dateFin).toLocaleDateString("fr-FR")}` },
          { header: "Type", accessor: (r) => r.typeEvenement },
          { header: "Statut", accessor: (r) => <StatusBadge status={r.statut} /> },
          { header: "Reste à payer", accessor: (r) => `${Number(r.resteAPayer).toLocaleString("fr-FR")} DA` }
        ]}
        rows={reservations ?? []}
        actions={(r) => (
          <Link to={`/reservations/${r.id}`} className="text-sm font-medium text-brand-600 hover:underline">
            Détails
          </Link>
        )}
      />

      <Modal open={open} onClose={closeModal} title="Nouvelle réservation">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            createMutation.mutate();
          }}
        >
          <Field label="Client">
            <Select required value={form.clientId} onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}>
              <option value="">Sélectionner un client</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} {c.prenom}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Salle">
            <Select value={form.salleId} onChange={(e) => setForm((f) => ({ ...f, salleId: e.target.value }))}>
              <option value="">À déterminer</option>
              {salles?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nom}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date début">
              <Input type="date" required value={form.dateDebut} onChange={(e) => setForm((f) => ({ ...f, dateDebut: e.target.value }))} />
            </Field>
            <Field label="Date fin">
              <Input type="date" required value={form.dateFin} onChange={(e) => setForm((f) => ({ ...f, dateFin: e.target.value }))} />
            </Field>
          </div>
          <Field label="Type d'évènement">
            <Select value={form.typeEvenement} onChange={(e) => setForm((f) => ({ ...f, typeEvenement: e.target.value }))}>
              <option value="MARIAGE">Mariage</option>
              <option value="SEMINAIRE">Séminaire</option>
              <option value="ANNIVERSAIRE">Anniversaire</option>
              <option value="EVENEMENT">Évènement</option>
              <option value="AUTRE">Autre</option>
            </Select>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Nombre d'invités">
              <Input type="number" value={form.nombreInvites} onChange={(e) => setForm((f) => ({ ...f, nombreInvites: e.target.value }))} />
            </Field>
            <Field label="Total à payer">
              <Input type="number" value={form.totalAPayer} onChange={(e) => setForm((f) => ({ ...f, totalAPayer: e.target.value }))} />
            </Field>
            <Field label="Avance versée">
              <Input type="number" value={form.avanceVersee} onChange={(e) => setForm((f) => ({ ...f, avanceVersee: e.target.value }))} />
            </Field>
          </div>
          {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            Créer la réservation
          </Button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
