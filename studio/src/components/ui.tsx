import Link from "next/link";
import type { ReactNode } from "react";

export const STATUS_STYLES: Record<string, string> = {
  todo: "bg-slate-100 text-slate-600 ring-slate-200",
  in_progress: "bg-amber-50 text-amber-700 ring-amber-200",
  generated: "bg-sky-50 text-sky-700 ring-sky-200",
  done: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  locked: "bg-slate-50 text-slate-400 ring-slate-200",
};

export const STATUS_LABELS: Record<string, string> = {
  todo: "To do",
  in_progress: "In progress",
  generated: "Generated",
  done: "Done",
  approved: "Approved",
  rejected: "Rejected",
  locked: "Locked",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status] ?? STATUS_STYLES.todo}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function Progress({ value, total, label }: { value: number; total: number; label?: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums">
          {value}/{total}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-panel-2">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-line bg-panel shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted">{label}</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
        </div>
        {icon && (
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent-soft text-accent">{icon}</span>
        )}
      </div>
      {hint && <div className="mt-2 text-xs text-muted">{hint}</div>}
    </Card>
  );
}

export function PageTitle({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export const BTN =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-panel-2 disabled:cursor-not-allowed disabled:opacity-50";
export const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";
export const INPUT =
  "w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15";

export function ButtonLink({
  href,
  children,
  primary,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <Link href={href} className={primary ? BTN_PRIMARY : BTN}>
      {children}
    </Link>
  );
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-7 w-64 rounded bg-slate-200" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-16 rounded-xl bg-slate-200/60" />
      ))}
    </div>
  );
}

export function fileUrl(rel: string, version?: string) {
  return `/api/files/${rel.split("/").map(encodeURIComponent).join("/")}${version ? `?v=${encodeURIComponent(version)}` : ""}`;
}

export function docUrl(rel: string) {
  return `/docs/${rel.split("/").map(encodeURIComponent).join("/")}`;
}
