import { SimpleCrudPage } from "../components/crud/SimpleCrudPage";
import type { Client } from "../types";

export default function Clients() {
  return (
    <SimpleCrudPage<Client>
      title="Clients"
      endpoint="/clients"
      newButtonLabel="+ Nouveau client"
      fields={[
        { name: "nom", label: "Nom", required: true },
        { name: "prenom", label: "Prénom" },
        { name: "telephone", label: "Téléphone", type: "tel" },
        { name: "email", label: "Email", type: "email" },
        { name: "adresse", label: "Adresse" }
      ]}
      columns={[
        { header: "Nom", accessor: (c) => `${c.nom} ${c.prenom ?? ""}`, searchValue: (c) => `${c.nom} ${c.prenom ?? ""}` },
        { header: "Téléphone", accessor: (c) => c.telephone ?? "—", searchValue: (c) => c.telephone ?? "" },
        { header: "Email", accessor: (c) => c.email ?? "—", searchValue: (c) => c.email ?? "" },
        { header: "Adresse", accessor: (c) => c.adresse ?? "—" }
      ]}
    />
  );
}
