import { SimpleCrudPage } from "../components/crud/SimpleCrudPage";
import { StatusBadge } from "../components/ui/StatusBadge";
import type { Fournisseur } from "../types";

export default function Fournisseurs() {
  return (
    <SimpleCrudPage<Fournisseur>
      title="Fournisseurs"
      endpoint="/fournisseurs"
      newButtonLabel="+ Nouveau fournisseur"
      fields={[
        { name: "company", label: "Société", required: true },
        { name: "nom", label: "Contact" },
        { name: "tel", label: "Téléphone", type: "tel" },
        { name: "adresse", label: "Adresse" }
      ]}
      columns={[
        { header: "Société", accessor: (f) => f.company, searchValue: (f) => f.company },
        { header: "Contact", accessor: (f) => f.nom ?? "—" },
        { header: "Téléphone", accessor: (f) => f.tel ?? "—" },
        {
          header: "Dettes",
          accessor: (f) => (Number(f.dettes) > 0 ? <StatusBadge status="CONFISQUE" /> : <StatusBadge status="RESTITUE" />)
        },
        { header: "Montant", accessor: (f) => `${Number(f.dettes).toLocaleString("fr-FR")} DA` }
      ]}
    />
  );
}
