import Link from "next/link";
import type { EpisodeView } from "@/lib/queries";

const TABS = [
  { key: "overview", label: "Pipeline", href: "" },
  { key: "cast", label: "Cast & locations", href: "/cast" },
  { key: "shots", label: "Shot board", href: "/shots" },
  { key: "voice", label: "Voice", href: "/voice" },
  { key: "assets", label: "Assets", href: "/assets" },
] as const;

export function EpisodeHeader({
  episode,
  active,
}: {
  episode: EpisodeView;
  active: (typeof TABS)[number]["key"] | "step";
}) {
  return (
    <div className="mb-6">
      <nav className="flex items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="hover:text-foreground">
          Dashboard
        </Link>
        <span>/</span>
        <Link href={`/episodes/${episode.code}`} className="hover:text-foreground">
          {episode.code}
        </Link>
      </nav>
      <div className="mt-2 flex flex-wrap items-baseline gap-3">
        <span className="rounded-md bg-accent-soft px-2 py-0.5 font-mono text-xs font-medium text-accent">
          {episode.code}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">{episode.title}</h1>
      </div>
      {episode.logline && episode.logline !== "TBD" && (
        <p className="mt-1 max-w-3xl text-sm text-muted">{episode.logline}</p>
      )}
      <nav className="mt-4 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => {
          const on = t.key === active || (active === "step" && t.key === "overview");
          return (
            <Link
              key={t.key}
              href={`/episodes/${episode.code}${t.href}`}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${
                on ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
