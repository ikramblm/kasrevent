import { SimpleCrudPage } from "../components/crud/SimpleCrudPage";
import type { Traiteur } from "../types";

export default function Traiteurs() {
  return (
    <SimpleCrudPage<Traiteur>
      title="Traiteurs"
      endpoint="/traiteurs"
      newButtonLabel="+ Nouveau traiteur"
      fields={[
        { name: "nom", label: "Nom", required: true },
        { name: "telephone", label: "Téléphone", type: "tel" },
        { name: "adresse", label: "Adresse" },
        { name: "siteWeb", label: "Site web", type: "url" }
      ]}
      columns={[
        { header: "Nom", accessor: (t) => t.nom, searchValue: (t) => t.nom },
        { header: "Téléphone", accessor: (t) => t.telephone ?? "—" },
        { header: "Dettes", accessor: (t) => `${Number(t.dettes).toLocaleString("fr-FR")} DA` }
      ]}
    />
  );
}
