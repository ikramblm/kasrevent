import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { DataTable } from "../components/ui/DataTable";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import { api } from "../api/client";

interface ConfiscationRow {
  id: string;
  statut: "CONFISQUE" | "RESTITUE";
  numeroTelephone?: string | null;
  heureConfiscation: string;
  heureRestitution?: string | null;
  invite?: { nom: string; prenom?: string } | null;
}

export default function Confiscations() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["confiscations"],
    queryFn: async () => (await api.get<ConfiscationRow[]>("/confiscations")).data
  });

  const restituteMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/confiscations/${id}/restitute`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["confiscations"] })
  });

  return (
    <DashboardLayout title="Confiscations de téléphones">
      <DataTable<ConfiscationRow>
        columns={[
          { header: "Invité", accessor: (c) => `${c.invite?.nom ?? "—"} ${c.invite?.prenom ?? ""}` },
          { header: "Téléphone", accessor: (c) => c.numeroTelephone ?? "—" },
          { header: "Confisqué le", accessor: (c) => new Date(c.heureConfiscation).toLocaleString("fr-FR") },
          { header: "Statut", accessor: (c) => <StatusBadge status={c.statut} /> }
        ]}
        rows={data ?? []}
        actions={(c) =>
          c.statut === "CONFISQUE" ? (
            <Button variant="secondary" onClick={() => restituteMutation.mutate(c.id)}>
              Restituer
            </Button>
          ) : (
            <span className="text-xs text-slate-400">{c.heureRestitution ? new Date(c.heureRestitution).toLocaleString("fr-FR") : ""}</span>
          )
        }
      />
    </DashboardLayout>
  );
}
