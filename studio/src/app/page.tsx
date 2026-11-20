import Link from "next/link";
import { Suspense } from "react";
import { ActionButton } from "@/components/client";
import { IconArrowRight, IconFilm, IconImage, IconLayers, IconPlug } from "@/components/icons";
import { BTN_PRIMARY, ButtonLink, Card, PageTitle, Skeleton, StatCard, StatusPill } from "@/components/ui";
import { CAPABILITIES, providerInfo } from "@/lib/ai/catalog";
import { getAiPublic } from "@/lib/ai/settings";
import { importAllEpisodes } from "@/lib/actions";
import { PIPELINE, stepUrl } from "@/lib/pipeline";
import { getEpisodes } from "@/lib/queries";
import { getWorkspace } from "@/lib/workspace";

export default function Dashboard() {
  return (
    <>
      <PageTitle
        title="Dashboard"
        subtitle="Make each episode from idea to upload, one step at a time. Every step unlocks when the one before it is complete."
        actions={
          <>
            <ActionButton action={importAllEpisodes} pendingText="Importing…">
              Re-import from repo
            </ActionButton>
            <ButtonLink href="/episodes/new" primary>
              + New episode
            </ButtonLink>
          </>
        }
      />
      <Suspense fallback={<Skeleton rows={4} />}>
        <Overview />
      </Suspense>
    </>
  );
}

async function Overview() {
  const [episodes, ai] = await Promise.all([getEpisodes(), getAiPublic()]);
  const workspaces = (await Promise.all(episodes.map((e) => getWorkspace(e.code)))).filter((w) => w !== null);
  const total = PIPELINE.reduce((n, s) => n + s.files.length, 0);
  const filesDone = workspaces.reduce((n, w) => n + w.done, 0);
  const shotsApproved = episodes.reduce((n, e) => n + e.shotsApproved, 0);
  const shotsTotal = episodes.reduce((n, e) => n + e.shotsTotal, 0);
  const connected = ai.providers.filter((p) => p.connected).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Episodes" value={episodes.length} icon={<IconFilm />} hint={`${workspaces.filter((w) => w.done === total).length} finished`} />
        <StatCard
          label="Pipeline files done"
          value={`${filesDone}/${workspaces.length * total}`}
          icon={<IconLayers />}
          hint="16 files per episode"
        />
        <StatCard label="Shots approved" value={`${shotsApproved}/${shotsTotal}`} icon={<IconImage />} hint="Across all episodes" />
        <StatCard
          label="AI providers"
          value={connected}
          icon={<IconPlug />}
          hint={
            <Link href="/settings/ai" className="text-accent hover:underline">
              {connected ? "Manage connections" : "Connect an API →"}
            </Link>
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <h2 className="font-semibold">Episodes</h2>
            <span className="text-xs text-muted">{episodes.length} total</span>
          </div>
          {!workspaces.length ? (
            <div className="p-10 text-center">
              <p className="text-lg font-medium">No episodes yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                Start a new episode and the studio walks you through all 16 files, or import the{" "}
                <code>video_N/</code> folders already in the repo.
              </p>
              <div className="mt-6 flex justify-center gap-2">
                <ActionButton action={importAllEpisodes} pendingText="Importing…">
                  Import from repo
                </ActionButton>
                <ButtonLink href="/episodes/new" primary>
                  + New episode
                </ButtonLink>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-panel-2/60 text-left text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Episode</th>
                    <th className="px-3 py-2.5 font-medium">Modules</th>
                    <th className="px-3 py-2.5 font-medium">Shots</th>
                    <th className="px-3 py-2.5 font-medium">Next step</th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {workspaces.map((w) => {
                    const e = episodes.find((x) => x.code === w.episode.code)!;
                    return (
                      <tr key={e.code} className="hover:bg-panel-2/40">
                        <td className="px-5 py-3.5">
                          <Link href={`/episodes/${e.code}`} className="group">
                            <span className="font-mono text-xs text-accent">{e.code}</span>
                            <div className="font-medium group-hover:text-accent">{e.title}</div>
                          </Link>
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex gap-1" title={`${w.done}/${total} files done`}>
                            {w.stages.map((s) => (
                              <span
                                key={s.key}
                                title={`${s.number}. ${s.title}`}
                                className={`h-2 w-4 rounded-full ${
                                  s.status === "done"
                                    ? "bg-emerald-500"
                                    : s.status === "in_progress" || s.status === "todo"
                                      ? "bg-accent/60"
                                      : "bg-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                          <div className="mt-1 text-xs text-muted">
                            {w.done}/{total} files
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-xs text-muted tabular-nums">
                          {e.shotsTotal ? `${e.shotsApproved}/${e.shotsTotal} approved` : "—"}
                        </td>
                        <td className="px-3 py-3.5">
                          {w.current ? (
                            <div>
                              <div className="text-xs text-muted">
                                Module {w.stages.find((s) => s.key === w.current!.stageKey)?.number} ·{" "}
                                {w.stages.find((s) => s.key === w.current!.stageKey)?.title}
                              </div>
                              <div className="font-medium">{w.current.title}</div>
                            </div>
                          ) : (
                            <StatusPill status="done" />
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={w.current ? stepUrl(e.code, w.current) : `/episodes/${e.code}`}
                            className={`${BTN_PRIMARY} whitespace-nowrap`}
                          >
                            {w.current ? "Continue" : "Open"} <IconArrowRight width={16} height={16} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">AI routing</h2>
              <Link href="/settings/ai" className="text-xs text-accent hover:underline">
                Edit
              </Link>
            </div>
            <ul className="space-y-3 text-sm">
              {CAPABILITIES.map((c) => {
                const r = ai.routing[c.key];
                return (
                  <li key={c.key} className="flex items-center justify-between gap-3">
                    <span className="text-muted">{c.label}</span>
                    {r.provider ? (
                      <span className="truncate text-right">
                        <span className="font-medium">{providerInfo(r.provider)?.name}</span>
                        <span className="block font-mono text-[11px] text-muted">{r.model}</span>
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 ring-1 ring-amber-200">
                        Copy & paste
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
              Without an API, every step still gives you a ready prompt to copy into your AI tool.
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Idea to video in 9 modules</h2>
            <ol className="space-y-2 text-sm">
              {PIPELINE.map((s) => (
                <li key={s.key} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-panel-2 font-mono text-[11px] text-muted">
                    {s.number}
                  </span>
                  <span>
                    <span className="font-medium">{s.title}</span>
                    <span className="block text-xs text-muted">{s.description}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
