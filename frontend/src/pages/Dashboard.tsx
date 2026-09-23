import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { KpiCard, Card } from "../components/ui/Card";
import { StatusBadge } from "../components/ui/StatusBadge";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { DashboardKpis, Reservation } from "../types";

function formatMoney(value: number) {
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} DA`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const canSeeFinance = user?.role === "ADMIN" || user?.role === "GERANT";

  const { data: kpis } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get<DashboardKpis>("/dashboard")).data,
    enabled: canSeeFinance
  });

  const { data: reservations } = useQuery({
    queryKey: ["reservations", "upcoming"],
    queryFn: async () => (await api.get<Reservation[]>("/reservations")).data
  });

  const upcoming = (reservations ?? [])
    .filter((r) => new Date(r.dateDebut) > new Date() && r.statut !== "ANNULEE")
    .sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime())[0];

  return (
    <DashboardLayout title="Tableau de bord">
      <div className="space-y-6">
        {canSeeFinance && kpis && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Chiffre d'affaire total" value={formatMoney(kpis.chiffreAffaireTotal)} />
            <KpiCard label="Revenus net" value={formatMoney(kpis.revenusNet)} tone="green" />
            <KpiCard label="Créances" value={formatMoney(kpis.creanceTotal)} tone="orange" />
            <KpiCard label="Dettes en attente" value={formatMoney(kpis.paiementDeDettes)} tone="red" />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Prochain évènement</h2>
            {upcoming ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-800">{upcoming.client?.nom ?? "Client"}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(upcoming.dateDebut).toLocaleDateString("fr-FR")} — {upcoming.salle?.nom ?? "Salle non assignée"}
                  </p>
                </div>
                <StatusBadge status={upcoming.statut} />
              </div>
            ) : (
              <p className="text-sm text-slate-400">Aucun évènement à venir.</p>
            )}
            <div className="mt-4">
              <Link to="/reservations" className="text-sm font-medium text-brand-600 hover:underline">
                Voir toutes les réservations →
              </Link>
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Actions rapides</h2>
            <div className="space-y-2 text-sm">
              <Link to="/reservations?new=1" className="block rounded-lg bg-slate-50 px-3 py-2 font-medium text-slate-700 hover:bg-slate-100">
                📅 Nouvelle réservation
              </Link>
              <Link to="/checkin" className="block rounded-lg bg-slate-50 px-3 py-2 font-medium text-slate-700 hover:bg-slate-100">
                📷 Check-in invité (QR)
              </Link>
              {canSeeFinance && (
                <Link to="/charges?new=1" className="block rounded-lg bg-slate-50 px-3 py-2 font-medium text-slate-700 hover:bg-slate-100">
                  💰 Ajouter une charge
                </Link>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
