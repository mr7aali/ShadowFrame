import Link from "next/link";
import { IconCheck, IconLock } from "@/components/icons";
import { moduleUrl } from "@/lib/pipeline";
import type { EpisodeView } from "@/lib/queries";
import { getMediaStatus, withMedia } from "@/lib/production";
import { getWorkspace } from "@/lib/workspace";

/**
 * Episode title + module navigation: Overview · Idea · Script · Voice · … · Publish · Assets.
 * `active` is "overview", "assets", or a module key.
 */
export async function EpisodeHeader({ episode, active }: { episode: EpisodeView; active: string }) {
  const ws = await getWorkspace(episode.code);
  const stages = ws ? withMedia(ws.stages, await getMediaStatus(episode.code, episode.folder)) : [];

  const tab = (on: boolean) =>
    `-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${
      on ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"
    }`;

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
        <span className="rounded-md bg-accent-soft px-2 py-0.5 font-mono text-xs font-medium text-accent">{episode.code}</span>
        <h1 className="text-2xl font-semibold tracking-tight">{episode.title}</h1>
        {ws && (
          <span className="text-xs text-muted tabular-nums">
            {stages.filter((s) => s.status === "done").length}/{stages.length} modules
          </span>
        )}
      </div>
      {episode.logline && episode.logline !== "TBD" && <p className="mt-1 max-w-3xl text-sm text-muted">{episode.logline}</p>}

      <nav className="mt-4 flex gap-0.5 overflow-x-auto border-b border-line">
        <Link href={`/episodes/${episode.code}`} className={tab(active === "overview")}>
          Overview
        </Link>
        {stages.map((s) => (
          <Link key={s.key} href={moduleUrl(episode.code, s.key)} className={tab(active === s.key)} title={s.description}>
            {s.status === "done" ? (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-white">
                <IconCheck width={10} height={10} strokeWidth={3} />
              </span>
            ) : s.status === "locked" ? (
              <IconLock width={12} height={12} className="text-slate-300" />
            ) : (
              <span className={`grid h-4 w-4 place-items-center rounded-full text-[10px] ${active === s.key ? "bg-accent text-white" : "bg-accent-soft text-accent"}`}>
                {s.number}
              </span>
            )}
            {s.title}
          </Link>
        ))}
        <Link href={`/episodes/${episode.code}/assets`} className={tab(active === "assets")}>
          Assets
        </Link>
      </nav>
    </div>
  );
}
