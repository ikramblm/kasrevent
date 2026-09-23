import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { DataTable } from "../components/ui/DataTable";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Field, Input, Select } from "../components/ui/Field";
import { api } from "../api/client";
import type { Fournisseur, Traiteur, Employe } from "../types";

interface Charge {
  id: string;
  type: string;
  montantTotal: string | number;
  montantPaye: string | number;
  methodePaiement: string;
  dateHeure: string;
  fournisseur?: { company: string } | null;
  traiteur?: { nom: string } | null;
  employe?: { nom: string } | null;
}

const TYPE_LABELS: Record<string, string> = {
  ACHAT: "Achat",
  APPROVISIONNEMENT: "Approvisionnement",
  PAIEMENT_SALAIRE: "Paiement salaire",
  PAIEMENT_DETTES_FOURNISSEURS: "Paiement dettes fournisseurs",
  PAIEMENT_DETTES_TRAITEURS: "Paiement dettes traiteurs",
  PAIEMENT_FACTURES: "Paiement factures",
  INVESTISSEMENT: "Investissement",
  REPARATION: "Réparation",
  AUTRE: "Autre"
};

export default function Charges() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(searchParams.get("new") === "1");
  const [form, setForm] = useState({
    type: "ACHAT",
    fournisseurId: "",
    traiteurId: "",
    employeId: "",
    montantTotal: "",
    montantPaye: "",
    methodePaiement: "ESPECE",
    description: ""
  });
  const queryClient = useQueryClient();

  const { data: charges } = useQuery({ queryKey: ["charges"], queryFn: async () => (await api.get<Charge[]>("/charges")).data });
  const { data: fournisseurs } = useQuery({ queryKey: ["fournisseurs"], queryFn: async () => (await api.get<Fournisseur[]>("/fournisseurs")).data });
  const { data: traiteurs } = useQuery({ queryKey: ["traiteurs"], queryFn: async () => (await api.get<Traiteur[]>("/traiteurs")).data });
  const { data: employes } = useQuery({ queryKey: ["employes"], queryFn: async () => (await api.get<Employe[]>("/employes")).data });

  const createMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post("/charges", {
          type: form.type,
          fournisseurId: form.fournisseurId || undefined,
          traiteurId: form.traiteurId || undefined,
          employeId: form.employeId || undefined,
          montantTotal: Number(form.montantTotal || 0),
          montantPaye: Number(form.montantPaye || 0),
          methodePaiement: form.methodePaiement,
          description: form.description || undefined
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charges"] });
      queryClient.invalidateQueries({ queryKey: ["fournisseurs"] });
      queryClient.invalidateQueries({ queryKey: ["traiteurs"] });
      queryClient.invalidateQueries({ queryKey: ["employes"] });
      closeModal();
    }
  });

  function closeModal() {
    setOpen(false);
    searchParams.delete("new");
    setSearchParams(searchParams);
  }

  const showFournisseur = ["ACHAT", "APPROVISIONNEMENT", "INVESTISSEMENT", "PAIEMENT_DETTES_FOURNISSEURS"].includes(form.type);
  const showTraiteur = form.type === "PAIEMENT_DETTES_TRAITEURS";
  const showEmploye = form.type === "PAIEMENT_SALAIRE";

  return (
    <DashboardLayout title="Charges">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>+ Nouvelle charge</Button>
      </div>
      <DataTable<Charge>
        columns={[
          { header: "Type", accessor: (c) => TYPE_LABELS[c.type] ?? c.type },
          { header: "Lié à", accessor: (c) => c.fournisseur?.company ?? c.traiteur?.nom ?? c.employe?.nom ?? "—" },
          { header: "Montant total", accessor: (c) => `${Number(c.montantTotal).toLocaleString("fr-FR")} DA` },
          { header: "Montant payé", accessor: (c) => `${Number(c.montantPaye).toLocaleString("fr-FR")} DA` },
          { header: "Méthode", accessor: (c) => c.methodePaiement },
          { header: "Date", accessor: (c) => new Date(c.dateHeure).toLocaleDateString("fr-FR") }
        ]}
        rows={charges ?? []}
      />

      <Modal open={open} onClose={closeModal} title="Nouvelle charge">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
        >
          <Field label="Type de charge">
            <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          {showFournisseur && (
            <Field label="Fournisseur">
              <Select value={form.fournisseurId} onChange={(e) => setForm((f) => ({ ...f, fournisseurId: e.target.value }))}>
                <option value="">—</option>
                {fournisseurs?.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.company}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {showTraiteur && (
            <Field label="Traiteur">
              <Select value={form.traiteurId} onChange={(e) => setForm((f) => ({ ...f, traiteurId: e.target.value }))}>
                <option value="">—</option>
                {traiteurs?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nom}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {showEmploye && (
            <Field label="Employé">
              <Select value={form.employeId} onChange={(e) => setForm((f) => ({ ...f, employeId: e.target.value }))}>
                <option value="">—</option>
                {employes?.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nom}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Montant total">
              <Input type="number" value={form.montantTotal} onChange={(e) => setForm((f) => ({ ...f, montantTotal: e.target.value }))} />
            </Field>
            <Field label="Montant payé">
              <Input type="number" value={form.montantPaye} onChange={(e) => setForm((f) => ({ ...f, montantPaye: e.target.value }))} />
            </Field>
          </div>
          <Field label="Méthode de paiement">
            <Select value={form.methodePaiement} onChange={(e) => setForm((f) => ({ ...f, methodePaiement: e.target.value }))}>
              <option value="ESPECE">Espèce</option>
              <option value="CHEQUE">Chèque</option>
              <option value="VIREMENT">Virement</option>
              <option value="AUTRE">Autre</option>
            </Select>
          </Field>
          <Field label="Description">
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            Enregistrer
          </Button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
