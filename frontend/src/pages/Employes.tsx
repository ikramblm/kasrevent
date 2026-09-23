import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { DataTable } from "../components/ui/DataTable";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Field, Input, Select } from "../components/ui/Field";
import { api } from "../api/client";
import type { Employe } from "../types";

export default function Employes() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    role: "",
    telephone: "",
    typePaie: "MENSUELLE",
    paieMensuelle: "",
    paieParJour: "",
    jourDePaie: ""
  });
  const queryClient = useQueryClient();

  const { data: employes } = useQuery({ queryKey: ["employes"], queryFn: async () => (await api.get<Employe[]>("/employes")).data });

  const createMutation = useMutation({
    mutationFn: async () =>
      api.post("/employes", {
        nom: form.nom,
        role: form.role,
        telephone: form.telephone || undefined,
        typePaie: form.typePaie,
        paieMensuelle: form.paieMensuelle ? Number(form.paieMensuelle) : undefined,
        paieParJour: form.paieParJour ? Number(form.paieParJour) : undefined,
        jourDePaie: form.jourDePaie ? Number(form.jourDePaie) : undefined
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employes"] });
      setOpen(false);
    }
  });

  const payrollMutation = useMutation({
    mutationFn: async () => (await api.post("/employes/run-monthly-payroll")).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employes"] })
  });

  return (
    <DashboardLayout title="Employés">
      <div className="mb-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => payrollMutation.mutate()} disabled={payrollMutation.isPending}>
          Exécuter la paie mensuelle du jour
        </Button>
        <Button onClick={() => setOpen(true)}>+ Nouvel employé</Button>
      </div>

      {payrollMutation.data && (
        <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          {payrollMutation.data.paidCount} employé(s) payé(s) pour aujourd'hui.
        </p>
      )}

      <DataTable<Employe>
        columns={[
          { header: "Nom", accessor: (e) => `${e.nom} ${e.prenom ?? ""}`, searchValue: (e) => e.nom },
          { header: "Rôle", accessor: (e) => e.role },
          { header: "Type de paie", accessor: (e) => (e.typePaie === "MENSUELLE" ? "Mensuelle" : "Journalière") },
          { header: "Montant à payer", accessor: (e) => `${Number(e.montantAPayer).toLocaleString("fr-FR")} DA` },
          { header: "Disponible", accessor: (e) => (e.disponibilite ? "Oui" : "Non") }
        ]}
        rows={employes ?? []}
      />

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvel employé">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
        >
          <Field label="Nom">
            <Input required value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} />
          </Field>
          <Field label="Rôle">
            <Input required value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
          </Field>
          <Field label="Téléphone">
            <Input value={form.telephone} onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))} />
          </Field>
          <Field label="Type de paie">
            <Select value={form.typePaie} onChange={(e) => setForm((f) => ({ ...f, typePaie: e.target.value }))}>
              <option value="MENSUELLE">Mensuelle</option>
              <option value="JOURNALIERE">Journalière</option>
            </Select>
          </Field>
          {form.typePaie === "MENSUELLE" ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Paie mensuelle (DA)">
                <Input type="number" value={form.paieMensuelle} onChange={(e) => setForm((f) => ({ ...f, paieMensuelle: e.target.value }))} />
              </Field>
              <Field label="Jour de paie (1-31)">
                <Input type="number" min={1} max={31} value={form.jourDePaie} onChange={(e) => setForm((f) => ({ ...f, jourDePaie: e.target.value }))} />
              </Field>
            </div>
          ) : (
            <Field label="Paie par jour (DA)">
              <Input type="number" value={form.paieParJour} onChange={(e) => setForm((f) => ({ ...f, paieParJour: e.target.value }))} />
            </Field>
          )}
          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            Enregistrer
          </Button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
