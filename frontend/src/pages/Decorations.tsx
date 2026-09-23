import { SimpleCrudPage } from "../components/crud/SimpleCrudPage";

interface Decoration {
  id: string;
  nom: string;
  type: string;
  stockDisponible?: number | null;
  prixLocation?: number | string | null;
}

export default function Decorations() {
  return (
    <SimpleCrudPage<Decoration>
      title="Décorations"
      endpoint="/decorations"
      newButtonLabel="+ Nouvelle décoration"
      fields={[
        { name: "nom", label: "Nom", required: true },
        {
          name: "type",
          label: "Type",
          type: "select",
          required: true,
          options: [
            { value: "FLEURS", label: "Fleurs" },
            { value: "TAPIS", label: "Tapis" },
            { value: "CHAISES", label: "Chaises" },
            { value: "TABLES", label: "Tables" },
            { value: "SCULPTURE", label: "Sculpture" }
          ]
        },
        { name: "stockDisponible", label: "Stock disponible", type: "number" },
        { name: "prixLocation", label: "Prix location (DA)", type: "number" }
      ]}
      columns={[
        { header: "Nom", accessor: (d) => d.nom, searchValue: (d) => d.nom },
        { header: "Type", accessor: (d) => d.type },
        { header: "Stock", accessor: (d) => d.stockDisponible ?? "—" },
        { header: "Prix", accessor: (d) => (d.prixLocation ? `${d.prixLocation} DA` : "—") }
      ]}
    />
  );
}
