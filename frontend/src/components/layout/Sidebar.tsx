import { NavLink } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import type { Role } from "../../types";

interface NavItem {
  to: string;
  label: string;
  roles?: Role[];
}

// Mirrors the original app's menu Show-if gates (see the spec's Views tab):
// Admin-only / Admin+Gerant / any signed-in user.
const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Général",
    items: [{ to: "/", label: "Tableau de bord" }]
  },
  {
    title: "Réservations",
    items: [
      { to: "/reservations", label: "Réservations" },
      { to: "/salles", label: "Salles" },
      { to: "/checkin", label: "Check-in QR" },
      { to: "/demandes", label: "Demandes de réservation" }
    ]
  },
  {
    title: "Clients & Invités",
    items: [
      { to: "/clients", label: "Clients" },
      { to: "/confiscations", label: "Confiscations téléphones" }
    ]
  },
  {
    title: "Gestion d'entreprise",
    items: [
      { to: "/charges", label: "Charges", roles: ["ADMIN", "GERANT"] },
      { to: "/fournisseurs", label: "Fournisseurs", roles: ["ADMIN"] },
      { to: "/traiteurs", label: "Traiteurs" },
      { to: "/decorations", label: "Décorations" }
    ]
  },
  {
    title: "Administration",
    items: [
      { to: "/employes", label: "Employés", roles: ["ADMIN"] },
      { to: "/historique-paie", label: "Historique de paie", roles: ["ADMIN", "GERANT"] },
      { to: "/utilisateurs", label: "Utilisateurs", roles: ["ADMIN"] },
      { to: "/admin-config", label: "Configuration", roles: ["ADMIN"] }
    ]
  }
];

export function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
        <span className="text-xl">🏰</span>
        <span className="text-lg font-semibold text-slate-800">KasrEvent</span>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter((item) => !item.roles || (user && item.roles.includes(user.role)));
          if (items.length === 0) return null;
          return (
            <div key={section.title}>
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{section.title}</p>
              <div className="mt-2 space-y-1">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive ? "bg-brand-500 text-white" : "text-slate-600 hover:bg-slate-100"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
