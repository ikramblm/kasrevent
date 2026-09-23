import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

export function KpiCard({ label, value, tone = "slate" }: { label: string; value: string; tone?: "slate" | "green" | "red" | "orange" }) {
  const toneClasses: Record<string, string> = {
    slate: "text-slate-900",
    green: "text-emerald-600",
    red: "text-rose-600",
    orange: "text-amber-600"
  };
  return (
    <Card>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClasses[tone]}`}>{value}</p>
    </Card>
  );
}
