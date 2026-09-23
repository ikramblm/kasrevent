import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { DataTable } from "../components/ui/DataTable";
import { Button } from "../components/ui/Button";
import { api } from "../api/client";

interface Demande {
  id: string;
  nomPrenom: string;
  numeroTelephone: string;
  dateDebut?: string | null;
  dateFin?: string | null;
  typeEvenement?: string | null;
  reservationId?: string | null;
}

export default function DemandesReservation() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["demandes"], queryFn: async () => (await api.get<Demande[]>("/demandes-reservation")).data });

  const enregistrerClient = useMutation({
    mutationFn: async (id: string) => (await api.post(`/demandes-reservation/${id}/enregistrer-client`)).data,
    onSuccess: () => alert("Client enregistré. Vous pouvez maintenant créer la réservation depuis la page Clients/Réservations."),
    onError: () => alert("Échec de l'enregistrement du client.")
  });

  return (
    <DashboardLayout title="Demandes de réservation">
      <p className="mb-4 text-sm text-slate-500">
        Intake public (remplace le formulaire Google Forms de l'application d'origine). Convertissez une demande en client puis en réservation.
      </p>
      <DataTable<Demande>
        columns={[
          { header: "Nom", accessor: (d) => d.nomPrenom, searchValue: (d) => d.nomPrenom },
          { header: "Téléphone", accessor: (d) => d.numeroTelephone },
          { header: "Type", accessor: (d) => d.typeEvenement ?? "—" },
          { header: "Dates", accessor: (d) => (d.dateDebut ? new Date(d.dateDebut).toLocaleDateString("fr-FR") : "—") },
          { header: "Statut", accessor: (d) => (d.reservationId ? "Convertie" : "En attente") }
        ]}
        rows={data ?? []}
        actions={(d) =>
          !d.reservationId && (
            <Button variant="secondary" onClick={() => enregistrerClient.mutate(d.id)}>
              Enregistrer le client
            </Button>
          )
        }
      />
    </DashboardLayout>
  );
}
