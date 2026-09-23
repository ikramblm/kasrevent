import { useAuth } from "../../auth/AuthContext";

const ROLE_LABELS: Record<string, string> = { ADMIN: "Admin", GERANT: "Gérant", USER: "Utilisateur" };

export function Header({ title }: { title: string }) {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
      <div className="flex items-center gap-4">
        {user && (
          <div className="text-right">
            <p className="text-sm font-medium text-slate-800">{user.nom}</p>
            <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
}
