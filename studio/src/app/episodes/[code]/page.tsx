import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ActionButton } from "@/components/client";
import { IconArrowRight, IconCheck, IconLock } from "@/components/icons";
import { BTN_PRIMARY, Card, docUrl, Progress, Skeleton, StatusPill } from "@/components/ui";
import { reimportEpisode } from "@/lib/actions";
import { stepUrl } from "@/lib/pipeline";
import { getWorkspace, type WorkspaceFile } from "@/lib/workspace";
import { getLibrary } from "@/lib/library-server";
import { EpisodeHeader } from "./header";
import { LibraryCard } from "./library-card";

export default function EpisodePage({ params }: PageProps<"/episodes/[code]">) {
  return (
    <Suspense fallback={<Skeleton rows={8} />}>
      <Overview params={params} />
    </Suspense>
  );
}

async function Overview({ params }: { params: PageProps<"/episodes/[code]">["params"] }) {
  const { code } = await params;
  const [ws, library] = await Promise.all([getWorkspace(code), getLibrary()]);
  if (!ws) notFound();
  const { episode: ep, stages, current } = ws;
  const total = ws.files.length;

  const info = [
    ["Logline", ep.logline],
    ["Length", ep.length],
    ["Style", ep.style],
    ["Story shape", ep.storyShape],
    ["Cast", ep.cast],
  ].filter(([, v]) => v && v !== "TBD");

  return (
    <>
      <EpisodeHeader episode={ep} active="overview" />

      {current ? (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-4 border-accent/30 bg-linear-to-r from-accent-soft to-white p-5">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-accent">
              Up next · Stage {stages.find((s) => s.key === current.stageKey)?.number} of 10
            </div>
            <div className="mt-1 text-lg font-semibold">{current.title}</div>
            <div className="text-sm text-muted">{current.summary}</div>
          </div>
          <Link href={stepUrl(ep.code, current)} className={`${BTN_PRIMARY} px-4! py-2!`}>
            {current.words ? "Continue" : "Start"} {current.title} <IconArrowRight width={16} height={16} />
          </Link>
        </Card>
      ) : (
        <Card className="mb-6 border-emerald-200 bg-emerald-50 p-5">
          <div className="font-semibold text-emerald-800">All 16 files are complete 🎬</div>
          <div className="text-sm text-emerald-700">Finish the media on the Cast, Shot board and Voice tabs, then edit and publish.</div>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="space-y-3">
          {stages.map((stage) => (
            <Card key={stage.key} className={`overflow-hidden ${stage.status === "locked" ? "opacity-70" : ""}`}>
              <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3">
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                    stage.status === "done"
                      ? "bg-emerald-500 text-white"
                      : stage.status === "locked"
                        ? "bg-slate-100 text-slate-400"
                        : "bg-accent text-white"
                  }`}
                >
                  {stage.status === "done" ? <IconCheck width={16} height={16} /> : stage.number}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{stage.title}</h2>
                    <span className="font-mono text-xs text-slate-400">{stage.key}/</span>
                  </div>
                  <p className="text-xs text-muted">{stage.description}</p>
                </div>
                <span className="text-xs text-muted tabular-nums">
                  {stage.done}/{stage.files.length}
                </span>
                <StatusPill status={stage.status} />
              </div>
              {stage.status === "locked" ? (
                <p className="flex items-center gap-2 px-5 py-2.5 text-xs text-slate-400">
                  <IconLock width={12} height={12} />
                  {stage.files.map((f) => f.title).join(" · ")}
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {stage.files.map((f) => (
                    <FileRow key={f.path} code={ep.code} file={f} />
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </section>

        <aside className="space-y-4">
          <Card className="p-4">
            <Progress value={ws.done} total={total} label="Files complete" />
          </Card>
          <LibraryCard
            code={ep.code}
            library={library}
            story={ep.libraryStory ?? ""}
            cast={ep.libraryCast ?? []}
            locations={ep.libraryLocations ?? []}
          />
          {info.length > 0 && (
            <Card className="space-y-3 p-4 text-sm">
              {info.map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs uppercase tracking-wider text-muted">{k}</div>
                  <div className="mt-0.5">{v}</div>
                </div>
              ))}
            </Card>
          )}
          <Card className="space-y-3 p-4 text-sm">
            <div className="text-xs uppercase tracking-wider text-muted">Repo</div>
            <Link className="block text-accent hover:underline" href={docUrl(`${ep.folder}/README.md`)}>
              {ep.folder}/README.md
            </Link>
            <ActionButton action={reimportEpisode.bind(null, ep.folder)} pendingText="Re-importing…">
              Re-import {ep.folder}
            </ActionButton>
            <p className="text-xs text-muted">
              Edited a file outside the studio? Re-import to refresh the shot board and cast.
            </p>
          </Card>
        </aside>
      </div>
    </>
  );
}

function FileRow({ code, file }: { code: string; file: WorkspaceFile }) {
  const body = (
    <div className="flex items-center gap-3 px-5 py-3">
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
          file.status === "done"
            ? "bg-emerald-50 text-emerald-600"
            : file.locked
              ? "bg-slate-50 text-slate-300"
              : "bg-accent-soft text-accent"
        }`}
      >
        {file.status === "done" ? (
          <IconCheck width={14} height={14} />
        ) : file.locked ? (
          <IconLock width={13} height={13} />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-medium">{file.title}</div>
        <div className="truncate text-xs text-muted">
          <span className="font-mono">{file.path.split("/")[1]}</span> · {file.summary}
        </div>
      </div>
      {file.words > 0 && <span className="hidden text-xs text-muted tabular-nums sm:inline">{file.words.toLocaleString()} words</span>}
      <StatusPill status={file.locked ? "locked" : file.status} />
    </div>
  );
  if (file.locked) return <li className="cursor-not-allowed">{body}</li>;
  return (
    <li>
      <Link href={stepUrl(code, file)} className="block transition hover:bg-panel-2/50">
        {body}
      </Link>
    </li>
  );
}
