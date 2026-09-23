import { SimpleCrudPage } from "../components/crud/SimpleCrudPage";
import type { Salle } from "../types";

export default function Salles() {
  return (
    <SimpleCrudPage<Salle>
      title="Salles"
      endpoint="/salles"
      newButtonLabel="+ Nouvelle salle"
      fields={[
        { name: "nom", label: "Nom", required: true },
        { name: "localisation", label: "Localisation" },
        { name: "capacite", label: "Capacité", type: "number" },
        { name: "tarif", label: "Tarif (DA)", type: "number" },
        { name: "lienLocalisation", label: "Lien Google Maps", type: "url" }
      ]}
      columns={[
        { header: "Nom", accessor: (s) => s.nom, searchValue: (s) => s.nom },
        { header: "Localisation", accessor: (s) => s.localisation ?? "—" },
        { header: "Capacité", accessor: (s) => s.capacite ?? "—" },
        { header: "Tarif", accessor: (s) => (s.tarif ? `${s.tarif} DA` : "—") }
      ]}
    />
  );
}
