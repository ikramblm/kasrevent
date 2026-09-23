import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { DataTable } from "../components/ui/DataTable";
import { api } from "../api/client";

interface HistoriquePaieRow {
  id: string;
  moisPaye?: string | null;
  date: string;
  montant: string | number;
  montantPaye: string | number;
  methodePaiement: string;
  employe: { nom: string };
}

export default function HistoriquePaie() {
  const { data } = useQuery({
    queryKey: ["historique-paie"],
    queryFn: async () => (await api.get<HistoriquePaieRow[]>("/historique-paie")).data
  });

  return (
    <DashboardLayout title="Historique de paie">
      <DataTable<HistoriquePaieRow>
        columns={[
          { header: "Employé", accessor: (r) => r.employe.nom, searchValue: (r) => r.employe.nom },
          { header: "Mois", accessor: (r) => r.moisPaye ?? "—" },
          { header: "Date", accessor: (r) => new Date(r.date).toLocaleDateString("fr-FR") },
          { header: "Montant payé", accessor: (r) => `${Number(r.montantPaye).toLocaleString("fr-FR")} DA` },
          { header: "Méthode", accessor: (r) => r.methodePaiement }
        ]}
        rows={data ?? []}
      />
    </DashboardLayout>
  );
}
