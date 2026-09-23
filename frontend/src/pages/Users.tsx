import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { DataTable } from "../components/ui/DataTable";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Field, Input, Select } from "../components/ui/Field";
import { api } from "../api/client";
import type { CurrentUser } from "../types";

export default function Users() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nom: "", email: "", role: "USER", password: "" });
  const queryClient = useQueryClient();

  const { data: users } = useQuery({ queryKey: ["users"], queryFn: async () => (await api.get<CurrentUser[]>("/users")).data });

  const createMutation = useMutation({
    mutationFn: async () => api.post("/users", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
      setForm({ nom: "", email: "", role: "USER", password: "" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] })
  });

  return (
    <DashboardLayout title="Utilisateurs">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>+ Nouvel utilisateur</Button>
      </div>
      <DataTable<CurrentUser>
        columns={[
          { header: "Nom", accessor: (u) => u.nom, searchValue: (u) => u.nom },
          { header: "Email", accessor: (u) => u.email ?? "—" },
          { header: "Rôle", accessor: (u) => u.role }
        ]}
        rows={users ?? []}
        actions={(u) => (
          <Button variant="danger" onClick={() => deleteMutation.mutate(u.id)}>
            Supprimer
          </Button>
        )}
      />

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvel utilisateur">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
        >
          <Field label="Nom">
            <Input required value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} />
          </Field>
          <Field label="Email">
            <Input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </Field>
          <Field label="Rôle">
            <Select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
              <option value="USER">Utilisateur</option>
              <option value="GERANT">Gérant</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </Field>
          <Field label="Mot de passe temporaire">
            <Input type="password" required minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          </Field>
          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            Créer
          </Button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
