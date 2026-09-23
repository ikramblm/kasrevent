import { useMemo, useState, type ReactNode } from "react";

export interface Column<T> {
  header: string;
  accessor: (row: T) => ReactNode;
  searchValue?: (row: T) => string;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  actions,
  emptyLabel = "Aucun résultat"
}: {
  columns: Column<T>[];
  rows: T[];
  actions?: (row: T) => ReactNode;
  emptyLabel?: string;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const term = search.toLowerCase();
    return rows.filter((row) => columns.some((col) => col.searchValue?.(row).toLowerCase().includes(term)));
  }, [rows, search, columns]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <input
          type="search"
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <span className="text-sm text-slate-500">{filtered.length} résultat(s)</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((col) => (
                <th key={col.header} className="px-4 py-3 text-left font-semibold text-slate-600">
                  {col.header}
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-slate-400">
                  {emptyLabel}
                </td>
              </tr>
            )}
            {filtered.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                {columns.map((col) => (
                  <td key={col.header} className="px-4 py-3 text-slate-700">
                    {col.accessor(row)}
                  </td>
                ))}
                {actions && <td className="px-4 py-3 text-right">{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
