const STYLES: Record<string, string> = {
  EN_ATTENTE: "bg-amber-100 text-amber-800",
  CONFIRMEE: "bg-emerald-100 text-emerald-800",
  ANNULEE: "bg-rose-100 text-rose-800",
  CLOTURE: "bg-yellow-100 text-yellow-800",
  VALIDE: "bg-emerald-100 text-emerald-800",
  EXPIRE: "bg-rose-100 text-rose-800",
  CONFISQUE: "bg-rose-100 text-rose-800",
  RESTITUE: "bg-emerald-100 text-emerald-800",
  CONFIRME: "bg-emerald-100 text-emerald-800",
  NON_CONFIRME: "bg-rose-100 text-rose-800"
};

const LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  CONFIRMEE: "Confirmée",
  ANNULEE: "Annulée",
  CLOTURE: "Clôturé",
  VALIDE: "Valide",
  EXPIRE: "Expiré",
  CONFISQUE: "Confisqué",
  RESTITUE: "Restitué",
  CONFIRME: "Confirmé",
  NON_CONFIRME: "Non confirmé"
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status] ?? "bg-slate-100 text-slate-700"}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
