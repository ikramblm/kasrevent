import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "../layout/DashboardLayout";
import { DataTable, type Column } from "../ui/DataTable";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Field, Input, Select } from "../ui/Field";
import { api } from "../../api/client";

export interface CrudField {
  name: string;
  label: string;
  type?: "text" | "number" | "email" | "tel" | "url" | "select" | "checkbox";
  options?: { value: string; label: string }[];
  required?: boolean;
}

export interface SimpleCrudConfig<T extends { id: string }> {
  title: string;
  endpoint: string;
  fields: CrudField[];
  columns: Column<T>[];
  newButtonLabel?: string;
}

export function SimpleCrudPage<T extends { id: string }>({ title, endpoint, fields, columns, newButtonLabel }: SimpleCrudConfig<T>) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string | boolean>>({});

  const { data } = useQuery({
    queryKey: [endpoint],
    queryFn: async () => (await api.get<T[]>(endpoint)).data
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => (await api.post(endpoint, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      setOpen(false);
      setForm({});
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`${endpoint}/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [endpoint] })
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {};
    for (const field of fields) {
      const value = form[field.name];
      if (value === undefined || value === "") continue;
      payload[field.name] = field.type === "number" ? Number(value) : value;
    }
    createMutation.mutate(payload);
  }

  return (
    <DashboardLayout title={title}>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>{newButtonLabel ?? `+ Ajouter`}</Button>
      </div>
      <DataTable
        columns={columns}
        rows={data ?? []}
        actions={(row) => (
          <Button variant="danger" onClick={() => deleteMutation.mutate(row.id)}>
            Supprimer
          </Button>
        )}
      />
      <Modal open={open} onClose={() => setOpen(false)} title={newButtonLabel ?? "Ajouter"}>
        <form onSubmit={handleSubmit}>
          {fields.map((field) => (
            <Field key={field.name} label={field.label}>
              {field.type === "select" ? (
                <Select
                  required={field.required}
                  value={(form[field.name] as string) ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, [field.name]: e.target.value }))}
                >
                  <option value="">—</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  type={field.type ?? "text"}
                  required={field.required}
                  value={(form[field.name] as string) ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, [field.name]: e.target.value }))}
                />
              )}
            </Field>
          ))}
          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            Enregistrer
          </Button>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
