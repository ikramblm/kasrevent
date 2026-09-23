import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Field, Input } from "../components/ui/Field";
import { api } from "../api/client";

interface AdminConfigData {
  nom?: string | null;
  lienFacebook?: string | null;
  lienInstagram?: string | null;
  lienUtile?: string | null;
  numeroWhatsapp?: string | null;
}

export default function AdminConfig() {
  const [form, setForm] = useState<AdminConfigData>({});
  const { data } = useQuery({ queryKey: ["admin-config"], queryFn: async () => (await api.get<AdminConfigData>("/admin-config")).data });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation({ mutationFn: async () => api.patch("/admin-config", form) });

  return (
    <DashboardLayout title="Configuration">
      <Card className="max-w-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
        >
          <Field label="Nom de l'établissement">
            <Input value={form.nom ?? ""} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} />
          </Field>
          <Field label="Numéro WhatsApp">
            <Input value={form.numeroWhatsapp ?? ""} onChange={(e) => setForm((f) => ({ ...f, numeroWhatsapp: e.target.value }))} />
          </Field>
          <Field label="Lien Facebook">
            <Input type="url" value={form.lienFacebook ?? ""} onChange={(e) => setForm((f) => ({ ...f, lienFacebook: e.target.value }))} />
          </Field>
          <Field label="Lien Instagram">
            <Input type="url" value={form.lienInstagram ?? ""} onChange={(e) => setForm((f) => ({ ...f, lienInstagram: e.target.value }))} />
          </Field>
          <Button type="submit" disabled={saveMutation.isPending}>
            Enregistrer
          </Button>
          {saveMutation.isSuccess && <span className="ml-3 text-sm text-emerald-600">Enregistré ✓</span>}
        </form>
      </Card>
    </DashboardLayout>
  );
}
